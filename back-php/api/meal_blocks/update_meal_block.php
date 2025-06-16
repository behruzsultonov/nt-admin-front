<?php
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$id = $_GET['id'] ?? $_POST['id'] ?? null;
$type = $_POST['type'] ?? $_GET['type'] ?? null;
$time_start = $_POST['time_start'] ?? $_GET['time_start'] ?? null;
$time_end = $_POST['time_end'] ?? $_GET['time_end'] ?? null;

$formatTime = function($time) {
    if (!$time) return null;
    $parts = explode(':', $time);
    return str_pad($parts[0], 2, '0', STR_PAD_LEFT) . ':' . str_pad($parts[1], 2, '0', STR_PAD_LEFT);
};
$formattedTimeStart = $formatTime($time_start);
$formattedTimeEnd = $formatTime($time_end);

if (!$id || !$type || !$formattedTimeStart || !$formattedTimeEnd) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Необходимо указать id, тип, время начала и окончания',
        'details' => [
            'id' => !$id ? 'id обязателен' : null,
            'type' => !$type ? 'Тип блока обязателен' : null,
            'time_start' => !$formattedTimeStart ? 'Время начала обязательно' : null,
            'time_end' => !$formattedTimeEnd ? 'Время окончания обязательно' : null
        ]
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT plan_id FROM meal_blocks WHERE id = ?');
    $stmt->execute([$id]);
    $currentBlock = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$currentBlock) {
        http_response_code(404);
        echo json_encode(['error' => 'Блок питания не найден']);
        exit;
    }
    $plan_id = $currentBlock['plan_id'];
    // Проверяем пересечение временных интервалов (исключая текущий блок)
    $stmt = $pdo->prepare('SELECT id FROM meal_blocks WHERE plan_id = ? AND id != ? AND ((time_start <= ? AND time_end > ?) OR (time_start < ? AND time_end >= ?) OR (time_start >= ? AND time_end <= ?))');
    $stmt->execute([$plan_id, $id, $formattedTimeStart, $formattedTimeStart, $formattedTimeEnd, $formattedTimeEnd, $formattedTimeStart, $formattedTimeEnd]);
    $overlapping = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($overlapping) > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Временной интервал пересекается с существующим блоком']);
        exit;
    }
    $stmt = $pdo->prepare('UPDATE meal_blocks SET type = ?, time_start = ?, time_end = ? WHERE id = ?');
    $stmt->execute([$type, $formattedTimeStart, $formattedTimeEnd, $id]);
    echo json_encode([
        'id' => (int)$id,
        'plan_id' => $plan_id,
        'type' => $type,
        'time_start' => $formattedTimeStart,
        'time_end' => $formattedTimeEnd
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при обновлении блока питания']);
} 