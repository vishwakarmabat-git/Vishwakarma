<?php
namespace Config;

class EnvLoader {
    public static function load($path) {
        if (!file_exists($path)) {
            // For production, environment variables might be set directly in server
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Remove quotes if present
            if (preg_match('/^"(.*)"$/', $value, $matches) || preg_match("/^'(.*)'$/", $value, $matches)) {
                $value = $matches[1];
            }

            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                if (function_exists('putenv')) {
                    putenv(sprintf('%s=%s', $name, $value));
                }
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}
