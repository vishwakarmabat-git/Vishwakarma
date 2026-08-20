<?php
namespace Config;

require_once __DIR__ . '/JwtHandler.php';
require_once __DIR__ . '/ResponseHelper.php';

class AuthMiddleware {
    /**
     * @return mixed
     */
    /**
     * @param array $allowedRoles
     * @param bool $required
     * @return mixed
     */
    public static function authenticate($allowedRoles = [], $required = true) {
        $headers = apache_request_headers();
        
        // Normalize header keys to lowercase to be case-insensitive
        $normalizedHeaders = [];
        foreach ($headers as $key => $val) {
            $normalizedHeaders[strtolower($key)] = $val;
        }

        $authHeader = isset($normalizedHeaders['authorization']) ? $normalizedHeaders['authorization'] : '';

        if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }

        $token = '';
        if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }

        // Fallbacks for web servers like LiteSpeed/Apache that strip Authorization header
        if (empty($token)) {
            if (isset($normalizedHeaders['x-auth-token'])) {
                $token = $normalizedHeaders['x-auth-token'];
            } elseif (isset($_SERVER['HTTP_X_AUTH_TOKEN'])) {
                $token = $_SERVER['HTTP_X_AUTH_TOKEN'];
            } elseif (isset($_GET['token'])) {
                $token = $_GET['token'];
            } elseif (isset($_POST['token'])) {
                $token = $_POST['token'];
            }
        }

        if (empty($token)) {
            if (!$required) {
                return null;
            }
            ResponseHelper::unauthorized("Access token is missing or invalid");
        }

        $jwt = new JwtHandler();
        $decoded = $jwt->decode($token);

        if (!$decoded) {
            if (!$required) {
                return null;
            }
            ResponseHelper::unauthorized("Token is expired or invalid");
        }

        // Role based access control
        if (!empty($allowedRoles) && isset($decoded->role)) {
            if (!in_array($decoded->role, $allowedRoles)) {
                if (!$required) {
                    return null;
                }
                ResponseHelper::forbidden("You do not have permission to access this resource");
            }
        }

        // Return user data so endpoint can use it
        return $decoded;
    }

    /**
     * Optional authentication helper that never halts script execution on missing/invalid token.
     * @param array $allowedRoles
     * @return mixed|null
     */
    public static function optionalAuthenticate($allowedRoles = []) {
        return self::authenticate($allowedRoles, false);
    }
}

// Fallback for nginx or other servers where apache_request_headers doesn't exist
if (!function_exists('apache_request_headers')) {
    function apache_request_headers() {
        $arh = array();
        $rx_http = '/\AHTTP_/';
        foreach ($_SERVER as $key => $val) {
            if (preg_match($rx_http, $key)) {
                $arh_key = preg_replace($rx_http, '', $key);
                $rx_matches = array();
                $rx_matches = explode('_', $arh_key);
                if (count($rx_matches) > 0 and strlen($arh_key) > 2) {
                    foreach ($rx_matches as $ak_key => $ak_val) $rx_matches[$ak_key] = ucfirst(strtolower($ak_val));
                    $arh_key = implode('-', $rx_matches);
                }
                $arh[$arh_key] = $val;
            }
        }
        return $arh;
    }
}
