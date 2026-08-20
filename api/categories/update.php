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

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->id) || empty($data->name)) {
    \Config\ResponseHelper::badRequest("Category ID and name are required.");
}

$slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data->name)));

$query = "UPDATE categories SET 
          name = :name, 
          slug = :slug, 
          description = :description, 
          banner_image = :banner_image, 
          display_order = :display_order, 
          active = :active
          WHERE id = :id";

$stmt = $db->prepare($query);

if ($stmt->execute([
    ':name' => $data->name,
    ':slug' => $slug,
    ':description' => $data->description ?? null,
    ':banner_image' => $data->banner_image ?? null,
    ':display_order' => $data->display_order ?? 0,
    ':active' => isset($data->active) ? $data->active : 1,
    ':id' => $data->id
])) {
    \Config\ResponseHelper::success([], "Category updated successfully.");
} else {
    \Config\ResponseHelper::serverError("Failed to update category.");
}
