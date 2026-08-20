<?php
namespace Config;

class ShiprocketHelper {
    private $email;
    private $password;
    private $tokenFile = __DIR__ . '/shiprocket_token.json';

    public function __construct() {
        $this->email = getenv('SHIPROCKET_EMAIL');
        $this->password = getenv('SHIPROCKET_PASSWORD');
    }

    private function authenticate() {
        if (file_exists($this->tokenFile)) {
            $tokenData = json_decode(file_get_contents($this->tokenFile), true);
            // Tokens usually valid for 10 days, we check if it's older than 8 days
            if (isset($tokenData['created_at']) && (time() - $tokenData['created_at']) < (8 * 24 * 60 * 60)) {
                return $tokenData['token'];
            }
        }

        // Generate new token
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://apiv2.shiprocket.in/v1/external/auth/login");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'email' => $this->email,
            'password' => $this->password
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        $result = curl_exec($ch);
        
        $response = json_decode($result, true);
        if (isset($response['token'])) {
            file_put_contents($this->tokenFile, json_encode([
                'token' => $response['token'],
                'created_at' => time()
            ]));
            return $response['token'];
        }
        
        throw new \Exception("Failed to authenticate with Shiprocket");
    }

    public function createOrder($orderData) {
        $token = $this->authenticate();
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "Authorization: Bearer " . $token
        ]);

        $result = curl_exec($ch);
        
        return json_decode($result, true);
    }
}
