<?php
// Удалить ингредиент
$id = $_GET['id'] ?? null;
if (!$id) {
    sendError('Не указан id ингредиента');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('DELETE FROM ingredients WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        sendError('Ингредиент не найден', 404);
    }
    sendResponse(['message' => 'Ингредиент успешно удален']);
} catch (Exception $e) {
    sendError('Ошибка при удалении ингредиента: ' . $e->getMessage(), 500);
} 