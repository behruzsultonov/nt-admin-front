<?php
require_once __DIR__ . '/../../config/database.php';
$id = $_GET['id'] ?? $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id блока питания']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT * FROM meal_blocks WHERE id = ?');
    $stmt->execute([$id]);
    $block = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$block) {
        http_response_code(404);
        echo json_encode(['error' => 'Блок питания не найден']);
        exit;
    }
    // Форматируем время в HH:mm
    $block['time_start'] = implode(':', array_slice(explode(':', $block['time_start']), 0, 2));
    $block['time_end'] = implode(':', array_slice(explode(':', $block['time_end']), 0, 2));
    echo json_encode($block);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении блока питания']);
} 