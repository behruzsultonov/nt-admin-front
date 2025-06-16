import axios from 'axios';

 const PHP_API_URL = 'https://sadoapp.tj/nt-admin/'; // путь до вашего PHP backend
// const PHP_API_URL = 'http://nt-admin/'; // путь до вашего PHP backend
const api = {};

// Аутентификация
api.loginNutritionist = (email, password) => axios.post(`${PHP_API_URL}/index.php?action=login_nutritionist`, { email, password });

// Ингредиенты
api.getIngredients = () => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_ingredients' } });
api.getIngredient = (id) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_ingredient', id } });
api.createIngredient = (data) => axios.post(`${PHP_API_URL}/index.php?action=create_ingredient`, data);
api.updateIngredient = (id, data) => axios.put(`${PHP_API_URL}/index.php?action=update_ingredient`, { id, ...data });
api.deleteIngredient = (id) => axios.delete(`${PHP_API_URL}/index.php`, { params: { action: 'delete_ingredient', id } });

// Блюда
api.getDishes = () => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_dishes' } });
api.getDish = (id) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_dish', id } });
api.createDish = (data) => axios.post(`${PHP_API_URL}/index.php?action=create_dish`, data);
api.updateDish = (id, data) => {
    // Ensure id is a valid number
    const dishId = parseInt(id, 10);
    if (isNaN(dishId)) {
        return Promise.reject(new Error('Некорректный ID блюда'));
    }

    // If data is FormData, ensure it has the required fields
    if (data instanceof FormData) {
        // Add ID to FormData if not present
        if (!data.has('id')) {
            data.append('id', dishId);
        }
        
        // Ensure meal_times is properly formatted
        const mealTimes = data.get('meal_times');
        if (mealTimes && typeof mealTimes === 'string') {
            try {
                JSON.parse(mealTimes);
            } catch (e) {
                data.set('meal_times', JSON.stringify([]));
            }
        }
        
        // Ensure ingredients is properly formatted
        const ingredients = data.get('ingredients');
        if (ingredients && typeof ingredients === 'string') {
            try {
                JSON.parse(ingredients);
            } catch (e) {
                data.set('ingredients', JSON.stringify([]));
            }
        }
    }

    return axios.post(
        `${PHP_API_URL}/index.php?action=update_dish&id=${dishId}`,
        data,
        {
            headers: data instanceof FormData ? 
                { 'Content-Type': 'multipart/form-data' } : 
                { 'Content-Type': 'application/json' }
        }
    ).catch(error => {
        console.error('Update dish error:', error);
        if (error.response) {
            if (error.response.status === 404) {
                throw new Error('Блюдо не найдено. Пожалуйста, обновите страницу и попробуйте снова.');
            }
            throw new Error(error.response.data.error || 'Ошибка при обновлении блюда');
        }
        throw error;
    });
};
api.deleteDish = (id) => axios.delete(`${PHP_API_URL}/index.php`, { params: { action: 'delete_dish', id } });

// Пользователи
api.getUsers = () => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_users' } });
api.getUser = (id) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_user', id } });
api.createUser = (data) => axios.post(`${PHP_API_URL}/index.php?action=create_user`, data);
api.updateUser = (id, data) => axios.put(`${PHP_API_URL}/index.php?action=update_user`, { id, ...data });
api.deleteUser = (id) => axios.delete(`${PHP_API_URL}/index.php`, { params: { action: 'delete_user', id } });

// Планы питания
api.getMealPlans = (userId) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_meal_plans', user_id: userId } });
api.getMealPlan = (id) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_meal_plan', id } });
api.getMealPlanNutrition = (id) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_meal_plan_nutrition', id } });
api.createMealPlan = (data) => axios.post(`${PHP_API_URL}/index.php?action=create_meal_plan`, data);
api.copyMealPlan = (userId, sourcePlanId, targetPlanId) => axios.post(`${PHP_API_URL}/index.php?action=copy_meal_plan`, { user_id: userId, source_plan_id: sourcePlanId, target_plan_id: targetPlanId });
api.deleteMealPlan = (id) => axios.delete(`${PHP_API_URL}/index.php`, { params: { action: 'delete_meal_plan', id } });

// Блоки питания
api.getMealBlocks = (planId) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_meal_blocks', plan_id: planId } });
api.getMealBlock = (id) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_meal_block', id } });
api.createMealBlock = (data) => axios.post(`${PHP_API_URL}/index.php?action=create_meal_block`, data);
api.updateMealBlock = (id, data) => axios.post(`${PHP_API_URL}/index.php?action=update_meal_block&id=${id}`, data);
api.deleteMealBlock = (id) => axios.delete(`${PHP_API_URL}/index.php`, { params: { action: 'delete_meal_block', id } });

// Блюда в блоке
api.getMealItems = (blockId) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_meal_items', block_id: blockId } });
api.createMealItem = (data) => axios.post(`${PHP_API_URL}/index.php?action=create_meal_item`, data);
api.deleteMealItem = (id) => axios.delete(`${PHP_API_URL}/index.php`, { params: { action: 'delete_meal_item', id } });
api.updateMealItem = (id, data) => axios.post(`${PHP_API_URL}/index.php?action=update_meal_item&id=${id}`, data);

// Нутрициологи
api.getNutritionists = () => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_nutritionists' } });
api.getNutritionist = (id) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_nutritionist', id } });
api.createNutritionist = (data) => axios.post(`${PHP_API_URL}/index.php?action=create_nutritionist`, data);
api.updateNutritionist = (id, data) => axios.post(`${PHP_API_URL}/index.php?action=update_nutritionist&id=${id}`, data);
api.deleteNutritionist = (id) => axios.delete(`${PHP_API_URL}/index.php`, { params: { action: 'delete_nutritionist', id } });

// История веса
api.getLastWeight = (userId, date) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_last_weight', user_id: userId, date } });
api.getWeightHistory = (userId) => axios.get(`${PHP_API_URL}/index.php`, { params: { action: 'get_weight_history', user_id: userId } });

// Чаты
api.getChats = (nutritionistId = null, userId = null) => {
    const params = { action: 'get_chats' };
    if (nutritionistId) params.nutritionistId = nutritionistId;
    if (userId) params.userId = userId;
    return axios.get(`${PHP_API_URL}/index.php`, { params });
};

api.getChatMessages = (chatId) => axios.get(`${PHP_API_URL}/index.php`, { 
    params: { action: 'get_chat_messages', chatId } 
});

api.sendMessage = (chatId, message, nutritionistId = null, userId = null, image_url = null) => {
    const data = { chatId, message };
    if (nutritionistId) data.nutritionistId = nutritionistId;
    if (userId) data.userId = userId;
    if (image_url) data.image_url = image_url;
    return axios.post(`${PHP_API_URL}/index.php?action=send_message`, data);
};

api.createChat = (userId, nutritionistId, message) => axios.post(
    `${PHP_API_URL}/index.php?action=create_chat`,
    { userId, nutritionistId, message }
);

api.markMessagesAsRead = (chatId) => axios.put(
    `${PHP_API_URL}/index.php?action=mark_messages_read`,
    { chatId }
);

export default api;
export { PHP_API_URL };