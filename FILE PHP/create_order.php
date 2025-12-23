<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

include("dbconnect.php");

$user_name = isset($_POST['user_name']) ? trim($_POST['user_name']) : '';
$schedule_id = isset($_POST['schedule_id']) ? intval($_POST['schedule_id']) : 0;
$seatsRaw = isset($_POST['seats']) ? trim($_POST['seats']) : '';
$itemsRaw = isset($_POST['items']) ? trim($_POST['items']) : ''; // format: productId:qty,productId:qty

if ($user_name === '') {
    echo json_encode(["result" => "fail", "message" => "Missing user_name"]);
    exit();
}

// Parse seats: A-1,B-2 (optional)
$seats = [];
if ($seatsRaw !== '') {
    $parts = array_filter(array_map('trim', explode(',', $seatsRaw)));
    foreach ($parts as $p) {
        if (!preg_match('/^([A-H])-(\d{1,2})$/', $p, $m)) {
            echo json_encode(["result" => "fail", "message" => "Invalid seat format"]);
            exit();
        }
        $row = $m[1];
        $col = intval($m[2]);
        if ($col < 1 || $col > 8) {
            echo json_encode(["result" => "fail", "message" => "Invalid seat column"]);
            exit();
        }
        $key = $row . '-' . $col;
        $seats[$key] = ["row" => $row, "col" => $col];
    }
}

// Parse items: 1:2,3:1 (optional)
$items = []; // product_id => qty
if ($itemsRaw !== '') {
    $parts = array_filter(array_map('trim', explode(',', $itemsRaw)));
    foreach ($parts as $p) {
        $kv = array_map('trim', explode(':', $p));
        if (count($kv) !== 2) {
            echo json_encode(["result" => "fail", "message" => "Invalid items format"]);
            exit();
        }
        $pid = intval($kv[0]);
        $qty = intval($kv[1]);
        if ($pid <= 0 || $qty <= 0) {
            echo json_encode(["result" => "fail", "message" => "Invalid item quantity"]);
            exit();
        }
        if (!isset($items[$pid])) $items[$pid] = 0;
        $items[$pid] += $qty;
    }
}

if ($schedule_id <= 0 && count($items) === 0) {
    echo json_encode(["result" => "fail", "message" => "Pilih tiket atau makanan/minuman terlebih dahulu"]);
    exit();
}

if ($schedule_id > 0 && count($seats) === 0) {
    // For ticket orders, seats are required (8x8 seat map requirement)
    echo json_encode(["result" => "fail", "message" => "Pilih kursi terlebih dahulu"]);
    exit();
}

