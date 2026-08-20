<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/EnvLoader.php';
$envPath = __DIR__ . '/config/.env';
if (file_exists($envPath)) {
    \Config\EnvLoader::load($envPath);
}

$expectedToken = $_ENV['ADMIN_SYNC_TOKEN'] ?? $_SERVER['ADMIN_SYNC_TOKEN'] ?? (getenv('ADMIN_SYNC_TOKEN') ?: 'vk_super_admin_secret_9988');

if (!function_exists('apache_request_headers')) {
    function apache_request_headers() {
        $arh = array();
        $rx_http = '/\AHTTP_/';
        foreach ($_SERVER as $key => $val) {
            if (preg_match($rx_http, $key)) {
                $arh_key = preg_replace($rx_http, '', $key);
                $rx_matches = array();
                $rx_matches = explode('_', $arh_key);
                if (count($rx_matches) > 0 and strlen($arh_key) > 2) {
                    foreach ($rx_matches as $ak_key => $ak_val) $rx_matches[$ak_key] = ucfirst(strtolower($ak_val));
                    $arh_key = implode('-', $rx_matches);
                }
                $arh[$arh_key] = $val;
            }
        }
        return $arh;
    }
}

$headers = apache_request_headers();
$token = isset($headers['X-Admin-Token']) ? $headers['X-Admin-Token'] : (isset($_SERVER['HTTP_X_ADMIN_TOKEN']) ? $_SERVER['HTTP_X_ADMIN_TOKEN'] : (isset($_GET['token']) ? $_GET['token'] : ''));

$dbFile = __DIR__ . '/database.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dbFile)) {
        header("Content-Type: application/json");
        echo file_get_contents($dbFile);
    } else {
        echo json_encode(["status" => "empty"]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($token !== $expectedToken) {
        http_response_code(403);
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }

    $rawBody = file_get_contents("php://input");
    $data = json_decode($rawBody);
    if (empty($rawBody) && !empty($_POST)) {
        $data = (object) $_POST;
    }
    if (empty($data) && !empty($_GET)) {
        $data = (object) $_GET;
    }
    
    // Write atomically to prevent corruption
    $tempFile = $dbFile . '.tmp';
    if (file_put_contents($tempFile, json_encode($data)) !== false) {
        rename($tempFile, $dbFile);
        echo json_encode(["status" => "success", "message" => "Database synced successfully to Hostinger file system"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to write database file"]);
    }
}
