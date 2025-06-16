<?php
// Создать ингредиент
$name = $_GET['name'] ?? null;
$calories_per_100 = $_GET['calories_per_100'] ?? null;
$proteins_per_100 = $_GET['proteins_per_100'] ?? null;
$fats_per_100 = $_GET['fats_per_100'] ?? null;
$carbs_per_100 = $_GET['carbs_per_100'] ?? null;
if (!$name) {
    sendError('Необходимо указать название ингредиента');
}
try {
    global $pdo;
    $stmt = $pdo->prepare(
        'INSERT INTO ingredients (name, calories_per_100, proteins_per_100, fats_per_100, carbs_per_100) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $name,
        $calories_per_100,
        $proteins_per_100,
        $fats_per_100,
        $carbs_per_100
    ]);
    $id = $pdo->lastInsertId();
    sendResponse([
        'id' => $id,
        'name' => $name,
        'calories_per_100' => $calories_per_100,
        'proteins_per_100' => $proteins_per_100,
        'fats_per_100' => $fats_per_100,
        'carbs_per_100' => $carbs_per_100
    ], 201);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        sendError('Ингредиент с таким именем уже существует', 409);
    } else {
        sendError('Ошибка при создании ингредиента: ' . $e->getMessage(), 500);
    }
} 