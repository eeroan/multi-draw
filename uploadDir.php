<?php
$code = 200;
$contentType = 'Content-Type: application/json; charset=utf-8';
header($contentType, true, $code);
echo json_encode(glob("upload/*.{jpg,gif,png}", GLOB_BRACE));
?>