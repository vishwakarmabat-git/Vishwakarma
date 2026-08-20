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
require_once '../config/AuthMiddleware.php';

\Config\ErrorHandler::register();
$user = \Config\AuthMiddleware::authenticate(['admin', 'super-admin', 'sales']);

$database = new \Database();
$db = $database->getConnection();

$query = "SELECT o.*, u.first_name, u.last_name, u.email 
          FROM orders o 
          LEFT JOIN users u ON o.user_id = u.id 
          ORDER BY o.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();

$orders = [];
if ($stmt->rowCount() > 0) {
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        // Fetch order items
        $itemQuery = "SELECT * FROM order_items WHERE order_id = :id";
        $itemStmt = $db->prepare($itemQuery);
        $itemStmt->execute([':id' => $row['id']]);
        
        $row['items'] = [];
        while ($itemRow = $itemStmt->fetch(\PDO::FETCH_ASSOC)) {
            $row['items'][] = $itemRow;
        }
        
        $orders[] = $row;
    }
}

\Config\ResponseHelper::success($orders, "Orders retrieved successfully.");
