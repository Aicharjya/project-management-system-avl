<?php
require_once __DIR__ . '/config.php';

function jsonResponse($success, $data = null, $message = '', $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    $out = ['success' => (bool)$success];
    if ($success && $data !== null) $out['data'] = $data;
    if (!$success && $message) $out['error'] = $message;
    if ($success && $message) $out['message'] = $message;
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) return [];
    return $data;
}

function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['user_id'])) {
        jsonResponse(false, null, 'Unauthorized', 401);
    }
    return $_SESSION['user_id'];
}

function sendServerError($msg = 'Server error') {
    jsonResponse(false, null, $msg, 500);
}

?>
