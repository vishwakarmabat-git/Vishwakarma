<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Auth-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/ResponseHelper.php';
require_once '../config/ErrorHandler.php';
require_once '../config/AuthMiddleware.php';

\Config\ErrorHandler::register();

$user = \Config\AuthMiddleware::authenticate(['admin', 'super-admin', 'content-manager']);

$uploadDir = realpath(__DIR__ . '/../../assets/uploads/') . DIRECTORY_SEPARATOR;
if (!$uploadDir) {
    $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
}
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        error_log("[upload/image.php] FAILED to create upload directory: " . $uploadDir);
        \Config\ResponseHelper::serverError("Upload directory could not be created. Check server permissions.");
    }
}
if (!is_writable($uploadDir)) {
    error_log("[upload/image.php] Upload directory is not writable: " . $uploadDir);
    \Config\ResponseHelper::serverError("Upload directory is not writable. Check directory permissions.");
}

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
$contentType   = $_SERVER['CONTENT_TYPE'] ?? 'UNKNOWN';
$contentLength = $_SERVER['CONTENT_LENGTH'] ?? 'UNKNOWN';

error_log("[upload/image.php] Request: $requestMethod, Content-Type: $contentType, Content-Length: $contentLength");
error_log("[upload/image.php] upload_max_filesize: " . ini_get('upload_max_filesize') . ", post_max_size: " . ini_get('post_max_size'));

if (strpos($contentType, 'multipart/form-data') === false) {
    error_log("[upload/image.php] Invalid Content-Type: $contentType");
    \Config\ResponseHelper::badRequest("Invalid Content-Type '$contentType'. Expected 'multipart/form-data'.");
}

if (!isset($_FILES['image'])) {
    error_log("[upload/image.php] \$_FILES keys: " . implode(', ', array_keys($_FILES)));
    error_log("[upload/image.php] \$_POST keys: " . implode(', ', array_keys($_POST)));
    error_log("[upload/image.php] No 'image' key in \$_FILES. Ensure the form field name is 'image'.");
    \Config\ResponseHelper::badRequest("No file received. Ensure the form field name is 'image' and Content-Type is multipart/form-data.");
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE   => "The uploaded file exceeds the server upload_max_filesize directive (" . ini_get('upload_max_filesize') . ").",
        UPLOAD_ERR_FORM_SIZE  => "The uploaded file exceeds the MAX_FILE_SIZE directive.",
        UPLOAD_ERR_PARTIAL    => "The uploaded file was only partially uploaded.",
        UPLOAD_ERR_NO_FILE    => "No file was uploaded.",
        UPLOAD_ERR_NO_TMP_DIR => "Server is missing a temporary upload directory.",
        UPLOAD_ERR_CANT_WRITE => "Failed to write file to disk on server.",
        UPLOAD_ERR_EXTENSION  => "A PHP extension stopped the file upload.",
    ];
    $msg = isset($errorMessages[$file['error']]) ? $errorMessages[$file['error']] : "Unknown upload error code: " . $file['error'];
    error_log("[upload/image.php] Upload error: $msg (code: {$file['error']})");
    \Config\ResponseHelper::badRequest($msg);
}

$fileTmpPath = $file['tmp_name'];
$fileName    = $file['name'];
$fileSize    = $file['size'];
$fileType    = $file['type'];

error_log("[upload/image.php] Received file: $fileName, size: $fileSize bytes, type: $fileType, tmp: $fileTmpPath");

if ($fileSize <= 0) {
    error_log("[upload/image.php] File has zero size: $fileName");
    \Config\ResponseHelper::badRequest("The uploaded file appears to be empty.");
}

if ($fileSize > 10 * 1024 * 1024) {
    error_log("[upload/image.php] File exceeds 10MB limit: $fileName ($fileSize bytes)");
    \Config\ResponseHelper::badRequest("File size exceeds 10MB limit.");
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$detectedMime = finfo_file($finfo, $fileTmpPath);
finfo_close($finfo);

error_log("[upload/image.php] Detected MIME: $detectedMime");

$allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'
];
if (!in_array($detectedMime, $allowedMimeTypes)) {
    error_log("[upload/image.php] Rejected file type: $detectedMime for $fileName");
    \Config\ResponseHelper::badRequest("Invalid file type ($detectedMime). Only JPG, PNG, WEBP, GIF and common video formats (MP4, WEBM, OGG, MOV, MKV) are allowed.");
}

$extMap = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    'video/mp4'  => 'mp4',
    'video/webm' => 'webm',
    'video/ogg'  => 'ogg',
    'video/quicktime' => 'mov',
    'video/x-matroska' => 'mkv'
];
$safeExt = isset($extMap[$detectedMime]) ? $extMap[$detectedMime] : 'jpg';

$newFileName = md5(uniqid('', true) . $fileName) . '.' . $safeExt;
$dest_path   = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $newFileName;

$saved = false;
if (extension_loaded('gd')) {
    switch ($detectedMime) {
        case 'image/jpeg':
            $srcImg = @imagecreatefromjpeg($fileTmpPath);
            if ($srcImg) {
                $saved = imagejpeg($srcImg, $dest_path, 85);
                imagedestroy($srcImg);
            }
            break;
        case 'image/png':
            $srcImg = @imagecreatefrompng($fileTmpPath);
            if ($srcImg) {
                imagealphablending($srcImg, false);
                imagesavealpha($srcImg, true);
                $saved = imagepng($srcImg, $dest_path, 6);
                imagedestroy($srcImg);
            }
            break;
        case 'image/webp':
            $srcImg = @imagecreatefromwebp($fileTmpPath);
            if ($srcImg) {
                imagealphablending($srcImg, false);
                imagesavealpha($srcImg, true);
                $saved = imagewebp($srcImg, $dest_path, 85);
                imagedestroy($srcImg);
            }
            break;
    }
}

if (!$saved) {
    $saved = move_uploaded_file($fileTmpPath, $dest_path);
}

if ($saved) {
    $publicPath = '/assets/uploads/' . $newFileName;
    error_log("[upload/image.php] Upload successful: $publicPath (size: " . filesize($dest_path) . " bytes)");
    \Config\ResponseHelper::success(['url' => $publicPath], "Image uploaded successfully.");
} else {
    error_log("[upload/image.php] Failed to save file to: $dest_path");
    \Config\ResponseHelper::serverError("Failed to save the uploaded file. Check directory permissions.");
}
