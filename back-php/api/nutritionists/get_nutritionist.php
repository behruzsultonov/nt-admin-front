<?php
require_once __DIR__ . '/../../config/database.php';
header('Content-Type: application/json');
$id = $_GET['id'] ?? $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT id, email, name FROM nutritionists WHERE id = ?');
    $stmt->execute([$id]);
    $nutritionist = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$nutritionist) {
        http_response_code(404);
        echo json_encode(['error' => 'Нутрициолог не найден']);
        exit;
    }
    echo json_encode($nutritionist);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении нутрициолога']);
} 