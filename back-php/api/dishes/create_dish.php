<?php
require_once __DIR__ . '/../../config/database.php';

// Проверяем, что запрос POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

try {
    // Получаем и валидируем данные
    $name = trim($_POST['name'] ?? '');
    $calories_per_100 = filter_var($_POST['calories_per_100'], FILTER_VALIDATE_FLOAT);
    $proteins_per_100 = filter_var($_POST['proteins_per_100'], FILTER_VALIDATE_FLOAT);
    $carbs_per_100 = filter_var($_POST['carbs_per_100'], FILTER_VALIDATE_FLOAT);
    $fats_per_100 = filter_var($_POST['fats_per_100'], FILTER_VALIDATE_FLOAT);
    $instruction = trim($_POST['instruction'] ?? '');
    $video_url = trim($_POST['video_url'] ?? '');
    $meal_times = $_POST['meal_times'] ?? '[]';
    $ingredients = $_POST['ingredients'] ?? '[]';
    $unit = trim($_POST['unit'] ?? 'г');
    $time = filter_var($_POST['time'], FILTER_VALIDATE_INT);
    $note = trim($_POST['note'] ?? '');

    // Валидация обязательных полей
    if (empty($name) || empty($instruction) || !$time) {
        http_response_code(400);
        echo json_encode(['error' => 'Не заполнены обязательные поля']);
        exit;
    }

    // Валидация числовых значений
    if ($calories_per_100 === false || $proteins_per_100 === false || 
        $carbs_per_100 === false || $fats_per_100 === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Некорректные значения для калорий/БЖУ']);
        exit;
    }

    // Парсинг JSON данных
    try {
        $parsedMealTimes = json_decode($meal_times, true);
        $parsedIngredients = json_decode($ingredients, true);
        
        if (!is_array($parsedMealTimes) || !is_array($parsedIngredients)) {
            throw new Exception('Invalid JSON data');
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Некорректный формат данных для типов приема пищи или ингредиентов']);
        exit;
    }

    // Начинаем транзакцию
    $pdo->beginTransaction();

    // Обработка изображения
    $image_url = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = dirname(dirname(dirname(__FILE__))) . '/uploads/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Проверяем тип файла
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($fileInfo, $_FILES['image']['tmp_name']);
        finfo_close($fileInfo);

        if (!in_array($mimeType, $allowedTypes)) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Недопустимый тип файла. Разрешены только JPEG, PNG и GIF']);
            exit;
        }

        // Генерируем уникальное имя файла
        $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $filename = time() . '-' . bin2hex(random_bytes(8)) . '.' . $extension;
        $uploadFile = $uploadDir . $filename;

        if (!move_uploaded_file($_FILES['image']['tmp_name'], $uploadFile)) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка при загрузке изображения']);
            exit;
        }
        
        $image_url = '/uploads/' . $filename;
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Изображение обязательно для создания блюда']);
        exit;
    }

    // Создаем блюдо
    $stmt = $pdo->prepare('
        INSERT INTO dishes (
            name, calories_per_100, proteins_per_100, carbs_per_100, 
            fats_per_100, instruction, video_url, image_url, unit, time, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    $stmt->execute([
        $name, $calories_per_100, $proteins_per_100, $carbs_per_100,
        $fats_per_100, $instruction, $video_url ?: null, $image_url,
        $unit, $time, $note
    ]);

    $dishId = $pdo->lastInsertId();

    // Добавляем типы приема пищи
    foreach ($parsedMealTimes as $mealTime) {
        $stmt = $pdo->prepare('INSERT INTO dish_meal_times (dish_id, meal_time) VALUES (?, ?)');
        $stmt->execute([$dishId, $mealTime]);
    }

    // Добавляем ингредиенты
    foreach ($parsedIngredients as $ingredient) {
        if (!isset($ingredient['ingredient_id']) || !isset($ingredient['amount'])) {
            continue;
        }
        $stmt = $pdo->prepare('
            INSERT INTO dish_ingredients (dish_id, ingredient_id, amount, unit) 
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([
            $dishId,
            $ingredient['ingredient_id'],
            $ingredient['amount'],
            $ingredient['unit'] ?? 'г'
        ]);
    }

    // Получаем созданное блюдо
    $query = "
        SELECT d.*, 
            GROUP_CONCAT(DISTINCT dmt.meal_time) as meal_times,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', di.id,
                    'ingredient_id', i.id,
                    'name', i.name,
                    'amount', di.amount,
                    'unit', di.unit
                )
            ) as ingredients
        FROM dishes d
        LEFT JOIN dish_meal_times dmt ON d.id = dmt.dish_id
        LEFT JOIN dish_ingredients di ON d.id = di.dish_id
        LEFT JOIN ingredients i ON di.ingredient_id = i.id
        WHERE d.id = ?
        GROUP BY d.id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$dishId]);
    $dish = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$dish) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Блюдо не найдено после создания']);
        exit;
    }

    // Форматируем данные для ответа
    $dish['meal_times'] = $dish['meal_times'] ? explode(',', $dish['meal_times']) : [];
    $dish['ingredients'] = json_decode($dish['ingredients'], true) ?: [];
    $dish['ingredients'] = array_filter($dish['ingredients'], function($i) {
        return $i && isset($i['id']);
    });

    // Завершаем транзакцию
    $pdo->commit();
    
    // Отправляем успешный ответ
    http_response_code(201); // Created
    echo json_encode($dish);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error creating dish: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при создании блюда: ' . $e->getMessage()]);
} 