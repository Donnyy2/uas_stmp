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
$amount = isset($_POST['amount']) ? $_POST['amount'] : '';

if ($user_name === '' || $amount === '') {
    echo json_encode(["result" => "fail", "message" => "Missing required fields"]);
    exit();
}

// allow int/float values
$amountNormalized = str_replace(',', '.', trim((string)$amount));
if (!is_numeric($amountNormalized)) {
    echo json_encode(["result" => "fail", "message" => "Amount must be a number"]);
    exit();
}

$amountValue = (float)$amountNormalized;

$sql = "UPDATE UAS_users SET saldo = saldo + ? WHERE user_name=?";
$stmt = $conn->prepare($sql);
$stmt || die(json_encode(["result" => "fail", "message" => $conn->error]));
$stmt->bind_param("ds", $amountValue, $user_name);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["result" => "success"]);
} else {
    echo json_encode(["result" => "fail", "message" => $conn->error]);
}

$conn->close();
?>
