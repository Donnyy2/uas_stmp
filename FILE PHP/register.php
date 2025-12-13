<?php
header("Access-Control-Allow-Origin: *");
include("dbconnect.php");
extract($_POST);

// cek apakah user_id sudah ada
$sql = "SELECT * FROM UAS_users WHERE user_id=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["result" => "fail", "message" => "User already exists"]);
    exit();
}

// insert user baru
$sql = "INSERT INTO users (user_id, user_password, user_name, saldo) VALUES (?,?,?,0)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $user_id, $user_password, $user_name);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["result" => "success"]);
} else {
    echo json_encode(["result" => "fail", "message" => $conn->error]);
}

$conn->close();
?>
