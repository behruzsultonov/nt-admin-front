<?php
require_once __DIR__ . '/../../config/database.php';

function createChat($userId, $nutritionistId, $message) {
    global $pdo;
    if (!$userId || !$nutritionistId || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'userId, nutritionistId and message are required']);
        return;
    }
    $stmt = $pdo->prepare("INSERT INTO chats (user_id, nutritionist_id) VALUES (?, ?)");
    $stmt->execute([$userId, $nutritionistId]);
    $chatId = $pdo->lastInsertId();
    $stmt = $pdo->prepare("INSERT INTO user_messages (chat_id, user_id, message) VALUES (?, ?, ?)");
    $stmt->execute([$chatId, $userId, $message]);
    $stmt = $pdo->prepare("SELECT c.*, u.name as user_name, u.email as user_email, 0 as unread_count FROM chats c JOIN users u ON c.user_id = u.id WHERE c.id = ?");
    $stmt->execute([$chatId]);
    $newChat = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($newChat);
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['userId'] ?? null;
$nutritionistId = $data['nutritionistId'] ?? null;
$message = $data['message'] ?? null;
createChat($userId, $nutritionistId, $message); 