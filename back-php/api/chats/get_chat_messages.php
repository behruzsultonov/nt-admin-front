<?php
require_once __DIR__ . '/../../config/database.php';

function getChatMessages($chatId) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT 
            um.id,
            um.chat_id,
            um.message,
            um.is_read,
            um.created_at,
            um.image_url,
            'user' as sender_type,
            u.name as sender_name
        FROM user_messages um
        JOIN users u ON um.user_id = u.id
        WHERE um.chat_id = ?
    ");
    $stmt->execute([$chatId]);
    $userMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT 
            nm.id,
            nm.chat_id,
            nm.message,
            nm.is_read,
            nm.created_at,
            nm.image_url,
            'nutritionist' as sender_type,
            n.name as sender_name
        FROM nutritionist_messages nm
        JOIN nutritionists n ON nm.nutritionist_id = n.id
        WHERE nm.chat_id = ?
    ");
    $stmt->execute([$chatId]);
    $nutritionistMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $allMessages = array_merge($userMessages, $nutritionistMessages);
    usort($allMessages, function($a, $b) {
        return strtotime($a['created_at']) - strtotime($b['created_at']);
    });

    echo json_encode($allMessages);
}

$chatId = $_GET['chatId'] ?? null;
if ($chatId) {
    getChatMessages($chatId);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'chatId is required']);
} 