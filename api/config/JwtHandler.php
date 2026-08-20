<?php
namespace Config;

class JwtHandler {
    private $secret;
    private $issuer;

    public function __construct() {
        $this->secret = getenv('JWT_SECRET') ?: 'default_secret_key_for_dev_only';
        $this->issuer = getenv('JWT_ISSUER') ?: 'vkbathouse.com';
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
        
        if (count($tokenParts) != 3) {
            return false;
        }

        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
        $signatureProvided = $tokenParts[2];

        // Check expiration
        $payloadObj = json_decode($payload);
        if (isset($payloadObj->exp) && $payloadObj->exp < time()) {
            return false; // Token expired
        }

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if (hash_equals($base64UrlSignature, $signatureProvided)) {
            return $payloadObj;
        }

        return false;
    }
}
