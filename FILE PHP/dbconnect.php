<?php
header("Access-Control-Allow-Origin: *");

$servername = "localhost";
$username = "react_160422136";     
$password = "ubaya";
$dbname = "react_160422136";       

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["result" => "error", "message" => "Unable to connect to DB"]));
}
?>
