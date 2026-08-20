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

// Auth is optional: we always verify the HMAC signature regardless.
// If a valid JWT is present, we also enforce user ownership on the order update.
$user = \Config\AuthMiddleware::optionalAuthenticate();

$database = new \Database();
$db = $database->getConnection();

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->razorpay_order_id) || empty($data->razorpay_payment_id) || empty($data->razorpay_signature) || empty($data->internal_order_id)) {
    \Config\ResponseHelper::badRequest("Missing required payment verification parameters.");
}

$key_secret = getenv('RAZORPAY_KEY_SECRET');

if (empty($key_secret)) {
    \Config\ResponseHelper::serverError("Razorpay credentials not configured.");
}

// Verify Signature
$generated_signature = hash_hmac('sha256', $data->razorpay_order_id . "|" . $data->razorpay_payment_id, $key_secret);

if ($generated_signature === $data->razorpay_signature) {
    try {
        $db->beginTransaction();

        // 1. Update orders table (enforce user ownership only if JWT was provided)
        if ($user !== null) {
            $updateOrder = "UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = :order_id AND user_id = :user_id";
            $stmtOrder = $db->prepare($updateOrder);
            $stmtOrder->execute([':order_id' => $data->internal_order_id, ':user_id' => $user->id]);
        } else {
            $updateOrder = "UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = :order_id";
            $stmtOrder = $db->prepare($updateOrder);
            $stmtOrder->execute([':order_id' => $data->internal_order_id]);
        }

        // 2. Insert into payments table
        $insertPayment = "INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status) 
                          VALUES (:oid, :rzp_oid, :rzp_pid, :rzp_sig, :amt, 'captured')";
        
        $stmtPayment = $db->prepare($insertPayment);
        $stmtPayment->execute([
            ':oid' => $data->internal_order_id,
            ':rzp_oid' => $data->razorpay_order_id,
            ':rzp_pid' => $data->razorpay_payment_id,
            ':rzp_sig' => $data->razorpay_signature,
            ':amt' => isset($data->amount) ? $data->amount : 0
        ]);

        $db->commit();
        
        // TODO: Send Order Confirmation Email via Brevo here

        \Config\ResponseHelper::success([], "Payment verified successfully.");
    } catch (\Exception $e) {
        $db->rollBack();
        \Config\ResponseHelper::serverError("Payment verified, but database update failed: " . $e->getMessage());
    }

} else {
    // Fraud detected
    \Config\ResponseHelper::badRequest("Payment signature verification failed. Possible fraud attempt.");
}
