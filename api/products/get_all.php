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

$query = "SELECT p.*, c.name as category_name, c.slug as category_slug
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id 
          WHERE p.status = 'active'
          ORDER BY p.id DESC";

$stmt = $db->prepare($query);
$stmt->execute();

$products = [];
if ($stmt->rowCount() > 0) {
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        // Fetch images for this product
        $imgQuery = "SELECT image_url, is_primary FROM product_images WHERE product_id = :product_id ORDER BY display_order ASC";
        $imgStmt = $db->prepare($imgQuery);
        $imgStmt->bindParam(':product_id', $row['id']);
        $imgStmt->execute();
        
        $images = [];
        while ($imgRow = $imgStmt->fetch(\PDO::FETCH_ASSOC)) {
            $images[] = $imgRow['image_url'];
        }

        // Add standard fields
        $row['images'] = $images;
        
        // Ensure decimal values are numbers, not strings, if possible
        $row['price'] = (float) $row['price'];
        $row['compare_price'] = $row['compare_price'] ? (float) $row['compare_price'] : null;
        $row['gst_percentage'] = (float) $row['gst_percentage'];

        $products[] = $row;
    }
}

\Config\ResponseHelper::success($products, "Products retrieved successfully.");
