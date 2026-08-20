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

if (empty($data->id) || empty($data->name) || empty($data->category_id) || empty($data->price)) {
    \Config\ResponseHelper::badRequest("Missing required fields.");
}

$slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data->name)));

try {
    $db->beginTransaction();

    $query = "UPDATE products SET 
              category_id = :category_id, 
              name = :name, 
              slug = :slug, 
              short_description = :short_description, 
              long_description = :long_description, 
              price = :price, 
              compare_price = :compare_price, 
              gst_percentage = :gst_percentage, 
              status = :status
              WHERE id = :id";

    $stmt = $db->prepare($query);
    
    $stmt->execute([
        ':category_id' => $data->category_id,
        ':name' => $data->name,
        ':slug' => $slug,
        ':short_description' => $data->short_description ?? null,
        ':long_description' => $data->long_description ?? null,
        ':price' => $data->price,
        ':compare_price' => $data->compare_price ?? null,
        ':gst_percentage' => $data->gst_percentage ?? 12.00,
        ':status' => $data->status ?? 'active',
        ':id' => $data->id
    ]);

    // Handle images array if provided
    if (isset($data->images) && is_array($data->images)) {
        // Delete old images
        $delImgQuery = "DELETE FROM product_images WHERE product_id = :pid";
        $delImgStmt = $db->prepare($delImgQuery);
        $delImgStmt->execute([':pid' => $data->id]);

        // Insert new images
        $insImgQuery = "INSERT INTO product_images (product_id, image_url, display_order) VALUES (:pid, :url, :ord)";
        $insImgStmt = $db->prepare($insImgQuery);
        foreach ($data->images as $index => $url) {
            $insImgStmt->execute([
                ':pid' => $data->id,
                ':url' => $url,
                ':ord' => $index
            ]);
        }
    }

    $db->commit();
    \Config\ResponseHelper::success([], "Product updated successfully.");

} catch (\Exception $e) {
    $db->rollBack();
    \Config\ResponseHelper::serverError("Failed to update product: " . $e->getMessage());
}
