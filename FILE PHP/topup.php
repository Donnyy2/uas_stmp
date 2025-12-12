<?php
header("Access-Control-Allow-Origin: *");
include("dbconnect.php");
extract($_POST);

$sql = "UPDATE users SET saldo = saldo + ? WHERE user_name=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $amount, $user_name);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["result" => "success"]);
} else {
    echo json_encode(["result" => "fail", "message" => $conn->error]);
}

$conn->close();
?>
