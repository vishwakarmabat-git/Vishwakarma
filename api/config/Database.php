<?php
require_once __DIR__ . '/EnvLoader.php';

// Try to load .env from the config directory or project root
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    \Config\EnvLoader::load($envPath);
}

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // Hardcoded Hostinger credentials to prevent server environment pollution
        $this->host = 'localhost';
        $this->db_name = 'u276796116_vishwakarmabat';
        $this->username = 'u276796116_bathouse_admin';
        $this->password = 'Qubnix123@'; 
    }

    /**
     * @return \PDO
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            $this->conn = new \PDO($dsn, $this->username, $this->password, $options);
        } catch(\PDOException $exception) {
            // Log error instead of echoing in production
            error_log("Connection error: " . $exception->getMessage());
            
            // Return JSON error if database fails
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed.']);
            exit;
        }

        return $this->conn;
    }
}
