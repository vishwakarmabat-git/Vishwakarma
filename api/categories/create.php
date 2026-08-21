<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
$user = \Config\AuthMiddleware::authenticate(['admin', 'super-admin', 'content-manager']);

$database = new \Database();
$db = $database->getConnection();

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->name)) {
    \Config\ResponseHelper::badRequest("Category name is required.");
}

$slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data->name)));

$checkQuery = "SELECT id FROM categories WHERE slug = :slug LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->execute([':slug' => $slug]);

if ($checkStmt->rowCount() > 0) {
    \Config\ResponseHelper::badRequest("Category with this name/slug already exists.");
}

$query = "INSERT INTO categories (name, slug, description, banner_image, display_order, price, gst, active) 
          VALUES (:name, :slug, :description, :banner_image, :display_order, :price, :gst, :active)";

$stmt = $db->prepare($query);

if ($stmt->execute([
    ':name' => $data->name,
    ':slug' => $slug,
    ':description' => $data->description ?? null,
    ':banner_image' => $data->banner_image ?? null,
    ':display_order' => $data->display_order ?? 0,
    ':price' => $data->price ?? 0,
    ':gst' => $data->gst ?? 12,
    ':active' => isset($data->active) ? $data->active : 1
])) {
    \Config\ResponseHelper::created(['id' => $db->lastInsertId()], "Category created successfully.");
} else {
    \Config\ResponseHelper::serverError("Failed to create category.");
}
