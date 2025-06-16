<?php
require_once __DIR__ . '/../../config/database.php';

function markMessagesAsRead($chatId) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE user_messages SET is_read = true WHERE chat_id = ?");
    $stmt->execute([$chatId]);
    echo json_encode(['success' => true]);
}

$data = json_decode(file_get_contents('php://input'), true);
$chatId = $data['chatId'] ?? ($_GET['chatId'] ?? null);
if ($chatId) {
    markMessagesAsRead($chatId);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'chatId is required']);
} 