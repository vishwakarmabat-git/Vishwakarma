<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
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

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->first_name) || empty($data->email) || empty($data->password)) {
    \Config\ResponseHelper::badRequest("First name, email, and password are required.");
}

$first_name = htmlspecialchars(strip_tags($data->first_name));
$last_name = isset($data->last_name) ? htmlspecialchars(strip_tags($data->last_name)) : null;
$phone = isset($data->phone) ? htmlspecialchars(strip_tags($data->phone)) : null;
$email = filter_var($data->email, FILTER_SANITIZE_EMAIL);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    \Config\ResponseHelper::badRequest("Invalid email format.");
}

if (strlen($data->password) < 6) {
    \Config\ResponseHelper::badRequest("Password must be at least 6 characters long.");
}

// Check if email exists
$checkQuery = "SELECT id FROM users WHERE email = :email LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':email', $email);
$checkStmt->execute();

if ($checkStmt->rowCount() > 0) {
    \Config\ResponseHelper::badRequest("Email is already registered.");
}

$password_hash = password_hash($data->password, PASSWORD_BCRYPT);
$role = 'customer'; // Default role

$query = "INSERT INTO users (first_name, last_name, email, password_hash, phone, role) 
          VALUES (:first_name, :last_name, :email, :password_hash, :phone, :role)";

$stmt = $db->prepare($query);
$stmt->bindParam(':first_name', $first_name);
$stmt->bindParam(':last_name', $last_name);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':password_hash', $password_hash);
$stmt->bindParam(':phone', $phone);
$stmt->bindParam(':role', $role);

if ($stmt->execute()) {
    $userId = $db->lastInsertId();
    \Config\ResponseHelper::created(['id' => $userId], "Registration successful.");
} else {
    \Config\ResponseHelper::serverError("Unable to register user.");
}
