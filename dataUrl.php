<?php
$img = $_POST["img"];
$pwd = $_POST["password"];
$id = $_POST["id"];
$settings = parse_ini_file("./pwd.ini");
$realPwd = $settings['password'];
if($pwd != $realPwd) throw new Exception('Invalid pwd:' . $pwd . ':' . $realPwd . 'lol');
$image = base64_decode($img);
$myFile = "upload/" . $id . ".jpg";
$fh = fopen($myFile, 'w');
fwrite($fh, $image);
fclose($fh);
header('Content-Type: application/json; charset=utf-8', 200);
$arr = array(
    'stack'=>'overflow',
    'key'=>'value'
);
echo json_encode($arr);
?>