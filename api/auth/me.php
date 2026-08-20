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

// Verify token
$decodedToken = \Config\AuthMiddleware::authenticate();

$database = new \Database();
$db = $database->getConnection();

// Fetch full user details securely (excluding password)
$query = "SELECT id, first_name, last_name, email, phone, role, status, created_at 
          FROM users WHERE id = :id LIMIT 1";

$stmt = $db->prepare($query);
$stmt->bindParam(':id', $decodedToken->id);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $user = $stmt->fetch(\PDO::FETCH_ASSOC);
    \Config\ResponseHelper::success($user, "User profile retrieved.");
} else {
    \Config\ResponseHelper::notFound("User not found.");
}
