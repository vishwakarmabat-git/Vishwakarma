<?php
namespace Config;

class JwtHandler {
    private $secret;
    private $issuer;

    public function __construct() {
        $this->secret = $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? (getenv('JWT_SECRET') ?: 'default_secret_key_for_dev_only');
        $this->issuer = $_ENV['JWT_ISSUER'] ?? $_SERVER['JWT_ISSUER'] ?? (getenv('JWT_ISSUER') ?: 'vkbathouse.com');
    }

    public function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        // Add issuer and expiration (e.g. 24 hours)
        $payload['iss'] = $this->issuer;
        $payload['iat'] = time();
        $payload['exp'] = time() + (24 * 60 * 60);

        $payload = json_encode($payload);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function decode($jwt) {
        $tokenParts = explode('.', $jwt);
        
        if (count($tokenParts) !== 3) {
            return false;
        }

        $headerBase64 = $tokenParts[0];
        $payloadBase64 = $tokenParts[1];
        $signatureProvided = $tokenParts[2];

        // 1. Verify signature FIRST before trusting any payload data
        $expectedSignatureRaw = hash_hmac('sha256', $headerBase64 . "." . $payloadBase64, $this->secret, true);
        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignatureRaw));

        if (!hash_equals($expectedSignature, $signatureProvided)) {
            return false;
        }

        // 2. Decode and check expiration
        $payloadJson = base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadBase64));
        if ($payloadJson === false) {
            return false;
        }

        $payloadObj = json_decode($payloadJson);
        if (!$payloadObj) {
            return false;
        }

        if (isset($payloadObj->exp) && $payloadObj->exp < time()) {
            return false; // Token expired
        }

        return $payloadObj;
    }
}
