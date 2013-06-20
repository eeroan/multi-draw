<?php
$code = 200;
$contentType = 'Content-Type: application/json; charset=utf-8';
try {
    $img = $_POST["img"];
    $pwd = $_POST["password"];
    $id = $_POST["id"];
    $settings = parse_ini_file("./pwd.ini");
    $realPwd = $settings['password'];
    if($pwd != $realPwd) $code = 401;
    $image = base64_decode($img);
    $myFile = "upload/" . $id . ".jpg";
    $fh = fopen($myFile, 'w');
    fwrite($fh, $image);
    fclose($fh);
    header($contentType, true, $code);
    $arr = array('message' => $code);
    echo json_encode($arr);
} catch(Exception $e) {
    $error = array('message' => $e->getMessage(), 'trace' => $e->getTraceAsString());
    header($contentType, true, 500);
    echo json_encode($arr);
}
?>