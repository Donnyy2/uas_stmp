<?php
header("Access-Control-Allow-Origin: *");
include("dbconnect.php");
extract($_POST);

$sql = "SELECT user_name, saldo FROM UAS_users WHERE user_name=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $user_name);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $r = mysqli_fetch_assoc($result);
    echo json_encode(["result" => "success", "data" => $r]);
} else {
    echo json_encode(["result" => "fail"]);
}

$conn->close();
?>
