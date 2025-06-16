<?php
require_once __DIR__ . '/../../config/database.php';

function sendMessage($chatId, $message, $nutritionistId = null, $userId = null, $imageUrl = null) {
    global $pdo;
    if (!$message && !$imageUrl) {
        http_response_code(400);
        echo json_encode(['error' => 'Message or image is required']);
        return;
    }
    if ($nutritionistId) {
        $stmt = $pdo->prepare("INSERT INTO nutritionist_messages (chat_id, nutritionist_id, message, image_url) VALUES (?, ?, ?, ?)");
        $stmt->execute([$chatId, $nutritionistId, $message, $imageUrl]);
        $messageId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$chatId]);
        $stmt = $pdo->prepare("SELECT nm.*, 'nutritionist' as sender_type, n.name as sender_name FROM nutritionist_messages nm JOIN nutritionists n ON nm.nutritionist_id = n.id WHERE nm.id = ?");
        $stmt->execute([$messageId]);
        $newMessage = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($newMessage);
    } else if ($userId) {
        $stmt = $pdo->prepare("INSERT INTO user_messages (chat_id, user_id, message, image_url) VALUES (?, ?, ?, ?)");
        $stmt->execute([$chatId, $userId, $message, $imageUrl]);
        $messageId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$chatId]);
        $stmt = $pdo->prepare("SELECT um.*, 'user' as sender_type, u.name as sender_name FROM user_messages um JOIN users u ON um.user_id = u.id WHERE um.id = ?");
        $stmt->execute([$messageId]);
        $newMessage = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($newMessage);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Either nutritionistId or userId is required']);
    }
}

$data = json_decode(file_get_contents('php://input'), true);
$chatId = $data['chatId'] ?? null;
$message = $data['message'] ?? null;
$nutritionistId = $data['nutritionistId'] ?? null;
$userId = $data['userId'] ?? null;
$imageUrl = $data['image_url'] ?? null;
if ($chatId && ($message || $imageUrl)) {
    sendMessage($chatId, $message, $nutritionistId, $userId, $imageUrl);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'chatId and message or image are required']);
} 