<?php
// Обновить ингредиент
$id = $_GET['id'] ?? null;
$name = $_GET['name'] ?? null;
$calories_per_100 = $_GET['calories_per_100'] ?? null;
$proteins_per_100 = $_GET['proteins_per_100'] ?? null;
$fats_per_100 = $_GET['fats_per_100'] ?? null;
$carbs_per_100 = $_GET['carbs_per_100'] ?? null;
if (!$id || !$name) {
    sendError('Необходимо указать id и название ингредиента');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('UPDATE ingredients SET name = ?, calories_per_100 = ?, proteins_per_100 = ?, fats_per_100 = ?, carbs_per_100 = ? WHERE id = ?');
    $stmt->execute([$name, $calories_per_100, $proteins_per_100, $fats_per_100, $carbs_per_100, $id]);
    if ($stmt->rowCount() === 0) {
        sendError('Ингредиент не найден', 404);
    }
    sendResponse([
        'id' => $id,
        'name' => $name,
        'calories_per_100' => $calories_per_100,
        'proteins_per_100' => $proteins_per_100,
        'fats_per_100' => $fats_per_100,
        'carbs_per_100' => $carbs_per_100
    ]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        sendError('Ингредиент с таким именем уже существует', 409);
    } else {
        sendError('Ошибка при обновлении ингредиента: ' . $e->getMessage(), 500);
    }
} 