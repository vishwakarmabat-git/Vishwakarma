<?php
// Run this file ONCE via browser to create the super-admin account, then DELETE it for security.
require_once 'config/Database.php';

$database = new \Database();
$db = $database->getConnection();

$email = "admin@vkbathouse.com";
$password = "vkadmin@2026"; // Change immediately after login
$password_hash = password_hash($password, PASSWORD_BCRYPT);

$query = "INSERT INTO users (role, first_name, last_name, email, password_hash, status) 
          VALUES ('super-admin', 'Super', 'Admin', :email, :password_hash, 'active')";

$stmt = $db->prepare($query);

try {
    if ($stmt->execute([':email' => $email, ':password_hash' => $password_hash])) {
        echo "<h1>Super Admin Created Successfully</h1>";
        echo "<p><strong>Email:</strong> admin@vkbathouse.com</p>";
        echo "<p><strong>Password:</strong> vkadmin@2026</p>";
        echo "<p style='color:red;'>SECURITY WARNING: Delete this file (setup_admin.php) immediately from the server!</p>";
    }
} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage();
}