$conn->begin_transaction();
try {
    // 1) Lock user saldo
    $sqlUser = "SELECT saldo FROM UAS_users WHERE user_name = ? FOR UPDATE";
    $stmtUser = $conn->prepare($sqlUser);
    if (!$stmtUser) throw new Exception($conn->error);
    $stmtUser->bind_param("s", $user_name);
    $stmtUser->execute();
    $resUser = $stmtUser->get_result();
    $userRow = $resUser->fetch_assoc();
    if (!$userRow) {
        throw new Exception("User tidak ditemukan");
    }

    // 2) Compute totals from DB (avoid client tampering)
    $ticketPrice = 0.0;
    $ticketTotal = 0.0;
    $movieTitle = null;
    $showTime = null;
    $studioName = null;

    if ($schedule_id > 0) {
        $sqlSchedule = "SELECT s.price, s.show_time, s.studio_name, m.title
                        FROM UAS_schedules s
                        JOIN movie m ON s.movie_id = m.movie_id
                        WHERE s.id = ?";
        $stmtSch = $conn->prepare($sqlSchedule);
        if (!$stmtSch) throw new Exception($conn->error);
        $stmtSch->bind_param("i", $schedule_id);
        $stmtSch->execute();
        $resSch = $stmtSch->get_result();
        $sch = $resSch->fetch_assoc();
        if (!$sch) {
            throw new Exception("Jadwal tidak ditemukan");
        }
        $ticketPrice = floatval($sch['price']);
        $ticketTotal = $ticketPrice * count($seats);
        $movieTitle = $sch['title'];
        $showTime = $sch['show_time'];
        $studioName = $sch['studio_name'];
    }

    $itemsTotal = 0.0;
    $itemRows = []; // array of [product_id, name, type, unit_price, qty]
    if (count($items) > 0) {
        // Fetch product prices
        $ids = array_keys($items);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = str_repeat('i', count($ids));

        $sqlProd = "SELECT id, name, category AS type, price
                FROM UAS_menu
                WHERE is_available = 1 AND id IN ($placeholders)";
        $stmtProd = $conn->prepare($sqlProd);
        if (!$stmtProd) throw new Exception($conn->error);

        // bind_param with variable args
        $bindArgs = [];
        $bindArgs[] = &$types;
        foreach ($ids as $k => $idv) {
            $ids[$k] = intval($idv);
            $bindArgs[] = &$ids[$k];
        }
        call_user_func_array([$stmtProd, 'bind_param'], $bindArgs);

        $stmtProd->execute();
        $resProd = $stmtProd->get_result();

        $found = [];
        while ($p = $resProd->fetch_assoc()) {
            $pid = intval($p['id']);
            $qty = intval($items[$pid]);
            $unit = floatval($p['price']);
            $itemsTotal += $unit * $qty;
            $itemRows[] = [
                'product_id' => $pid,
                'name' => $p['name'],
                'type' => $p['type'],
                'unit_price' => $unit,
                'qty' => $qty,
            ];
            $found[$pid] = true;
        }

        foreach ($items as $pid => $qty) {
            if (!isset($found[$pid])) {
                throw new Exception("Produk tidak ditemukan: $pid");
            }
        }
    }

    $total = $ticketTotal + $itemsTotal;

    if (floatval($userRow['saldo']) < $total) {
        $conn->rollback();
        echo json_encode(["result" => "fail", "message" => "Saldo tidak cukup"]);
        exit();
    }

    // 3) Create order header
    // Requires table UAS_orders(id INT PK AI, user_name VARCHAR, schedule_id INT NULL, ticket_unit_price DOUBLE, total DOUBLE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)
    $sqlOrder = "INSERT INTO UAS_orders (user_name, schedule_id, ticket_unit_price, total) VALUES (?, ?, ?, ?)";
    $stmtOrder = $conn->prepare($sqlOrder);
    if (!$stmtOrder) throw new Exception($conn->error);
    $sidNullable = $schedule_id > 0 ? $schedule_id : null;

    // bind_param doesn't support null int directly; use i with 0 + store NULL via query? easiest: two statements
    if ($schedule_id > 0) {
        $stmtOrder->bind_param("sidd", $user_name, $schedule_id, $ticketPrice, $total);
    } else {
        // schedule_id NULL
        $sqlOrder2 = "INSERT INTO UAS_orders (user_name, schedule_id, ticket_unit_price, total) VALUES (?, NULL, 0, ?)";
        $stmtOrder2 = $conn->prepare($sqlOrder2);
        if (!$stmtOrder2) throw new Exception($conn->error);
        $stmtOrder2->bind_param("sd", $user_name, $total);
        if (!$stmtOrder2->execute()) throw new Exception($conn->error);
        $orderId = $conn->insert_id;
        $stmtOrder2->close();
        goto AFTER_ORDER;
    }

    if (!$stmtOrder->execute()) throw new Exception($conn->error);
    $orderId = $conn->insert_id;

    AFTER_ORDER:

    // 4) Seats: check and insert
    if ($schedule_id > 0) {
        // Requires table UAS_order_seats(order_id INT, schedule_id INT, seat_row CHAR(1), seat_col INT)
        $sqlSeatCheck = "SELECT id FROM UAS_bookings WHERE schedule_id = ? AND seat_row = ? AND seat_col = ? FOR UPDATE";
        $stmtSeatCheck = $conn->prepare($sqlSeatCheck);
        if (!$stmtSeatCheck) throw new Exception($conn->error);

        $sqlSeatIns = "INSERT INTO UAS_bookings (schedule_id, user_name, seat_row, seat_col) VALUES (?, ?, ?, ?)";
        $stmtSeatIns = $conn->prepare($sqlSeatIns);
        if (!$stmtSeatIns) throw new Exception($conn->error);

        $sqlOrderSeat = "INSERT INTO UAS_order_seats (order_id, schedule_id, seat_row, seat_col) VALUES (?, ?, ?, ?)";
        $stmtOrderSeat = $conn->prepare($sqlOrderSeat);
        if (!$stmtOrderSeat) throw new Exception($conn->error);

        foreach ($seats as $s) {
            $seat_row = $s['row'];
            $seat_col = $s['col'];

            $stmtSeatCheck->bind_param("isi", $schedule_id, $seat_row, $seat_col);
            $stmtSeatCheck->execute();
            if ($stmtSeatCheck->get_result()->num_rows > 0) {
                throw new Exception("Kursi sudah dipesan orang lain");
            }

            $stmtSeatIns->bind_param("issi", $schedule_id, $user_name, $seat_row, $seat_col);
            if (!$stmtSeatIns->execute()) {
                throw new Exception("Gagal booking kursi");
            }

            $stmtOrderSeat->bind_param("iisi", $orderId, $schedule_id, $seat_row, $seat_col);
            if (!$stmtOrderSeat->execute()) {
                throw new Exception("Gagal simpan kursi order");
            }
        }
    }

    // 5) Items: insert
    if (count($itemRows) > 0) {
        // Requires table UAS_order_items(order_id INT, product_id INT, name VARCHAR, unit_price DOUBLE, qty INT)
        $sqlItem = "INSERT INTO UAS_order_items (order_id, product_id, name, unit_price, qty) VALUES (?, ?, ?, ?, ?)";
        $stmtItem = $conn->prepare($sqlItem);
        if (!$stmtItem) throw new Exception($conn->error);

        foreach ($itemRows as $it) {
            $pid = intval($it['product_id']);
            $nm = $it['name'];
            $unit = floatval($it['unit_price']);
            $qty = intval($it['qty']);
            $stmtItem->bind_param("iisdi", $orderId, $pid, $nm, $unit, $qty);
            if (!$stmtItem->execute()) {
                throw new Exception("Gagal simpan item");
            }
        }
    }

    // 6) Deduct saldo
    $sqlUpd = "UPDATE UAS_users SET saldo = saldo - ? WHERE user_name = ?";
    $stmtUpd = $conn->prepare($sqlUpd);
    if (!$stmtUpd) throw new Exception($conn->error);
    $stmtUpd->bind_param("ds", $total, $user_name);
    if (!$stmtUpd->execute()) throw new Exception($conn->error);

    $conn->commit();

    echo json_encode([
        "result" => "success",
        "order_id" => $orderId,
        "total" => $total,
        "ticket_unit_price" => $ticketPrice,
        "ticket_seat_count" => count($seats),
        "movie_title" => $movieTitle,
        "show_time" => $showTime,
        "studio_name" => $studioName,
    ]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["result" => "fail", "message" => $e->getMessage()]);
}

$conn->close();
?>
