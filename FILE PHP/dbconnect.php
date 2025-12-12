<?php
header("Access-Control-Allow-Origin: *");

$servername = "localhost";
$username = "react_[NRP]";     
$password = "ubaya";
$dbname = "react_[NRP]";       

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["result" => "error", "message" => "Unable to connect to DB"]));
}
?>
