<?php
require_once __DIR__ . '/../../config/database.php';

// Получить все блюда
try {
    $query = "
        SELECT d.*, 
            GROUP_CONCAT(DISTINCT mt.meal_time) AS meal_times,
            GROUP_CONCAT(DISTINCT JSON_OBJECT(
                'id', i.id,
                'name', i.name,
                'amount', di.amount,
                'unit', di.unit
            ) SEPARATOR '||') AS ingredients
        FROM dishes d
        LEFT JOIN dish_meal_times mt ON d.id = mt.dish_id
        LEFT JOIN dish_ingredients di ON d.id = di.dish_id
        LEFT JOIN ingredients i ON di.ingredient_id = i.id
        GROUP BY d.id
    ";
    $stmt = $pdo->query($query);
    $dishes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Форматируем результат
    $formattedDishes = array_map(function($dish) {
        $dish['meal_times'] = $dish['meal_times'] ? explode(',', $dish['meal_times']) : [];
        $dish['ingredients'] = $dish['ingredients'] ? array_filter(array_map(function($ing) {
            try {
                return json_decode($ing, true);
            } catch (Exception $e) {
                return null;
            }
        }, explode('||', $dish['ingredients']))) : [];
        return $dish;
    }, $dishes);

    echo json_encode($formattedDishes);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении блюд']);
} 