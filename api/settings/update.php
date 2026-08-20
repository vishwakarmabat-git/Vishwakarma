<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/ResponseHelper.php';
require_once '../config/ErrorHandler.php';
require_once '../config/AuthMiddleware.php';

\Config\ErrorHandler::register();
$user = \Config\AuthMiddleware::authenticate(['admin', 'super-admin']);

$database = new \Database();
$db = $database->getConnection();

$data = (array) \Config\ResponseHelper::getJsonInput();

if (empty($data) || !is_array($data)) {
    \Config\ResponseHelper::badRequest("Settings data is required.");
}

try {
    $db->beginTransaction();
    $query = "INSERT INTO settings (setting_key, setting_value) VALUES (:key, :val) 
              ON DUPLICATE KEY UPDATE setting_value = :val";
    $stmt = $db->prepare($query);

    foreach ($data as $key => $value) {
        $stmt->execute([
            ':key' => $key,
            ':val' => is_array($value) ? json_encode($value) : $value
        ]);
    }

    $db->commit();
    \Config\ResponseHelper::success([], "Settings updated successfully.");
} catch (\Exception $e) {
    $db->rollBack();
    \Config\ResponseHelper::serverError("Failed to update settings: " . $e->getMessage());
}
