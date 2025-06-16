<?php
require_once __DIR__ . '/../../config/database.php';

// Проверяем, что запрос DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

// Получаем ID блюда из URL
$dishId = $_GET['id'] ?? null;
if (!$dishId) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан ID блюда']);
    exit;
}

try {
    // Начинаем транзакцию
    $pdo->beginTransaction();

    // Получаем текущее блюдо для удаления изображения
    $stmt = $pdo->prepare('SELECT image_url FROM dishes WHERE id = ?');
    $stmt->execute([$dishId]);
    $currentDish = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$currentDish) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Блюдо не найдено']);
        exit;
    }

    // Удаляем изображение, если оно существует
    if ($currentDish['image_url']) {
        $imagePath = __DIR__ . '/../../' . $currentDish['image_url'];
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }
    }

    // Удаляем связанные записи
    $pdo->prepare('DELETE FROM dish_meal_times WHERE dish_id = ?')->execute([$dishId]);
    $pdo->prepare('DELETE FROM dish_ingredients WHERE dish_id = ?')->execute([$dishId]);

    // Удаляем блюдо
    $stmt = $pdo->prepare('DELETE FROM dishes WHERE id = ?');
    $stmt->execute([$dishId]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Блюдо не найдено']);
        exit;
    }

    $pdo->commit();
    echo json_encode(['message' => 'Блюдо успешно удалено']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при удалении блюда']);
} 