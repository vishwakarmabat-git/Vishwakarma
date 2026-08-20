<?php
namespace Config;

class BrevoEmailer {
    private $apiKey;
    private $senderEmail;
    private $senderName;

    public function __construct() {
        $this->apiKey = getenv('BREVO_API_KEY');
        $this->senderEmail = getenv('BREVO_SENDER_EMAIL');
        $this->senderName = getenv('BREVO_SENDER_NAME');
    }

    public function sendOrderConfirmation($toEmail, $toName, $orderNumber, $amount) {
        if (empty($this->apiKey)) {
            error_log("Brevo API key not set. Email not sent.");
            return false;
        }

        $subject = "Order Confirmed: " . $orderNumber;
        $htmlContent = "<html><body><h1>Thank you for your order, $toName!</h1>
                        <p>Your order <strong>$orderNumber</strong> for Rs $amount has been confirmed.</p>
                        <p>We will notify you once it ships.</p>
                        <p>Best regards,<br>VK Bat House</p></body></html>";

        return $this->sendEmail($toEmail, $toName, $subject, $htmlContent);
    }

    public function sendEmail($toEmail, $toName, $subject, $htmlContent) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.brevo.com/v3/smtp/email");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        
        $postData = [
            "sender" => ["name" => $this->senderName, "email" => $this->senderEmail],
            "to" => [["email" => $toEmail, "name" => $toName]],
            "subject" => $subject,
            "htmlContent" => $htmlContent
        ];
        
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Accept: application/json",
            "Content-Type: application/json",
            "api-key: " . $this->apiKey
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        return $httpCode >= 200 && $httpCode < 300;
    }
}
