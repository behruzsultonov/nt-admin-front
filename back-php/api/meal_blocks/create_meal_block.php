<?php
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$plan_id = $_POST['plan_id'] ?? $_GET['plan_id'] ?? null;
$type = $_POST['type'] ?? $_GET['type'] ?? null;
$time_start = $_POST['time_start'] ?? $_GET['time_start'] ?? null;
$time_end = $_POST['time_end'] ?? $_GET['time_end'] ?? null;
$rawDishes = $_POST['dishes'] ?? $_GET['dishes'] ?? [];
if (is_string($rawDishes)) {
    $dishes = json_decode($rawDishes, true);
} else {
    $dishes = $rawDishes;
}
if (!is_array($dishes)) $dishes = [];

// Форматируем время в формат HH:mm
$formatTime = function($time) {
    if (!$time) return null;
    $parts = explode(':', $time);
    return str_pad($parts[0], 2, '0', STR_PAD_LEFT) . ':' . str_pad($parts[1], 2, '0', STR_PAD_LEFT);
};
$formattedTimeStart = $formatTime($time_start);
$formattedTimeEnd = $formatTime($time_end);

if (!$plan_id || !$type || !$formattedTimeStart || !$formattedTimeEnd) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Необходимо указать ID плана, тип, время начала и окончания',
        'details' => [
            'plan_id' => !$plan_id ? 'ID плана обязателен' : null,
            'type' => !$type ? 'Тип блока обязателен' : null,
            'time_start' => !$formattedTimeStart ? 'Время начала обязательно' : null,
            'time_end' => !$formattedTimeEnd ? 'Время окончания обязательно' : null
        ]
    ]);
    exit;
}

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT id FROM meal_plans WHERE id = ?');
    $stmt->execute([$plan_id]);
    if (!$stmt->fetch()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'План питания не найден']);
        exit;
    }
    // Проверяем пересечение временных интервалов
    $stmt = $pdo->prepare('SELECT id, type, time_start, time_end FROM meal_blocks WHERE plan_id = ? AND ((time_start <= ? AND time_end > ?) OR (time_start < ? AND time_end >= ?) OR (time_start >= ? AND time_end <= ?))');
    $stmt->execute([$plan_id, $formattedTimeStart, $formattedTimeStart, $formattedTimeEnd, $formattedTimeEnd, $formattedTimeStart, $formattedTimeEnd]);
    $overlapping = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($overlapping) > 0) {
        $pdo->rollBack();
        $block = $overlapping[0];
        http_response_code(409);
        echo json_encode([
            'error' => 'Временной интервал пересекается с существующим блоком',
            'details' => [
                'existing_block' => [
                    'type' => $block['type'],
                    'time_start' => $block['time_start'],
                    'time_end' => $block['time_end']
                ],
                'new_block' => [
                    'type' => $type,
                    'time_start' => $formattedTimeStart,
                    'time_end' => $formattedTimeEnd
                ]
            ]
        ]);
        exit;
    }
    // Вставляем блок
    $stmt = $pdo->prepare('INSERT INTO meal_blocks (plan_id, type, time_start, time_end) VALUES (?, ?, ?, ?)');
    $stmt->execute([$plan_id, $type, $formattedTimeStart, $formattedTimeEnd]);
    $blockId = $pdo->lastInsertId();
    // Вставляем блюда, если есть
    $addedDishes = [];
    if (is_array($dishes) && count($dishes) > 0) {
        foreach ($dishes as $dish) {
            if (!isset($dish['dish_id']) || !isset($dish['amount'])) continue;
            $stmt = $pdo->prepare('INSERT INTO meal_items (block_id, dish_id, amount, note) VALUES (?, ?, ?, ?)');
            $stmt->execute([$blockId, $dish['dish_id'], $dish['amount'], $dish['note'] ?? null]);
            $addedDishes[] = [
                'dish_id' => $dish['dish_id'],
                'amount' => $dish['amount'],
                'note' => $dish['note'] ?? null
            ];
        }
    }
    $pdo->commit();
    http_response_code(201);
    echo json_encode([
        'id' => $blockId,
        'plan_id' => $plan_id,
        'type' => $type,
        'time_start' => $formattedTimeStart,
        'time_end' => $formattedTimeEnd,
        'dishes' => $addedDishes
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при создании блока питания']);
} 