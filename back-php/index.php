<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/lib/helpers.php';

$pdo = getDbConnection();

// Для POST, PUT, DELETE — парсим JSON-тело и объединяем с $_GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input)) {
        foreach ($input as $k => $v) {
            if (!isset($_GET[$k])) {
                $_GET[$k] = $v;
            }
        }
    }
}

$action = $_GET['action'] ?? null;

if (!$action) {
    sendError('Не указан action', 404);
}

switch ($action) {
    case 'get_users':
        require __DIR__ . '/api/users/get_users.php';
        break;
    case 'get_user':
        require __DIR__ . '/api/users/get_user.php';
        break;
    case 'create_user':
        require __DIR__ . '/api/users/create_user.php';
        break;
    case 'update_user':
        require __DIR__ . '/api/users/update_user.php';
        break;
    case 'delete_user':
        require __DIR__ . '/api/users/delete_user.php';
        break;
    case 'get_ingredients':
        require __DIR__ . '/api/ingredients/get_ingredients.php';
        break;
    case 'get_ingredient':
        require __DIR__ . '/api/ingredients/get_ingredient.php';
        break;
    case 'create_ingredient':
        require __DIR__ . '/api/ingredients/create_ingredient.php';
        break;
    case 'update_ingredient':
        require __DIR__ . '/api/ingredients/update_ingredient.php';
        break;
    case 'delete_ingredient':
        require __DIR__ . '/api/ingredients/delete_ingredient.php';
        break;
    case 'get_dishes':
        require __DIR__ . '/api/dishes/get_dishes.php';
        break;
    case 'get_dish':
        require __DIR__ . '/api/dishes/get_dish.php';
        break;
    case 'create_dish':
        require __DIR__ . '/api/dishes/create_dish.php';
        break;
    case 'update_dish':
        require __DIR__ . '/api/dishes/update_dish.php';
        break;
    case 'delete_dish':
        require __DIR__ . '/api/dishes/delete_dish.php';
        break;
    case 'get_meal_plans':
        require __DIR__ . '/api/meal_plans/get_meal_plans.php';
        exit;
    case 'get_meal_plan':
        require __DIR__ . '/api/meal_plans/get_meal_plan.php';
        exit;
    case 'create_meal_plan':
        require __DIR__ . '/api/meal_plans/create_meal_plan.php';
        exit;
    case 'delete_meal_plan':
        require __DIR__ . '/api/meal_plans/delete_meal_plan.php';
        exit;
    case 'copy_meal_plan':
        require __DIR__ . '/api/meal_plans/copy_meal_plan.php';
        exit;
    case 'get_meal_plan_nutrition':
        require __DIR__ . '/api/meal_plans/get_meal_plan_nutrition.php';
        exit;
    case 'get_meal_blocks':
        require __DIR__ . '/api/meal_blocks/get_meal_blocks.php';
        exit;
    case 'create_meal_block':
        require __DIR__ . '/api/meal_blocks/create_meal_block.php';
        exit;
    case 'update_meal_block':
        require __DIR__ . '/api/meal_blocks/update_meal_block.php';
        exit;
    case 'delete_meal_block':
        require __DIR__ . '/api/meal_blocks/delete_meal_block.php';
        exit;
    case 'get_meal_items':
        require __DIR__ . '/api/meal_items/get_meal_items.php';
        exit;
    case 'create_meal_item':
        require __DIR__ . '/api/meal_items/create_meal_item.php';
        exit;
    case 'get_meal_block':
        require __DIR__ . '/api/meal_blocks/get_meal_block.php';
        exit;
    case 'update_meal_item':
        require __DIR__ . '/api/meal_items/update_meal_item.php';
        exit;
    case 'delete_meal_item':
        require __DIR__ . '/api/meal_items/delete_meal_item.php';
        exit;
    case 'login_nutritionist':
        require __DIR__ . '/api/nutritionists/login.php';
        exit;
    case 'get_nutritionists':
        require __DIR__ . '/api/nutritionists/get_nutritionists.php';
        exit;
    case 'get_nutritionist':
        require __DIR__ . '/api/nutritionists/get_nutritionist.php';
        exit;
    case 'create_nutritionist':
        require __DIR__ . '/api/nutritionists/create_nutritionist.php';
        exit;
    case 'update_nutritionist':
        require __DIR__ . '/api/nutritionists/update_nutritionist.php';
        exit;
    case 'delete_nutritionist':
        require __DIR__ . '/api/nutritionists/delete_nutritionist.php';
        exit;
    case 'get_last_weight':
        require __DIR__ . '/api/weight_history/get_last_weight.php';
        exit;
    case 'get_weight_history':
        require __DIR__ . '/api/weight_history/get_weight_history.php';
        exit;
    case 'get_chats':
        require __DIR__ . '/api/chats/get_chats.php';
        break;
    case 'get_chat_messages':
        require __DIR__ . '/api/chats/get_chat_messages.php';
        break;
    case 'send_message':
        require __DIR__ . '/api/chats/send_message.php';
        break;
    case 'create_chat':
        require __DIR__ . '/api/chats/create_chat.php';
        break;
    case 'mark_messages_read':
        require __DIR__ . '/api/chats/mark_messages_read.php';
        break;
    case 'upload_chat_image':
        require __DIR__ . '/api/chats/upload_chat_image.php';
        exit;
    default:
        sendError('Неизвестный action', 404);
} 