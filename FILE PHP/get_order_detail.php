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

$order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
$user_name = isset($_POST['user_name']) ? trim($_POST['user_name']) : '';

if ($order_id <= 0) {
    echo json_encode(["result" => "fail", "message" => "Missing order_id"]);
    exit();
}

// Header + optional movie info
$sql = "SELECT o.id AS order_id, o.user_name, o.total, o.created_at, o.schedule_id,
               s.show_time, s.studio_name, s.price AS schedule_price,
               m.title
        FROM UAS_orders o
        LEFT JOIN UAS_schedules s ON o.schedule_id = s.id
        LEFT JOIN movie m ON s.movie_id = m.movie_id
        WHERE o.id = ?";

if ($user_name !== '') {
    $sql .= " AND o.user_name = ?";
}

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["result" => "fail", "message" => $conn->error]);
    exit();
}

if ($user_name !== '') {
    $stmt->bind_param("is", $order_id, $user_name);
} else {
    $stmt->bind_param("i", $order_id);
}

$stmt->execute();
$res = $stmt->get_result();
$hdr = $res->fetch_assoc();

if (!$hdr) {
    echo json_encode(["result" => "fail", "message" => "Order tidak ditemukan"]);
    exit();
}

// Seats
$seats = [];
$sqlSeats = "SELECT seat_row, seat_col FROM UAS_order_seats WHERE order_id = ? ORDER BY seat_row, seat_col";
$stmtSeats = $conn->prepare($sqlSeats);
if ($stmtSeats) {
    $stmtSeats->bind_param("i", $order_id);
    $stmtSeats->execute();
    $resSeats = $stmtSeats->get_result();
    while ($r = $resSeats->fetch_assoc()) {
        $seats[] = $r['seat_row'] . '-' . $r['seat_col'];
    }
}

// Items
$items = [];
$sqlItems = "SELECT product_id, name, unit_price, qty FROM UAS_order_items WHERE order_id = ? ORDER BY name";
$stmtItems = $conn->prepare($sqlItems);
if ($stmtItems) {
    $stmtItems->bind_param("i", $order_id);
    $stmtItems->execute();
    $resItems = $stmtItems->get_result();
    while ($r = $resItems->fetch_assoc()) {
        $items[] = $r;
    }
}

echo json_encode([
    "result" => "success",
    "order" => $hdr,
    "seats" => $seats,
    "items" => $items
]);

$conn->close();
?>
