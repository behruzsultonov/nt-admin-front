<?php
// Удалить пользователя
$id = $_GET['id'] ?? null;
if (!$id) {
    sendError('Не указан id пользователя');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        sendError('Пользователь не найден', 404);
    }
    sendResponse(['message' => 'Пользователь успешно удален']);
} catch (Exception $e) {
    sendError('Ошибка при удалении пользователя: ' . $e->getMessage(), 500);
} 