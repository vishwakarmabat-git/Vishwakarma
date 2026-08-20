<?php
namespace Config;

class ResponseHelper {
    public static function send($statusCode, $data = [], $message = '') {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *'); // Configure for production later
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
        
        $response = [
            'status' => $statusCode >= 200 && $statusCode < 300 ? 'success' : 'error',
            'message' => $message
        ];

        if (!empty($data)) {
            $response['data'] = $data;
        }

        echo json_encode($response);
        exit;
    }

    public static function success($data = [], $message = 'Success') {
        self::send(200, $data, $message);
    }

    public static function created($data = [], $message = 'Created successfully') {
        self::send(201, $data, $message);
    }

    public static function getJsonInput() {
        $rawBody = file_get_contents("php://input");
        $data = json_decode($rawBody);

        // Fallback: try $_POST if php://input is empty (common on LiteSpeed)
        if ((empty($rawBody) || empty($data)) && !empty($_POST)) {
            $data = (object) $_POST;
        }

        // Fallback: try $_GET as last resort
        if (empty($data) && !empty($_GET)) {
            $data = (object) $_GET;
        }

        return $data;
    }

    public static function badRequest($message = 'Bad Request') {
        self::send(400, [], $message);
    }

    public static function unauthorized($message = 'Unauthorized') {
        self::send(401, [], $message);
    }

    public static function forbidden($message = 'Forbidden') {
        self::send(403, [], $message);
    }

    public static function notFound($message = 'Not Found') {
        self::send(404, [], $message);
    }

    public static function serverError($message = 'Internal Server Error') {
        self::send(500, [], $message);
    }
}
