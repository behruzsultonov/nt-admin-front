<?php
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$user_id = $_POST['user_id'] ?? $_GET['user_id'] ?? null;
$source_plan_id = $_POST['source_plan_id'] ?? $_GET['source_plan_id'] ?? null;
$target_plan_id = $_POST['target_plan_id'] ?? $_GET['target_plan_id'] ?? null;
if (!$user_id || !$source_plan_id || !$target_plan_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимы user_id, source_plan_id, target_plan_id']);
    exit;
}
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT id FROM meal_plans WHERE id = ?');
    $stmt->execute([$target_plan_id]);
    if (!$stmt->fetch()) {
        throw new Exception('Целевой план не найден');
    }
    $pdo->prepare('DELETE FROM meal_blocks WHERE plan_id = ?')->execute([$target_plan_id]);
    $pdo->prepare('INSERT INTO meal_blocks (plan_id, type, time_start, time_end) SELECT ?, type, time_start, time_end FROM meal_blocks WHERE plan_id = ?')->execute([$target_plan_id, $source_plan_id]);
    $stmtNewBlocks = $pdo->prepare('SELECT id FROM meal_blocks WHERE plan_id = ? ORDER BY id');
    $stmtNewBlocks->execute([$target_plan_id]);
    $newBlocks = $stmtNewBlocks->fetchAll(PDO::FETCH_ASSOC);
    $stmtOldBlocks = $pdo->prepare('SELECT id FROM meal_blocks WHERE plan_id = ? ORDER BY id');
    $stmtOldBlocks->execute([$source_plan_id]);
    $oldBlocks = $stmtOldBlocks->fetchAll(PDO::FETCH_ASSOC);
    for ($i = 0; $i < count($oldBlocks); $i++) {
        $oldBlockId = $oldBlocks[$i]['id'];
        $newBlockId = $newBlocks[$i]['id'];
        $stmtItems = $pdo->prepare('SELECT dish_id, amount, note FROM meal_items WHERE block_id = ?');
        $stmtItems->execute([$oldBlockId]);
        $oldMealItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
        foreach ($oldMealItems as $mealItem) {
            $pdo->prepare('INSERT INTO meal_items (block_id, dish_id, amount, note) VALUES (?, ?, ?, ?)')->execute([$newBlockId, $mealItem['dish_id'], $mealItem['amount'], $mealItem['note']]);
        }
    }
    $pdo->commit();
    echo json_encode(['id' => $target_plan_id, 'message' => 'План успешно скопирован']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при копировании плана']);
} 