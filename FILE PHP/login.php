<?php
header("Access-Control-Allow-Origin: *");
include("dbconnect.php");
extract($_POST);

$sql = "SELECT * FROM users WHERE user_id=? AND user_password=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $user_id, $user_password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $r = mysqli_fetch_assoc($result);
    echo json_encode([
        "result" => "success",
        "user_name" => $r["user_name"],
        "saldo" => $r["saldo"]
    ]);
} else {
    echo json_encode(["result" => "fail"]);
}

$conn->close();
?>
