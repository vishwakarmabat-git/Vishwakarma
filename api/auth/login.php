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
require_once '../config/JwtHandler.php';

\Config\ErrorHandler::register();

$database = new \Database();
$db = $database->getConnection();

$data = \Config\ResponseHelper::getJsonInput();

if (empty($data->email) || empty($data->password)) {
    \Config\ResponseHelper::badRequest("Email and password are required.");
}

$email = filter_var($data->email, FILTER_SANITIZE_EMAIL);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    \Config\ResponseHelper::badRequest("Invalid email format.");
}

$query = "SELECT id, first_name, last_name, role, password_hash, status FROM users WHERE email = :email LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':email', $email);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
    
    if ($row['status'] !== 'active') {
        \Config\ResponseHelper::forbidden("Your account is " . $row['status'] . ". Please contact support.");
    }

    if (password_verify($data->password, $row['password_hash'])) {
        $jwtHandler = new \Config\JwtHandler();
        
        $tokenPayload = [
            'id' => $row['id'],
            'email' => $email,
            'role' => $row['role'],
            'name' => trim($row['first_name'] . ' ' . $row['last_name'])
        ];
        
        $jwt = $jwtHandler->encode($tokenPayload);

        // Update last login
        $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':id', $row['id']);
        $updateStmt->execute();

        \Config\ResponseHelper::success([
            'token' => $jwt,
            'user' => $tokenPayload
        ], "Login successful.");
    } else {
        \Config\ResponseHelper::unauthorized("Invalid email or password.");
    }
} else {
    \Config\ResponseHelper::unauthorized("Invalid email or password.");
}
