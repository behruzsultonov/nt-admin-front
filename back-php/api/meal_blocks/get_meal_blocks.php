<?php
require_once __DIR__ . '/../../config/database.php';
$planId = $_GET['plan_id'] ?? $_POST['plan_id'] ?? null;
if (!$planId) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан ID плана питания']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT id FROM meal_plans WHERE id = ?');
    $stmt->execute([$planId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'План питания не найден']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT * FROM meal_blocks WHERE plan_id = ? ORDER BY time_start');
    $stmt->execute([$planId]);
    $blocks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Форматируем время в HH:mm
    foreach ($blocks as &$block) {
        $block['time_start'] = implode(':', array_slice(explode(':', $block['time_start']), 0, 2));
        $block['time_end'] = implode(':', array_slice(explode(':', $block['time_end']), 0, 2));
    }
    echo json_encode($blocks);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении блоков питания']);
} 