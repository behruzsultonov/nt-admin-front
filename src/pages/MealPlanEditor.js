import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  TimePicker,
  Modal,
  List,
  Space,
  message,
  Typography,
  Divider,
  InputNumber,
  Popconfirm,
  DatePicker,
  Tag,
  Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, CopyOutlined, DashboardOutlined, CoffeeOutlined, CloudOutlined, ContainerOutlined, AppleOutlined, ShopOutlined, CheckCircleFilled, CloseCircleFilled, ClockCircleFilled } from '@ant-design/icons';
import api from '../api/client';
import dayjs from 'dayjs';
import ReactSelect from 'react-select';


const { Title, Text } = Typography;
const { Option } = Select;

const blockTypes = [
  { value: 'water', label: 'Вода', emoji: '💧' },
  { value: 'breakfast', label: 'Завтрак', emoji: '🍳' },
  { value: 'lunch', label: 'Обед', emoji: '🥘' },
  { value: 'snack', label: 'Перекус', emoji: '🍎' },
  { value: 'dinner', label: 'Ужин', emoji: '🍽️' },
];

const timeEmojis = {
  '06:00': '🕕',
  '08:00': '🕗',
  '11:00': '🕚',
  '12:00': '🕛',
  '14:30': '🕝',
  '17:00': '🕔',
  '19:00': '🕖',
};

const mealTypeOrder = {
  '🍳 Завтрак': 1,
  '🥘 Обед': 2,
  '🍎 Перекус': 3,
  '🍽️ Ужин': 4,
  '💧 Вода': 5
};

const mealTypeEmojis = {
  'Завтрак': '🍳',
  'Обед': '🥘',
  'Перекус': '🍎',
  'Ужин': '🍽️',
  'Вода': '💧'
};

