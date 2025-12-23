<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

include("dbconnect.php");

// Menu endpoint (matches DB: UAS_menu).
// Expected columns: id, location_id, category, name, price, image_url, is_available
$location_id = isset($_GET['location_id']) ? intval($_GET['location_id']) : 0;

if ($location_id > 0) {
    $sql = "SELECT id, name, category AS type, price, image_url, location_id
            FROM UAS_menu
            WHERE is_available = 1 AND location_id = ?
            ORDER BY category, name";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(["result" => "fail", "message" => $conn->error]);
        exit();
    }
    $stmt->bind_param("i", $location_id);
} else {
    $sql = "SELECT id, name, category AS type, price, image_url, location_id
            FROM UAS_menu
            WHERE is_available = 1
            ORDER BY category, name";
    $stmt = $conn->prepare($sql);
}
if (!$stmt) {
    echo json_encode(["result" => "fail", "message" => $conn->error]);
    exit();
}
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($r = $res->fetch_assoc()) {
    $data[] = $r;
}

echo json_encode(["result" => "success", "data" => $data]);

$conn->close();
?>
