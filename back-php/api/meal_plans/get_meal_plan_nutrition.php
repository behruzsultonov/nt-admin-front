<?php
require_once __DIR__ . '/../../config/database.php';
$id = $_GET['id'] ?? $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id плана']);
    exit;
}
try {
    $stmt = $pdo->prepare("SELECT 
        CASE mb.type
          WHEN 'breakfast' THEN 'Завтрак'
          WHEN 'lunch' THEN 'Обед'
          WHEN 'dinner' THEN 'Ужин'
          WHEN 'snack' THEN 'Перекус'
          ELSE mb.type
        END as type,
        GROUP_CONCAT(
          CONCAT(
            d.name, ' (', mi.amount, ' г)',
            ' [', 
            ROUND((mi.amount / 100) * d.calories_per_100), ', ',
            ROUND((mi.amount / 100) * d.proteins_per_100), ', ',
            ROUND((mi.amount / 100) * d.fats_per_100), ', ',
            ROUND((mi.amount / 100) * d.carbs_per_100),
            ']'
          )
          SEPARATOR ' | '
        ) as dishes
      FROM meal_plans mp
      LEFT JOIN meal_blocks mb ON mp.id = mb.plan_id
      LEFT JOIN meal_items mi ON mb.id = mi.block_id
      LEFT JOIN dishes d ON mi.dish_id = d.id
      WHERE mp.id = ?
        AND mi.id IS NOT NULL
      GROUP BY mb.type
      HAVING dishes IS NOT NULL");
    $stmt->execute([$id]);
    $mealTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt2 = $pdo->prepare("SELECT 
        COALESCE(ROUND(SUM((mi.amount / 100) * d.calories_per_100)), 0) as total_calories,
        COALESCE(ROUND(SUM((mi.amount / 100) * d.proteins_per_100)), 0) as total_proteins,
        COALESCE(ROUND(SUM((mi.amount / 100) * d.fats_per_100)), 0) as total_fats,
        COALESCE(ROUND(SUM((mi.amount / 100) * d.carbs_per_100)), 0) as total_carbs
      FROM meal_plans mp
      LEFT JOIN meal_blocks mb ON mp.id = mb.plan_id
      LEFT JOIN meal_items mi ON mb.id = mi.block_id
      LEFT JOIN dishes d ON mi.dish_id = d.id
      WHERE mp.id = ?
        AND mi.id IS NOT NULL");
    $stmt2->execute([$id]);
    $nutrition = $stmt2->fetch(PDO::FETCH_ASSOC);
    if (!$nutrition) {
        http_response_code(404);
        echo json_encode(['error' => 'План питания не найден']);
        exit;
    }
    $mealTypesFormatted = count($mealTypes) > 0
      ? implode(' | ', array_map(function($mt) { return $mt['type'] . ': ' . $mt['dishes']; }, $mealTypes))
      : 'Нет блюд';
    $nutrition['meal_types'] = $mealTypesFormatted;
    echo json_encode($nutrition);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении КБЖУ']);
} 