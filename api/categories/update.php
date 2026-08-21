<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST, OPTIONS");
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

$params = [
    ':name' => $data->name,
    ':slug' => $slug,
    ':description' => $data->description ?? null,
    ':banner_image' => $data->banner_image ?? null,
    ':display_order' => $data->display_order ?? 0,
    ':price' => $data->price ?? 0,
    ':gst' => $data->gst ?? 12,
    ':active' => isset($data->active) ? $data->active : 1,
];

$updated = false;

// Try update by numeric ID first
if (is_numeric($data->id)) {
    $query = "UPDATE categories SET 
              name = :name, slug = :slug, description = :description, 
              banner_image = :banner_image, display_order = :display_order, 
              price = :price, gst = :gst, active = :active
              WHERE id = :id";
    $stmt = $db->prepare($query);
    $params[':id'] = $data->id;
    $stmt->execute($params);
    if ($stmt->rowCount() > 0) {
        $updated = true;
    }
    unset($params[':id']);
}

// Fallback: try by slug
if (!$updated) {
    $oldSlug = !empty($data->slug) ? $data->slug : $data->id;
    $query = "UPDATE categories SET 
              name = :name, slug = :slug, description = :description, 
              banner_image = :banner_image, display_order = :display_order, 
              price = :price, gst = :gst, active = :active
              WHERE slug = :old_slug";
    $stmt = $db->prepare($query);
    $params[':old_slug'] = $oldSlug;
    $stmt->execute($params);
    if ($stmt->rowCount() > 0) {
        $updated = true;
    }
}

\Config\ResponseHelper::success([], $updated ? "Category updated successfully." : "No changes detected or category not found.");
