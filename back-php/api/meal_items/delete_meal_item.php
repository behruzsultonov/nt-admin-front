<?php
require_once __DIR__ . '/../../config/database.php';
$id = $_GET['id'] ?? $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id блюда']);
    exit;
}
try {
    $stmt = $pdo->prepare('DELETE FROM meal_items WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Блюдо не найдено']);
        exit;
    }
    echo json_encode(['message' => 'Блюдо успешно удалено']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при удалении блюда']);
} 