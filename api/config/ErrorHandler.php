<?php
namespace Config;

class ErrorHandler {
    public static function handleException($exception) {
        $msg = "Uncaught Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine();
        error_log($msg);
        
        require_once __DIR__ . '/ResponseHelper.php';
        ResponseHelper::serverError($msg);
    }

    public static function handleError($errno, $errstr, $errfile, $errline) {
        $msg = "Error [$errno]: $errstr in $errfile on line $errline";
        error_log($msg);
        
        // Don't halt on non-fatal errors but do log them
        if (!(error_reporting() & $errno)) {
            return false;
        }
        
        require_once __DIR__ . '/ResponseHelper.php';
        ResponseHelper::serverError($msg);
    }

    public static function register() {
        set_exception_handler(['\Config\ErrorHandler', 'handleException']);
        set_error_handler(['\Config\ErrorHandler', 'handleError']);
    }
}
