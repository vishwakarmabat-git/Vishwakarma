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

\Config\ErrorHandler::register();

// Note: No auth required to create a Razorpay order.
// The KEY_SECRET never leaves the server, so this is safe.

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->amount) || empty($data->currency) || empty($data->receipt)) {
    \Config\ResponseHelper::badRequest("Amount, currency, and receipt ID are required.");
}

$key_id = getenv('RAZORPAY_KEY_ID');
$key_secret = getenv('RAZORPAY_KEY_SECRET');

if (empty($key_id) || empty($key_secret)) {
    \Config\ResponseHelper::serverError("Razorpay credentials not configured on the server.");
}

$amountInPaise = (int) ($data->amount * 100);

// Call Razorpay API securely from backend
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.razorpay.com/v1/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'amount' => $amountInPaise,
    'currency' => $data->currency,
    'receipt' => $data->receipt,
    'payment_capture' => 1 // Auto capture
]));
curl_setopt($ch, CURLOPT_USERPWD, $key_id . ':' . $key_secret);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$responseData = json_decode($response, true);

if ($httpCode >= 200 && $httpCode < 300) {
    \Config\ResponseHelper::success([
        'razorpay_order_id' => $responseData['id'],
        'amount' => $responseData['amount'],
        'currency' => $responseData['currency'],
        'key_id' => $key_id // Frontend needs the public key to initialize checkout
    ], "Razorpay order created.");
} else {
    \Config\ResponseHelper::serverError("Failed to create Razorpay Order. " . ($responseData['error']['description'] ?? ''));
}
