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
if ($user_name === '') {
    echo json_encode(["result" => "fail", "message" => "Missing user_name"]);
    exit();
}

// Requires UAS_orders + joins for schedule/movie info
$sql = "SELECT o.id AS order_id, o.total, o.created_at,
               o.schedule_id,
               s.show_time, s.studio_name,
               m.title
        FROM UAS_orders o
        LEFT JOIN UAS_schedules s ON o.schedule_id = s.id
        LEFT JOIN movie m ON s.movie_id = m.movie_id
        WHERE o.user_name = ?
        ORDER BY o.id DESC";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["result" => "fail", "message" => $conn->error]);
    exit();
}
$stmt->bind_param("s", $user_name);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($r = $res->fetch_assoc()) {
    $data[] = $r;
}

echo json_encode(["result" => "success", "data" => $data]);

$conn->close();
?>
