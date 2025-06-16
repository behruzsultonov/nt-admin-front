<?php
require_once __DIR__ . '/../../config/database.php';
$blockId = $_GET['block_id'] ?? $_POST['block_id'] ?? null;
if (!$blockId) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан ID блока питания']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT mi.*, mi.note, mi.amount, d.name as dish_name, d.unit as unit, d.calories_per_100, d.proteins_per_100, d.carbs_per_100, d.fats_per_100, d.instruction, d.video_url, d.image_url FROM meal_items mi LEFT JOIN dishes d ON mi.dish_id = d.id WHERE mi.block_id = ?');
    $stmt->execute([$blockId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($items);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении блюд']);
} 