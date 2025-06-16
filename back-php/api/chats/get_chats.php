<?php
require_once __DIR__ . '/../../config/database.php';

function getChats($nutritionistId = null, $userId = null) {
    global $pdo;
    if ($nutritionistId) {
        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.user_id,
                c.nutritionist_id,
                u.name as user_name,
                u.email as user_email,
                c.created_at,
                c.updated_at,
                (
                    SELECT COUNT(*) 
                    FROM user_messages um 
                    WHERE um.chat_id = c.id 
                    AND um.is_read = false
                ) as unread_count
            FROM chats c
            JOIN users u ON c.user_id = u.id
            WHERE c.nutritionist_id = ?
            ORDER BY c.updated_at DESC
        ");
        $stmt->execute([$nutritionistId]);
    } else if ($userId) {
        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.user_id,
                c.nutritionist_id,
                n.name as nutritionist_name,
                n.email as nutritionist_email,
                c.created_at,
                c.updated_at
            FROM chats c
            JOIN nutritionists n ON c.nutritionist_id = n.id
            WHERE c.user_id = ?
            ORDER BY c.updated_at DESC
        ");
        $stmt->execute([$userId]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'nutritionistId or userId is required']);
        return;
    }
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($chats);
}

// Вызов функции для index.php
$nutritionistId = $_GET['nutritionistId'] ?? null;
$userId = $_GET['userId'] ?? null;
getChats($nutritionistId, $userId); 