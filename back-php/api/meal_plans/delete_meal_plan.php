<?php
require_once __DIR__ . '/../../config/database.php';
$id = $_GET['id'] ?? $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id плана']);
    exit;
}
try {
    $stmt = $pdo->prepare('DELETE FROM meal_plans WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'План питания не найден']);
        exit;
    }
    echo json_encode(['message' => 'План питания успешно удален']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при удалении плана питания']);
} 