const MealPlanEditor = () => {
  const { id, planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockForm] = Form.useForm();
  const [mealForm] = Form.useForm();
  const [form] = Form.useForm();
  const [editBlockModalVisible, setEditBlockModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editBlockForm] = Form.useForm();
  const [dishes, setDishes] = useState([]);
  const [addMealModalVisible, setAddMealModalVisible] = useState(false);
  const [addMealBlockId, setAddMealBlockId] = useState(null);
  const [addMealForm] = Form.useForm();
  const [editMealModalVisible, setEditMealModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editMealForm] = Form.useForm();
  const [addMealBlockType, setAddMealBlockType] = useState(null);
  const [blockTypeInModal, setBlockTypeInModal] = useState(null);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [previousPlans, setPreviousPlans] = useState([]);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [copyForm] = Form.useForm();
  const [dishesSelectOpen, setDishesSelectOpen] = useState(false);
  const dishesSelectRef = useRef();
  const [lastWeight, setLastWeight] = useState(null);
  const [plansWithNutrition, setPlansWithNutrition] = useState([]);
  const [editBlockMeals, setEditBlockMeals] = useState([]);
  const [editBlockDishes, setEditBlockDishes] = useState([]);
  const [completedBlocks, setCompletedBlocks] = useState({});
  const [addBlockLoading, setAddBlockLoading] = useState(false);
  const [editBlockLoading, setEditBlockLoading] = useState(false);

  // Добавим стили для анимации
  const buttonWithTextStyle = {
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    transition: 'width 0.3s',
    background: '#f5f5f5',
    border: 'none',
    boxShadow: 'none',
    padding: '4px 12px',
    minWidth: 32,
    height: 32,
    cursor: 'pointer',
  };
  const buttonTextStyle = {
    opacity: 0,
    maxWidth: 0,
    marginLeft: 8,
    transition: 'opacity 0.3s, max-width 0.3s',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    color: 'inherit',
  };
  const buttonTextStyleVisible = {
    opacity: 1,
    maxWidth: 200,
    marginLeft: 8,
    transition: 'opacity 0.3s, max-width 0.3s',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    color: 'inherit',
  };

  const fetchPlanAndBlocks = async () => {
    try {
      setLoading(true);
      
      // Проверяем наличие planId
      if (!planId) {
        message.error('ID плана не указан');
        return;
      }

      // Загружаем план
      const planResponse = await api.getMealPlan(planId);
      if (!planResponse.data) {
        message.error('План не найден');
        return;
      }
      setPlan(planResponse.data);
      
      // Загружаем блоки
      const blocksResponse = await api.getMealBlocks(planId);
      
      // Получаем последний вес до даты плана
      try {
        const lastWeightResponse = await api.getLastWeight(
          planResponse.data.user_id,
          planResponse.data.date
        );
        if (lastWeightResponse.data) {
          setLastWeight(lastWeightResponse.data);
        }
      } catch (weightError) {
        console.error('Ошибка при загрузке веса:', weightError);
        // Не прерываем выполнение, так как вес не критичен
      }
      
      // Загружаем блюда для каждого блока
      let blocksWithMeals = [];
      if (Array.isArray(blocksResponse.data)) {
        blocksWithMeals = await Promise.all(
          blocksResponse.data.map(async (block) => {
            if (!block.id) return block;
            try {
              const mealsResponse = await api.getMealItems(block.id);
              return { ...block, meals: mealsResponse.data || [] };
            } catch (mealError) {
              console.error(`Ошибка при загрузке блюд для блока ${block.id}:`, mealError);
              return { ...block, meals: [] };
            }
          })
        );
      }
      setBlocks(blocksWithMeals);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.data?.error || 'Неизвестная ошибка'}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при загрузке данных');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDishes = async () => {
    try {
      const response = await api.getDishes();
      if (response.data) {
        setDishes(response.data);
      } else {
        message.warning('Список блюд пуст');
      }
    } catch (error) {
      console.error('Ошибка при загрузке блюд:', error);
      if (error.response) {
        message.error(`Ошибка загрузки блюд: ${error.response.data?.error || 'Неизвестная ошибка'}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при загрузке блюд');
      }
    }
  };

  const fetchPlanNutrition = async (planId) => {
    if (!planId) return null;
    
    try {
      const response = await api.getMealPlanNutrition(planId);
      return response.data || null;
    } catch (error) {
      console.error(`Ошибка при получении информации о питании для плана ${planId}:`, error);
      return null;
    }
  };

  const fetchPreviousPlans = async () => {
    if (!id) {
      console.error('ID пользователя не указан');
      return;
    }

    try {
      const response = await api.getMealPlans(id);
      if (!response.data) {
        setPreviousPlans([]);
        setPlansWithNutrition([]);
        return;
      }

      // Фильтруем планы, исключая текущий
      const filteredPlans = response.data.filter(p => p.id !== parseInt(planId));
      
      // Получаем информацию о питании для каждого плана
      const plansWithNutritionData = await Promise.all(
        filteredPlans.map(async (plan) => {
          try {
            const nutritionData = await fetchPlanNutrition(plan.id);
            return {
              ...plan,
              nutrition: nutritionData
            };
          } catch (error) {
            console.error(`Ошибка при загрузке питания для плана ${plan.id}:`, error);
            return {
              ...plan,
              nutrition: null
            };
          }
        })
      );
      
      setPlansWithNutrition(plansWithNutritionData);
      setPreviousPlans(filteredPlans);
    } catch (error) {
      console.error('Ошибка при загрузке предыдущих планов:', error);
      if (error.response) {
        message.error(`Ошибка загрузки планов: ${error.response.data?.error || 'Неизвестная ошибка'}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при загрузке предыдущих планов');
      }
    }
  };

  // Обновляем useEffect для корректной загрузки данных
  useEffect(() => {
    if (planId) {
      fetchPlanAndBlocks();
      fetchPreviousPlans();
    }
  }, [planId, id]);

  useEffect(() => {
    console.log('plansWithNutrition:', plansWithNutrition);
  }, [plansWithNutrition]);

  useEffect(() => {
    if (blockModalVisible) fetchDishes();
  }, [blockModalVisible]);

  useEffect(() => {
    if (addMealModalVisible) fetchDishes();
  }, [addMealModalVisible]);

  useEffect(() => {
    if (editBlockModalVisible) fetchDishes();
  }, [editBlockModalVisible]);

  useEffect(() => {
    if (
      editBlockModalVisible &&
      editingBlock &&
      dishes.length > 0
    ) {
      setEditBlockDishes(editingBlock.meals?.map(meal => meal.dish_id) || []);
      setEditBlockMeals(editingBlock.meals || []);
    }
  }, [dishes, editBlockModalVisible, editingBlock]);

  const handleAddBlock = async (values) => {
    setAddBlockLoading(true);
    try {
      let dishesArr = [];
      if (values.type === 'water') {
        let response = await api.createMealBlock({
          plan_id: parseInt(planId),
          type: values.type,
          time_start: values.startTime.format('HH:mm'),
          time_end: values.endTime.format('HH:mm'),
          note: values.note
        });
        if (response.data && response.data.id) {
          await api.createMealItem({
            block_id: response.data.id,
            amount: values.water_amount,
            note: values.water_note
          });
          setBlocks([...blocks, { ...response.data, meals: [] }]);
          setBlockModalVisible(false);
          blockForm.resetFields();
          setBlockTypeInModal(null);
          setSelectedDishes([]);
          message.success('Блок воды добавлен');
          fetchPlanAndBlocks();
        }
      } else {
        // Для обычных блоков с блюдами
        let response = await api.createMealBlock({
          plan_id: parseInt(planId),
          type: values.type,
          time_start: values.startTime.format('HH:mm'),
          time_end: values.endTime.format('HH:mm'),
          dishes: (values.dishes || []).map(dishId => ({
            dish_id: dishId,
            amount: values[`amount_${dishId}`],
            note: values[`note_${dishId}`]
          })),
          note: values.note
        });
        if (response.data && response.data.id) {
          setBlocks([...blocks, { ...response.data, meals: [] }]);
          setBlockModalVisible(false);
          blockForm.resetFields();
          setBlockTypeInModal(null);
          setSelectedDishes([]);
          message.success('Блок добавлен');
          fetchPlanAndBlocks();
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        message.error('Блок с таким временем уже существует');
      } else {
        message.error('Ошибка при добавлении блока');
      }
    } finally {
      setAddBlockLoading(false);
    }
  };

  const handleAddMeal = async (values) => {
    try {
      const response = await api.createMeal({
        meal_plan_id: parseInt(id),
        ...values,
        ingredients: values.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          amount: ing.amount,
          unit: ing.unit
        }))
      });
      if (response.data) {
        message.success('Блюдо добавлено');
        form.resetFields();
        fetchPlanAndBlocks();
      } else {
        message.error('Ошибка при добавлении блюда');
      }
    } catch (error) {
      console.error('Ошибка при добавлении блюда:', error);
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при добавлении блюда');
      }
    }
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      await api.deleteMealItem(mealId);
      message.success('Блюдо удалено');
      fetchPlanAndBlocks();
    } catch (error) {
      console.error('Ошибка при удалении блюда:', error);
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при удалении блюда');
      }
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await api.deleteMealBlock(blockId);
      message.success('Блок удален');
      fetchPlanAndBlocks();
    } catch (error) {
      console.error('Ошибка при удалении блока:', error);
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при удалении блока');
      }
    }
  };

  const handleEditBlockDishesChange = (selected) => {
    setEditBlockDishes(selected);
    setEditBlockMeals(prev => {
      const newMeals = [...prev];
      selected.forEach(dishId => {
        if (!newMeals.find(m => m.dish_id === dishId)) {
          newMeals.push({ dish_id: dishId, amount: 0, note: '' });
        }
      });
      return newMeals.filter(m => selected.includes(m.dish_id));
    });
  };

  const handleEditBlock = async (values) => {
    setEditBlockLoading(true);
    try {
      // Формируем массив блюд для передачи (если потребуется)
      let dishesArr = [];
      if (values.type !== 'water' && Array.isArray(values.dishes)) {
        dishesArr = values.dishes.map(dishId => ({
          dish_id: dishId,
          amount: values[`amount_${dishId}`],
          note: values[`note_${dishId}`]
        }));
      }
      // Обновляем сам блок
      const response = await api.updateMealBlock(editingBlock.id, {
        plan_id: editingBlock.plan_id,
        type: values.type,
        time_start: values.startTime.format('HH:mm'),
        time_end: values.endTime.format('HH:mm'),
        note: values.note
      });

      if (values.type === 'water') {
        // Обновляем meal_item для воды
        const waterMeal = editBlockMeals[0];
        if (waterMeal && waterMeal.id) {
          await api.updateMealItem(waterMeal.id, {
            amount: values[`amount_${waterMeal.dish_id || 'water'}`],
            note: values[`note_${waterMeal.dish_id || 'water'}`]
          });
        }
      } else {
        // --- Работаем с блюдами ---
        // 1. id блюд до редактирования
        const oldMealIds = editBlockMeals.map(m => m.dish_id);
        // 2. id блюд после редактирования
        const newMealIds = values.dishes || [];
        // 3. Удаляем блюда, которых нет в новом списке
        for (const meal of editBlockMeals) {
          if (!newMealIds.includes(meal.dish_id)) {
            await api.deleteMealItem(meal.id);
          }
        }
        // 4. Добавляем новые блюда
        for (const dishId of newMealIds) {
          const existed = editBlockMeals.find(m => m.dish_id === dishId);
          if (!existed) {
            await api.createMealItem({
              block_id: editingBlock.id,
              dish_id: dishId,
              amount: values[`amount_${dishId}`],
              note: values[`note_${dishId}`]
            });
          }
        }
        // 5. Обновляем существующие блюда
        for (const meal of editBlockMeals) {
          if (newMealIds.includes(meal.dish_id)) {
            const amount = values[`amount_${meal.dish_id}`];
            const note = values[`note_${meal.dish_id}`];
            await api.updateMealItem(meal.id, { amount, note });
          }
        }
      }

      if (response.data) {
        setBlocks(blocks.map(block =>
          block.id === editingBlock.id ? { ...response.data, meals: block.meals } : block
        ));
        setEditBlockModalVisible(false);
        editBlockForm.resetFields();
        message.success('Блок обновлен');
        fetchPlanAndBlocks();
      } else {
        message.error('Ошибка при обновлении блока');
      }
    } catch (error) {
      console.error('Ошибка при обновлении блока:', error);
      if (error.response) {
        if (error.response.status === 409) {
          const details = error.response.data.details || {};
          const { existing_block } = details;
          if (existing_block && existing_block.type && existing_block.time_start && existing_block.time_end) {
            const blockType = blockTypes.find(type => type.value === existing_block.type);
            message.error(
              `Временной интервал пересекается с существующим блоком: ${blockType?.label} (${existing_block.time_start} - ${existing_block.time_end})`
            );
          } else {
            message.error('Временной интервал пересекается с другим блоком.');
          }
        } else {
          message.error(`Ошибка сервера: ${error.response.status}`);
        }
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при обновлении блока');
      }
    } finally {
      setEditBlockLoading(false);
    }
  };

  const getTimeEmoji = (time) => {
    if (!time) return '';
    const hour = time.split(':')[0];
    return timeEmojis[`${hour}:00`] || '';
  };

  const openAddMealModal = (blockId, blockType) => {
    setAddMealBlockId(blockId);
    setAddMealBlockType(blockType);
    addMealForm.resetFields();
    setAddMealModalVisible(true);
  };

  const handleAddMealToBlock = async (values) => {
    try {
      if (addMealBlockType === 'water') {
        await api.createMealItem({
          block_id: addMealBlockId,
          amount: values.amount,
          note: values.note
        });
      } else {
        await api.createMealItem({
          block_id: addMealBlockId,
          dish_id: values.dish_id.value,
          amount: values.amount,
          note: values.note
        });
      }
      message.success('Блюдо добавлено');
      setAddMealModalVisible(false);
      setAddMealBlockId(null);
      setAddMealBlockType(null);
      fetchPlanAndBlocks();
    } catch (error) {
      console.error('Ошибка при добавлении блюда:', error);
      if (error.code === 'ETIMEDOUT') {
        message.error('Ошибка соединения с сервером. Пожалуйста, попробуйте позже.');
      } else if (error.response) {
        message.error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при добавлении блюда');
      }
    }
  };

  const handleEditMeal = async (values) => {
    try {
      await api.updateMealItem(editingMeal.id, {
        amount: values.amount,
        note: values.note
      });
      message.success('Блюдо обновлено');
      setEditMealModalVisible(false);
      setEditingMeal(null);
      fetchPlanAndBlocks();
    } catch (error) {
      message.error('Ошибка при обновлении блюда');
    }
  };

  const openEditMealModal = (meal) => {
    setEditingMeal(meal);
    editMealForm.setFieldsValue({
      amount: meal.amount,
      note: meal.note
    });
    setEditMealModalVisible(true);
  };

  const handleCopyPlan = async (values) => {
    try {
      setLoading(true);
      const response = await api.copyMealPlan(id, values.source_plan_id, planId);
      if (response.data) {
        message.success('План успешно скопирован');
        setCopyModalVisible(false);
        copyForm.resetFields();
        // Обновляем текущий план
        fetchPlanAndBlocks();
      }
    } catch (error) {
      message.error('Ошибка при копировании плана');
    } finally {
      setLoading(false);
    }
  };

  const formatPlanInfo = (plan) => {
    const nutrition = plan.nutrition;
    if (!nutrition || !nutrition.meal_types) {
      return `План на ${dayjs(plan.date).format('DD.MM.YYYY')}`;
    }

    // Group meals by type
    const mealsByType = {};
    const mealTypesStr = nutrition.meal_types;
    
    // First, split by meal type boundaries
    const mealTypeRegex = /(Завтрак|Обед|Перекус|Ужин|Вода):/g;
    let lastIndex = 0;
    let match;
    let currentType = null;
    
    // Find all meal type markers and their content
    while ((match = mealTypeRegex.exec(mealTypesStr)) !== null) {
      // If we had a previous type, save its content
      if (currentType) {
        const content = mealTypesStr.slice(lastIndex, match.index).trim();
        if (!mealsByType[currentType]) {
          mealsByType[currentType] = [];
        }
        // Split content by '|' to get individual dishes
        const dishes = content.split('|').map(dish => dish.trim()).filter(Boolean);
        mealsByType[currentType].push(...dishes);
      }
      
      currentType = match[1];
      lastIndex = match.index + match[0].length;
    }
    
    // Don't forget the last section
    if (currentType && lastIndex < mealTypesStr.length) {
      const content = mealTypesStr.slice(lastIndex).trim();
      if (!mealsByType[currentType]) {
        mealsByType[currentType] = [];
      }
      const dishes = content.split('|').map(dish => dish.trim()).filter(Boolean);
      mealsByType[currentType].push(...dishes);
    }

    // Sort meal types according to our order
    const sortedTypes = Object.keys(mealsByType).sort((a, b) => {
      return (mealTypeOrder[`${mealTypeEmojis[a]} ${a}`] || 999) - (mealTypeOrder[`${mealTypeEmojis[b]} ${b}`] || 999);
    });

    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 500,
          color: '#262626',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{dayjs(plan.date).format('DD.MM.YYYY')}</span>
          <div style={{ display: 'flex', gap: '4px', fontSize: '12px' }}>
            <span>К: {Math.round(nutrition.total_calories)}</span>
            <span style={{ color: '#8c8c8c' }}>•</span>
            <span>Б: {Math.round(nutrition.total_proteins)}</span>
            <span style={{ color: '#8c8c8c' }}>•</span>
            <span>Ж: {Math.round(nutrition.total_fats)}</span>
            <span style={{ color: '#8c8c8c' }}>•</span>
            <span>У: {Math.round(nutrition.total_carbs)}</span>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#595959' }}>
          {sortedTypes.map((type, typeIndex) => {
            const dishes = mealsByType[type];
            if (!dishes || dishes.length === 0) return null;

            return (
              <div key={type} style={{ 
                display: 'flex',
                gap: '8px',
                alignItems: 'baseline',
                marginBottom: typeIndex < sortedTypes.length - 1 ? '8px' : 0,
                background: type === 'Вода' ? '#f0f7ff' : 'transparent',
                padding: type === 'Вода' ? '4px 8px' : '0',
                borderRadius: type === 'Вода' ? '4px' : '0'
              }}>
                <Tooltip title={type}>
                  <span style={{ fontSize: '14px', minWidth: '20px' }}>{mealTypeEmojis[type]}</span>
                </Tooltip>
                <div style={{ flex: 1 }}>
                  {dishes.map((dish, index) => {
                    if (!dish) return null;
                    const match = dish.match(/(.*?)\s*\[(.*?)\]/);
                    if (match) {
                      const [_, dishName, nutritionInfo] = match;
                      const [calories, proteins, fats, carbs] = nutritionInfo.split(',').map(info => info?.trim() || '');
                      return (
                        <div key={index} style={{ 
                          marginBottom: index < dishes.length - 1 ? '4px' : 0
                        }}>
                          <div style={{ fontWeight: 500 }}>{dishName}</div>
                          <div style={{ 
                            display: 'flex', 
                            gap: '4px', 
                            marginTop: '2px',
                            fontSize: '11px',
                            color: '#8c8c8c'
                          }}>
                            <span>К: {calories}</span>
                            <span>•</span>
                            <span>Б: {proteins}</span>
                            <span>•</span>
                            <span>Ж: {fats}</span>
                            <span>•</span>
                            <span>У: {carbs}</span>
                          </div>
                        </div>
                      );
                    }
                    return <div key={index} style={{ marginBottom: index < dishes.length - 1 ? '4px' : 0 }}>{dish}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Итоговое КБЖУ за день
  const getTotalDayNutrition = () => {
    let total = { k: 0, b: 0, j: 0, u: 0 };
    blocks.forEach(block => {
      if (!block.meals) return;
      block.meals.forEach(meal => {
        if (!meal || !meal.amount) return;
        total.k += meal.calories_per_100 ? meal.calories_per_100 * meal.amount / 100 : 0;
        total.b += meal.proteins_per_100 ? meal.proteins_per_100 * meal.amount / 100 : 0;
        total.j += meal.fats_per_100 ? meal.fats_per_100 * meal.amount / 100 : 0;
        total.u += meal.carbs_per_100 ? meal.carbs_per_100 * meal.amount / 100 : 0;
      });
    });
    return {
      k: Math.round(total.k),
      b: Math.round(total.b),
      j: Math.round(total.j),
      u: Math.round(total.u)
    };
  };

  // КБЖУ для блока
  const getBlockNutrition = (block) => {
    let total = { k: 0, b: 0, j: 0, u: 0 };
    if (!block.meals) return total;
    block.meals.forEach(meal => {
      if (!meal || !meal.amount) return;
      total.k += meal.calories_per_100 ? meal.calories_per_100 * meal.amount / 100 : 0;
      total.b += meal.proteins_per_100 ? meal.proteins_per_100 * meal.amount / 100 : 0;
      total.j += meal.fats_per_100 ? meal.fats_per_100 * meal.amount / 100 : 0;
      total.u += meal.carbs_per_100 ? meal.carbs_per_100 * meal.amount / 100 : 0;
    });
    return {
      k: Math.round(total.k),
      b: Math.round(total.b),
      j: Math.round(total.j),
      u: Math.round(total.u)
    };
  };

  const openEditBlockModal = (block) => {
    setEditingBlock(block);
    const dishIds = block.meals?.map(meal => meal.dish_id) || [];
    setEditBlockDishes(dishIds);
    setEditBlockMeals(block.meals || []);
    const formValues = {
      type: block.type,
      startTime: dayjs(block.time_start, 'HH:mm'),
      endTime: dayjs(block.time_end, 'HH:mm'),
      note: block.note,
      dishes: dishIds,
    };
    (block.meals || []).forEach(meal => {
      formValues[`amount_${meal.dish_id}`] = meal.amount;
      formValues[`note_${meal.dish_id}`] = meal.note;
    });
    editBlockForm.setFieldsValue(formValues);
    setEditBlockModalVisible(true);
  };

  const handleToggleComplete = (blockId) => {
    setCompletedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  const getStatusIcon = (blockId, block) => {
    const isCompleted = completedBlocks[blockId];
    
    if (isCompleted === true) {
      return (
        <Tooltip title={`Выполнено ${dayjs().format('DD.MM.YYYY')} в ${block.time_start}`}>
          <CheckCircleFilled style={{ 
            color: '#52c41a',
            fontSize: '16px'
          }} />
        </Tooltip>
      );
    } else if (isCompleted === false) {
      return (
        <Tooltip title={`Пропущено ${dayjs().format('DD.MM.YYYY')} в ${block.time_start}`}>
          <CloseCircleFilled style={{ 
            color: '#ff4d4f',
            fontSize: '16px'
          }} />
        </Tooltip>
      );
    }
    return (
      <Tooltip title={`Запланировано на ${block.time_start}`}>
        <ClockCircleFilled style={{ 
          color: '#8c8c8c',
          fontSize: '16px'
        }} />
      </Tooltip>
    );
  };

  const renderBlock = (block) => {
    const blockType = blockTypes.find(type => type.value === block.type);
    const timeEmoji = getTimeEmoji(block.time_start);
    const blockNutrition = getBlockNutrition(block);
    
    return (
      <List.Item
        key={block.id}
        style={{
          background: '#fff',
          borderRadius: '8px',
          marginBottom: '8px',
          padding: '16px',
          border: '1px solid #f0f0f0'
        }}
      >
        <div style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tooltip title={blockType?.label}>
                  <span style={{ fontSize: '20px' }}>{blockType?.emoji}</span>
                </Tooltip>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#262626',
                  fontWeight: 500
                }}>
                  {block.time_start.split(':').slice(0, 2).join(':')} - {block.time_end.split(':').slice(0, 2).join(':')}
                </span>
              </div>
              <div style={{ 
                display: 'flex',
                gap: '8px',
                fontSize: '13px',
                color: '#595959'
              }}>
                <span>К: {blockNutrition.k}</span>
                <span style={{ color: '#d9d9d9' }}>•</span>
                <span>Б: {blockNutrition.b}</span>
                <span style={{ color: '#d9d9d9' }}>•</span>
                <span>Ж: {blockNutrition.j}</span>
                <span style={{ color: '#d9d9d9' }}>•</span>
                <span>У: {blockNutrition.u}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {getStatusIcon(block.id, block)}
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEditBlockModal(block)}
                size="small"
              />
              <Popconfirm
                title="Удалить блок?"
                description="Это действие нельзя отменить"
                onConfirm={() => handleDeleteBlock(block.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            </div>
          </div>

          {/* Note if exists */}
          {block.note && (
            <div style={{ 
              fontSize: '13px', 
              color: '#8c8c8c',
              marginBottom: '8px',
              padding: '4px 8px',
              background: '#fafafa',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              {block.note}
            </div>
          )}

          {/* Meals */}
          <div style={{ marginTop: block.note ? '12px' : 0 }}>
            {(block.meals || []).map((meal, index) => {
              if (block.type === 'water') {
                return (
                  <div key={meal.id} style={{ 
                    fontSize: '14px',
                    color: '#262626'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Количество: {meal.amount} мл</span>
                      {meal.note && (
                        <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
                          {meal.note}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              // Для обычных блюд
              const k = meal.calories_per_100 ? Math.round(meal.calories_per_100 * meal.amount / 100) : 0;
              const b = meal.proteins_per_100 ? Math.round(meal.proteins_per_100 * meal.amount / 100) : 0;
              const j = meal.fats_per_100 ? Math.round(meal.fats_per_100 * meal.amount / 100) : 0;
              const u = meal.carbs_per_100 ? Math.round(meal.carbs_per_100 * meal.amount / 100) : 0;

              return (
                <div key={meal.id} style={{ 
                  padding: '8px 0',
                  borderTop: index > 0 ? '1px solid #f5f5f5' : 'none'
                }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px',
                        color: '#262626',
                        fontWeight: 500,
                        marginBottom: '4px'
                      }}>
                        {meal.dish_name}
                      </div>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '13px',
                        color: '#8c8c8c'
                      }}>
                        <span>{meal.amount} {meal.unit || 'г'}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span>К: {k}</span>
                          <span style={{ color: '#d9d9d9' }}>•</span>
                          <span>Б: {b}</span>
                          <span style={{ color: '#d9d9d9' }}>•</span>
                          <span>Ж: {j}</span>
                          <span style={{ color: '#d9d9d9' }}>•</span>
                          <span>У: {u}</span>
                        </div>
                      </div>
                      {meal.note && (
                        <div style={{ 
                          fontSize: '13px',
                          color: '#8c8c8c',
                          marginTop: '4px'
                        }}>
                          {meal.note}
                        </div>
                      )}
                    </div>
                    {meal.link && (
                      <a 
                        href={meal.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          fontSize: '13px',
                          color: '#1890ff',
                          textDecoration: 'none'
                        }}
                      >
                        Рецепт
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </List.Item>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/users/${id}/meal-plans`)}
        style={{ marginBottom: 16 }}
      >
        Назад
      </Button>
      <Card
        title={
          <Space direction="vertical" size={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Title level={4} style={{ margin: 0 }}>
                План питания на {plan ? dayjs(plan.date).format('DD.MM.YYYY') : '...'}
              </Title>
              {lastWeight && (
                <Tooltip title={`Вес на ${dayjs(lastWeight.recorded_at).format('DD.MM.YYYY')}`}>
                  <Tag 
                    icon={<DashboardOutlined />} 
                    color="blue"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '4px 8px',
                      cursor: 'help',
                      marginLeft: 0,
                      marginTop: '2px'
                    }}
                  >
                    {lastWeight.weight} кг
                  </Tag>
                </Tooltip>
              )}
            </div>
            {/* Итоговое КБЖУ за день */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              padding: '12px 16px',
              background: '#fafafa',
              borderRadius: '8px',
              fontSize: '14px',
              marginTop: '12px'
            }}>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>Калории</div>
                <div style={{ fontSize: '16px' }}>К: {getTotalDayNutrition().k}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>Белки</div>
                <div style={{ fontSize: '16px' }}>Б: {getTotalDayNutrition().b}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>Жиры</div>
                <div style={{ fontSize: '16px' }}>Ж: {getTotalDayNutrition().j}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>Углеводы</div>
                <div style={{ fontSize: '16px' }}>У: {getTotalDayNutrition().u}</div>
              </div>
            </div>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Добавить блок">
              <Button
                type="primary"
                ghost
                icon={<PlusOutlined />}
                onClick={() => setBlockModalVisible(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  background: '#e6f7ff',
                  borderColor: '#91d5ff',
                  color: '#1890ff'
                }}
              />
            </Tooltip>
            <Tooltip title="Копировать план">
              <Button
                type="primary"
                ghost
                icon={<CopyOutlined />}
                onClick={() => setCopyModalVisible(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  background: '#f6ffed',
                  borderColor: '#b7eb8f',
                  color: '#52c41a'
                }}
              />
            </Tooltip>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <List
            loading={loading}
            dataSource={blocks}
            renderItem={renderBlock}
          />
        </Space>
      </Card>

      <Modal
        title="Добавить блок питания"
        open={blockModalVisible}
        onOk={() => blockForm.submit()}
        onCancel={() => {
          setBlockModalVisible(false);
          blockForm.resetFields();
          setBlockTypeInModal(null);
          setSelectedDishes([]);
        }}
        okText="Добавить"
        cancelText="Отмена"
        confirmLoading={addBlockLoading}
      >
        <Form form={blockForm} onFinish={handleAddBlock} layout="vertical">
          <Form.Item
            name="type"
            label="Тип блока"
            rules={[{ required: true, message: 'Выберите тип блока' }]}
          >
            <Select
              onChange={value => setBlockTypeInModal(value)}
            >
              {blockTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {blockTypeInModal === 'water' ? (
            <>
              <Form.Item
                name="water_amount"
                label="Количество воды (мл)"
                rules={[{ required: true, message: 'Введите количество воды' }]}
              >
                <InputNumber min={0} step={10} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="water_note"
                label="Примечание к воде"
              >
                <Input.TextArea placeholder="Например: Важно выпить всю воду" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="dishes"
                label="Блюда"
                rules={[{ required: true, message: 'Выберите хотя бы одно блюдо' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Выберите блюда из списка"
                  style={{ width: '100%' }}
                  onChange={(value, option) => {
                    setSelectedDishes(value);
                    // Закрываем селект после каждого выбора
                    const selectDom = document.querySelector('.ant-select-selector');
                    if (selectDom) {
                      selectDom.click();
                    }
                  }}
                >
                  {dishes.map(dish => (
                    <Option key={dish.id} value={dish.id}>
                      {dish.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {selectedDishes.map(dishId => {
                const dish = dishes.find(d => d.id === dishId);
                return (
                  <div key={dishId} style={{ background: '#fafafa', padding: 8, marginBottom: 8, borderRadius: 4 }}>
                    <b>{dish?.name}</b>
                    <Form.Item
                      name={`amount_${dishId}`}
                      label={`Количество${dish?.unit ? ` (${dish.unit})` : ' (г)'}`}
                      rules={[{ required: true, message: 'Введите количество' }]}
                      style={{ marginBottom: 4 }}
                    >
                      <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                    {/* КБЖУ для блюда */}
                    <Form.Item shouldUpdate={(prev, curr) => prev[`amount_${dishId}`] !== curr[`amount_${dishId}`]} noStyle>
                      {({ getFieldValue }) => {
                        const amount = getFieldValue(`amount_${dishId}`);
                        if (!dish || !amount) return null;
                        // Расчет КБЖУ
                        const k = dish.calories_per_100 ? Math.round(dish.calories_per_100 * amount / 100) : 0;
                        const b = dish.proteins_per_100 ? Math.round(dish.proteins_per_100 * amount / 100) : 0;
                        const j = dish.fats_per_100 ? Math.round(dish.fats_per_100 * amount / 100) : 0;
                        const u = dish.carbs_per_100 ? Math.round(dish.carbs_per_100 * amount / 100) : 0;
                        return (
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                            <span style={{ marginRight: 8 }}>К: {k}</span>
                            <span style={{ marginRight: 8 }}>Б: {b}</span>
                            <span style={{ marginRight: 8 }}>Ж: {j}</span>
                            <span>У: {u}</span>
                          </div>
                        );
                      }}
                    </Form.Item>
                    <Form.Item
                      name={`note_${dishId}`}
                      label="Примечание"
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea placeholder="Комментарий к блюду" />
                    </Form.Item>
                  </div>
                );
              })}
            </>
          )}
          <Form.Item label="Время" required>
            <Space>
              <Form.Item
                name="startTime"
                noStyle
                rules={[{ required: true, message: 'Укажите время начала' }]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="Начало"
                  minuteStep={30}
                  hideDisabledOptions
                  disabledHours={() => [0,1,2,3,4,23]}
                  disabledMinutes={() => [10,20,40,50]}
                  allowClear={false}
                />
              </Form.Item>
              <Form.Item
                name="endTime"
                noStyle
                rules={[{ required: true, message: 'Укажите время окончания' }]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="Окончание"
                  minuteStep={30}
                  hideDisabledOptions
                  disabledHours={() => [0,1,2,3,4,23]}
                  disabledMinutes={() => [10,20,40,50]}
                  allowClear={false}
                />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Добавить блюдо"
        open={mealModalVisible}
        onCancel={() => setMealModalVisible(false)}
        footer={null}
      >
        <Form form={mealForm} onFinish={handleAddMeal} layout="vertical">
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название блюда' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="weight"
            label="Вес"
          >
            <Input placeholder="Например: 250г" />
          </Form.Item>
          <Form.Item name="calories_per_100" label="Калории на 100г">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="proteins_per_100" label="Белки на 100г">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="carbs_per_100" label="Углеводы на 100г">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fats_per_100" label="Жиры на 100г">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Примечание">
            <Input.TextArea placeholder="Например: можно добавить куркуму и мёд" />
          </Form.Item>
          <Form.Item name="recipe_url" label="Ссылка на рецепт">
            <Input placeholder="Например: https://www.instagram.com/p/..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Добавить
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать блок питания"
        open={editBlockModalVisible}
        onOk={() => editBlockForm.submit()}
        onCancel={() => {
          setEditBlockModalVisible(false);
          editBlockForm.resetFields();
        }}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={editBlockLoading}
      >
        <Form form={editBlockForm} onFinish={handleEditBlock} layout="vertical">
          <Form.Item
            name="type"
            label="Тип блока"
            rules={[{ required: true, message: 'Выберите тип блока' }]}
          >
            <Select
              onChange={value => setBlockTypeInModal(value)}
              disabled={editingBlock?.type === 'water'}
            >
              {(editingBlock?.type === 'water'
                ? blockTypes.filter(type => type.value === 'water')
                : blockTypes.filter(type => type.value !== 'water')).map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {(editingBlock?.type === 'water' || editBlockForm.getFieldValue('type') === 'water') ? (
            <>
              <Form.Item
                name={`amount_${editBlockMeals[0]?.dish_id || 'water'}`}
                label="Количество (мл)"
                rules={[{ required: true, message: 'Введите количество воды' }]}
                style={{ marginBottom: 4 }}
                initialValue={editBlockMeals[0]?.amount}
              >
                <InputNumber min={0} step={10} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name={`note_${editBlockMeals[0]?.dish_id || 'water'}`}
                label="Примечание"
                style={{ marginBottom: 0 }}
                initialValue={editBlockMeals[0]?.note}
              >
                <Input.TextArea placeholder="Комментарий к воде" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="dishes"
                label="Блюда"
                rules={[{ required: true, message: 'Выберите хотя бы одно блюдо' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Выберите блюда из списка"
                  style={{ width: '100%' }}
                  onChange={(value, option) => {
                    setEditBlockDishes(value);
                    // Закрываем селект после каждого выбора
                    const selectDom = document.querySelector('.ant-select-selector');
                    if (selectDom) {
                      selectDom.click();
                    }
                  }}
                >
                  {dishes.map(dish => (
                    <Option key={dish.id} value={dish.id}>
                      {dish.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {editBlockDishes.map(dishId => {
                const dish = dishes.find(d => d.id === dishId);
                const meal = editBlockMeals.find(m => m.dish_id === dishId) || {};
                return (
                  <div key={dishId} style={{ background: '#fafafa', padding: 8, marginBottom: 8, borderRadius: 4 }}>
                    <b>{dish?.name}</b>
                    <Form.Item
                      name={`amount_${dishId}`}
                      label={`Количество${dish?.unit ? ` (${dish.unit})` : ' (г)'}`}
                      rules={[{ required: true, message: 'Введите количество' }]}
                      style={{ marginBottom: 4 }}
                      initialValue={meal.amount}
                    >
                      <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                    {/* КБЖУ для блюда */}
                    <Form.Item shouldUpdate={(prev, curr) => prev[`amount_${dishId}`] !== curr[`amount_${dishId}`]} noStyle>
                      {({ getFieldValue }) => {
                        const amount = getFieldValue(`amount_${dishId}`);
                        if (!dish || !amount) return null;
                        // Расчет КБЖУ
                        const k = dish.calories_per_100 ? Math.round(dish.calories_per_100 * amount / 100) : 0;
                        const b = dish.proteins_per_100 ? Math.round(dish.proteins_per_100 * amount / 100) : 0;
                        const j = dish.fats_per_100 ? Math.round(dish.fats_per_100 * amount / 100) : 0;
                        const u = dish.carbs_per_100 ? Math.round(dish.carbs_per_100 * amount / 100) : 0;
                        return (
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                            <span style={{ marginRight: 8 }}>К: {k}</span>
                            <span style={{ marginRight: 8 }}>Б: {b}</span>
                            <span style={{ marginRight: 8 }}>Ж: {j}</span>
                            <span>У: {u}</span>
                          </div>
                        );
                      }}
                    </Form.Item>
                    <Form.Item
                      name={`note_${dishId}`}
                      label="Примечание"
                      style={{ marginBottom: 0 }}
                      initialValue={meal.note}
                    >
                      <Input.TextArea placeholder="Комментарий к блюду" />
                    </Form.Item>
                  </div>
                );
              })}
            </>
          )}
          <Form.Item label="Время" required>
            <Space>
              <Form.Item
                name="startTime"
                noStyle
                rules={[{ required: true, message: 'Укажите время начала' }]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="Начало"
                  minuteStep={30}
                  hideDisabledOptions
                  disabledHours={() => [0,1,2,3,4,23]}
                  disabledMinutes={() => [10,20,40,50]}
                  allowClear={false}
                />
              </Form.Item>
              <Form.Item
                name="endTime"
                noStyle
                rules={[{ required: true, message: 'Укажите время окончания' }]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="Окончание"
                  minuteStep={30}
                  hideDisabledOptions
                  disabledHours={() => [0,1,2,3,4,23]}
                  disabledMinutes={() => [10,20,40,50]}
                  allowClear={false}
                />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={addMealBlockType === 'water' ? 'Добавить воду' : 'Добавить блюдо в блок'}
        open={addMealModalVisible}
        onOk={() => addMealForm.submit()}
        onCancel={() => {
          setAddMealModalVisible(false);
          setAddMealBlockId(null);
          setAddMealBlockType(null);
        }}
        okText="Добавить"
        cancelText="Отмена"
      >
        <Form form={addMealForm} onFinish={handleAddMealToBlock} layout="vertical">
          {addMealBlockType !== 'water' && (
            <Form.Item
              name="dish_id"
              label="Блюдо"
              rules={[{ required: true, message: 'Выберите блюдо' }]}
            >
              <ReactSelect
                options={dishes.map(dish => ({ value: dish.id, label: dish.name }))}
                placeholder="Выберите блюдо"
                closeMenuOnSelect={true}
              />
            </Form.Item>
          )}
          <Form.Item
            name="amount"
            label={addMealBlockType === 'water' ? 'Количество воды (мл)' : 'Количество'}
            rules={[{ required: true, message: 'Введите количество' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Примечание">
            <Input.TextArea placeholder="Комментарий" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать блюдо в блоке"
        open={editMealModalVisible}
        onOk={() => editMealForm.submit()}
        onCancel={() => {
          setEditMealModalVisible(false);
          setEditingMeal(null);
        }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={editMealForm} onFinish={handleEditMeal} layout="vertical">
          <Form.Item
            name="amount"
            label="Количество"
            rules={[{ required: true, message: 'Введите количество' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Примечание">
            <Input.TextArea placeholder="Комментарий к блюду" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Копировать план питания"
        open={copyModalVisible}
        onOk={() => copyForm.submit()}
        onCancel={() => {
          setCopyModalVisible(false);
          copyForm.resetFields();
        }}
        okText="Копировать"
        cancelText="Отмена"
        width={500}
      >
        <Form form={copyForm} onFinish={handleCopyPlan} layout="vertical">
          <Form.Item
            name="source_plan_id"
            label="Выберите план для копирования"
            rules={[{ required: true, message: 'Выберите план для копирования' }]}
          >
            <Select
              placeholder="Выберите план"
              optionLabelProp="label"
              style={{ width: '100%' }}
              dropdownStyle={{ 
                maxHeight: '400px',
                padding: '8px'
              }}
            >
              {plansWithNutrition.map(plan => (
                <Option 
                  key={plan.id} 
                  value={plan.id}
                  label={dayjs(plan.date).format('DD.MM.YYYY')}
                >
                  {formatPlanInfo(plan)}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MealPlanEditor; 