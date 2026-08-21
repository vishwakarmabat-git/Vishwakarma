<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, POST, OPTIONS");
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

// Also check query string as fallback
$catId = !empty($data->id) ? $data->id : (!empty($_GET['id']) ? $_GET['id'] : null);
$catSlug = !empty($data->slug) ? $data->slug : (!empty($_GET['slug']) ? $_GET['slug'] : null);

if (empty($catId) && empty($catSlug)) {
    \Config\ResponseHelper::badRequest("Category ID or slug is required.");
}

// Try to delete by numeric ID first, then by slug
$deleted = false;

if (!empty($catId)) {
    $query = "DELETE FROM categories WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $catId]);
    if ($stmt->rowCount() > 0) {
        $deleted = true;
    }
}

// If numeric ID didn't work, try by slug
if (!$deleted && !empty($catSlug)) {
    $query = "DELETE FROM categories WHERE slug = :slug";
    $stmt = $db->prepare($query);
    $stmt->execute([':slug' => $catSlug]);
    if ($stmt->rowCount() > 0) {
        $deleted = true;
    }
}

// If catId looks like a slug (non-numeric), try that too
if (!$deleted && !empty($catId) && !is_numeric($catId)) {
    $query = "DELETE FROM categories WHERE slug = :slug";
    $stmt = $db->prepare($query);
    $stmt->execute([':slug' => $catId]);
    if ($stmt->rowCount() > 0) {
        $deleted = true;
    }
}

if ($deleted) {
    \Config\ResponseHelper::success([], "Category deleted successfully.");
} else {
    \Config\ResponseHelper::success([], "Category not found or already deleted.");
}
