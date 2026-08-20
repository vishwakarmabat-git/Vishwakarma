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

// Verify token and ensure Admin/Super Admin role
$user = \Config\AuthMiddleware::authenticate(['admin', 'super-admin']);

$database = new \Database();
$db = $database->getConnection();

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->name) || empty($data->category_id) || empty($data->price) || empty($data->sku)) {
    \Config\ResponseHelper::badRequest("Missing required fields (name, category_id, price, sku).");
}

$slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data->name)));

// Check if SKU or Slug already exists
$checkQuery = "SELECT id FROM products WHERE sku = :sku OR slug = :slug LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':sku', $data->sku);
$checkStmt->bindParam(':slug', $slug);
$checkStmt->execute();

if ($checkStmt->rowCount() > 0) {
    \Config\ResponseHelper::badRequest("A product with this SKU or Name already exists.");
}

try {
    $db->beginTransaction();

    $query = "INSERT INTO products 
              (category_id, sku, name, slug, short_description, long_description, price, compare_price, gst_percentage, grade, pressing, video_url, is_featured, is_bestseller, status) 
              VALUES 
              (:category_id, :sku, :name, :slug, :short_description, :long_description, :price, :compare_price, :gst_percentage, :grade, :pressing, :video_url, :is_featured, :is_bestseller, :status)";

    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':category_id', $data->category_id);
    $stmt->bindParam(':sku', $data->sku);
    $stmt->bindParam(':name', $data->name);
    $stmt->bindParam(':slug', $slug);
    
    $short_desc = $data->short_description ?? null;
    $long_desc = $data->long_description ?? null;
    $compare_price = $data->compare_price ?? null;
    $gst = $data->gst_percentage ?? 12.00;
    $grade = $data->grade ?? null;
    $pressing = $data->pressing ?? null;
    $video_url = $data->video_url ?? null;
    $is_feat = isset($data->is_featured) && $data->is_featured ? 1 : 0;
    $is_best = isset($data->is_bestseller) && $data->is_bestseller ? 1 : 0;
    $status = $data->status ?? 'active';

    $stmt->bindParam(':short_description', $short_desc);
    $stmt->bindParam(':long_description', $long_desc);
    $stmt->bindParam(':price', $data->price);
    $stmt->bindParam(':compare_price', $compare_price);
    $stmt->bindParam(':gst_percentage', $gst);
    $stmt->bindParam(':grade', $grade);
    $stmt->bindParam(':pressing', $pressing);
    $stmt->bindParam(':video_url', $video_url);
    $stmt->bindParam(':is_featured', $is_feat, \PDO::PARAM_INT);
    $stmt->bindParam(':is_bestseller', $is_best, \PDO::PARAM_INT);
    $stmt->bindParam(':status', $status);

    $stmt->execute();
    $productId = $db->lastInsertId();

    // Insert specs if provided
    if (!empty($data->specs) && is_array($data->specs)) {
        $specQuery = "INSERT INTO product_specs (product_id, spec_name, spec_value) VALUES (:pid, :sname, :sval)";
        $specStmt = $db->prepare($specQuery);
        foreach ($data->specs as $spec) {
            $specStmt->execute([
                ':pid' => $productId,
                ':sname' => $spec->name,
                ':sval' => $spec->value
            ]);
        }
    }

    $db->commit();
    \Config\ResponseHelper::created(['id' => $productId], "Product created successfully.");

} catch (\Exception $e) {
    $db->rollBack();
    \Config\ResponseHelper::serverError("Failed to create product: " . $e->getMessage());
}
