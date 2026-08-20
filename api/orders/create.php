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

// Verify user is logged in
$user = \Config\AuthMiddleware::authenticate();

$database = new \Database();
$db = $database->getConnection();

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->cart) || empty($data->shipping_address_id)) {
    \Config\ResponseHelper::badRequest("Cart items and shipping address are required.");
}

try {
    $db->beginTransaction();

    // Calculate totals securely on backend
    $subtotal = 0;
    $gst_total = 0;
    
    foreach ($data->cart as $item) {
        // Fetch real price from DB to prevent client-side price tampering
        $prodQuery = "SELECT name, price, gst_percentage FROM products WHERE id = :id LIMIT 1";
        $prodStmt = $db->prepare($prodQuery);
        $prodStmt->bindParam(':id', $item->id);
        $prodStmt->execute();
        
        if ($prodStmt->rowCount() === 0) {
            throw new \Exception("Product ID " . $item->id . " not found.");
        }
        
        $product = $prodStmt->fetch(\PDO::FETCH_ASSOC);
        $qty = (int)$item->quantity;
        $price = (float)$product['price'];
        
        $itemSubtotal = $price * $qty;
        $subtotal += $itemSubtotal;
        
        // Simplified GST calculation
        $gstAmount = ($itemSubtotal * (float)$product['gst_percentage']) / 100;
        $gst_total += $gstAmount;
    }

    $shipping_fee = 150; // Could be fetched from settings table
    $discount_total = 0;
    
    $grand_total = $subtotal + $gst_total + $shipping_fee - $discount_total;
    $order_number = "ORD-" . date('Ym') . "-" . rand(1000, 9999);

    // Insert Order
    $orderQuery = "INSERT INTO orders 
                  (order_number, user_id, shipping_address_id, subtotal, gst_total, shipping_fee, discount_total, grand_total) 
                  VALUES (:order_num, :uid, :address_id, :subtotal, :gst, :shipping, :discount, :grand)";
    
    $orderStmt = $db->prepare($orderQuery);
    $orderStmt->execute([
        ':order_num' => $order_number,
        ':uid' => $user->id,
        ':address_id' => $data->shipping_address_id,
        ':subtotal' => $subtotal,
        ':gst' => $gst_total,
        ':shipping' => $shipping_fee,
        ':discount' => $discount_total,
        ':grand' => $grand_total
    ]);

    $orderId = $db->lastInsertId();

    // Insert Order Items
    $itemQuery = "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, gst_percentage, subtotal) 
                  VALUES (:oid, :pid, :pname, :qty, :uprice, :gst_pct, :isubtotal)";
    $itemStmt = $db->prepare($itemQuery);

    foreach ($data->cart as $item) {
        $prodQuery = "SELECT name, price, gst_percentage FROM products WHERE id = :id LIMIT 1";
        $prodStmt = $db->prepare($prodQuery);
        $prodStmt->bindParam(':id', $item->id);
        $prodStmt->execute();
        $product = $prodStmt->fetch(\PDO::FETCH_ASSOC);

        $qty = (int)$item->quantity;
        $price = (float)$product['price'];
        $itemSubtotal = $price * $qty;

        $itemStmt->execute([
            ':oid' => $orderId,
            ':pid' => $item->id,
            ':pname' => $product['name'],
            ':qty' => $qty,
            ':uprice' => $price,
            ':gst_pct' => $product['gst_percentage'],
            ':isubtotal' => $itemSubtotal
        ]);
    }

    $db->commit();

    \Config\ResponseHelper::created([
        'order_id' => $orderId,
        'order_number' => $order_number,
        'grand_total' => $grand_total
    ], "Order created successfully.");

} catch (\Exception $e) {
    $db->rollBack();
    \Config\ResponseHelper::serverError("Order creation failed: " . $e->getMessage());
}
