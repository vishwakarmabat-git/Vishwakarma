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
$user = \Config\AuthMiddleware::authenticate(['admin', 'super-admin', 'sales']);

$database = new \Database();
$db = $database->getConnection();

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->id) || empty($data->status)) {
    \Config\ResponseHelper::badRequest("Order ID and new status are required.");
}

$query = "UPDATE orders SET status = :status, admin_notes = :notes WHERE id = :id";
$stmt = $db->prepare($query);

if ($stmt->execute([
    ':status' => $data->status,
    ':notes' => $data->admin_notes ?? null,
    ':id' => $data->id
])) {
    // If status is 'shipped', you might want to call ShiprocketHelper here
    if ($data->status === 'shipped') {
        // Trigger Shiprocket sync
        require_once '../config/ShiprocketHelper.php';
        // ... Shiprocket logic ...
    }

    \Config\ResponseHelper::success([], "Order status updated successfully.");
} else {
    \Config\ResponseHelper::serverError("Failed to update order status.");
}
