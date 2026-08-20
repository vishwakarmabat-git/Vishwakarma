<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
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

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->id)) {
    \Config\ResponseHelper::badRequest("Category ID is required.");
}

// Ensure no products exist under this category
$checkQuery = "SELECT id FROM products WHERE category_id = :id LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->execute([':id' => $data->id]);

if ($checkStmt->rowCount() > 0) {
    \Config\ResponseHelper::badRequest("Cannot delete category. There are products linked to it. Please reassign or delete the products first.");
}

$query = "DELETE FROM categories WHERE id = :id";
$stmt = $db->prepare($query);

if ($stmt->execute([':id' => $data->id])) {
    \Config\ResponseHelper::success([], "Category deleted successfully.");
} else {
    \Config\ResponseHelper::serverError("Failed to delete category.");
}
