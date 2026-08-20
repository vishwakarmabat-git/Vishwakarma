<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/ResponseHelper.php';
require_once '../config/ErrorHandler.php';

\Config\ErrorHandler::register();

$database = new \Database();
$db = $database->getConnection();

$query = "SELECT setting_key, setting_value FROM settings";
$stmt = $db->prepare($query);
$stmt->execute();

$settings = [];
if ($stmt->rowCount() > 0) {
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
}

\Config\ResponseHelper::success($settings, "Settings retrieved successfully.");
