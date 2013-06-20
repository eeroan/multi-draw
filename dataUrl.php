<?php
$code = 200;
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
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);
    $arr = array('message' => $code);
    echo json_encode($arr);
} catch(Exception $e) {
    $error = array('message' => $e->getMessage());
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode($arr);
}
?>