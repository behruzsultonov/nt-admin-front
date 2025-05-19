import axios from 'axios';

const API_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Добавляем перехватчик для обработки ошибок
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Сервер ответил с ошибкой
      console.error('Ошибка API:', error.response.data);
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      console.error('Нет ответа от сервера');
    } else {
      // Ошибка при настройке запроса
      console.error('Ошибка запроса:', error.message);
    }
    return Promise.reject(error);
  }
);

// Аутентификация
api.loginNutritionist = (email, password) => api.post('/api/nutritionists/login', { email, password });

// Ингредиенты
api.getIngredients = () => api.get('/api/ingredients');
api.getIngredient = (id) => api.get(`/api/ingredients/${id}`);
api.createIngredient = (data) => api.post('/api/ingredients', data);
api.updateIngredient = (id, data) => api.put(`/api/ingredients/${id}`, data);
api.deleteIngredient = (id) => api.delete(`/api/ingredients/${id}`);

// Блюда
api.getDishes = () => api.get('/api/dishes');
api.getDish = (id) => api.get(`/api/dishes/${id}`);
api.createDish = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/api/dishes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
api.updateDish = async (id, formData) => {
  try {
    const response = await axios.put(`${API_URL}/api/dishes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
api.deleteDish = (id) => api.delete(`/api/dishes/${id}`);

// Пользователи
api.getUsers = () => api.get('/api/users');
api.getUser = (id) => api.get(`/api/users/${id}`);
api.createUser = (data) => api.post('/api/users', data);
api.updateUser = (id, data) => api.put(`/api/users/${id}`, data);
api.deleteUser = (id) => api.delete(`/api/users/${id}`);

// Планы питания
api.getMealPlans = (userId) => api.get(userId ? `/api/meal_plans?user_id=${userId}` : '/api/meal_plans');
api.getMealPlan = (id) => api.get(`/api/meal_plans/${id}`);
api.getMealPlanNutrition = (id) => api.get(`/api/meal_plans/${id}/nutrition`);
api.createMealPlan = (data) => api.post('/api/meal_plans', data);
api.copyMealPlan = (userId, sourcePlanId, targetPlanId) => api.post('/api/meal_plans/copy', { user_id: userId, source_plan_id: sourcePlanId, target_plan_id: targetPlanId });
api.deleteMealPlan = (id) => api.delete(`/api/meal_plans/${id}`);

// Блоки питания
api.getMealBlocks = (planId) => api.get(`/api/meal_blocks?plan_id=${planId}`);
api.getMealBlock = (id) => api.get(`/api/meal_blocks/${id}`);
api.createMealBlock = (data) => api.post('/api/meal_blocks', data);
api.updateMealBlock = (id, data) => api.put(`/api/meal_blocks/${id}`, data);
api.deleteMealBlock = (id) => api.delete(`/api/meal_blocks/${id}`);

// Блюда в блоке
api.getMealItems = (blockId) => api.get(`/api/meal_items?block_id=${blockId}`);
api.createMealItem = (data) => api.post('/api/meal_items', data);
api.deleteMealItem = (id) => api.delete(`/api/meal_items/${id}`);
api.updateMealItem = (id, data) => api.put(`/api/meal_items/${id}`, data);

// Нутрициологи
api.getNutritionists = () => api.get('/api/nutritionists');
api.getNutritionist = (id) => api.get(`/api/nutritionists/${id}`);
api.createNutritionist = (data) => api.post('/api/nutritionists', data);
api.updateNutritionist = (id, data) => api.put(`/api/nutritionists/${id}`, data);
api.deleteNutritionist = (id) => api.delete(`/api/nutritionists/${id}`);

// История веса
api.getLastWeight = (userId, date) => api.get('/api/weight_history/last', { params: { user_id: userId, date } });
api.getWeightHistory = (userId) => api.get('/api/weight_history', { params: { user_id: userId } });

export default api;