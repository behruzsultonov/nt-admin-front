import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  List,
  Button,
  DatePicker,
  Space,
  message,
  Typography,
  Popconfirm,
  Modal,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  DashboardOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
} from '@ant-design/icons';
import api from '../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const UserMealPlans = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [lastWeight, setLastWeight] = useState(null);
  const [nutritionData, setNutritionData] = useState({});

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

  const fetchLastWeight = async () => {
    try {
      // Получаем последний вес до текущей даты
      const response = await api.getLastWeight(id, dayjs().format('YYYY-MM-DD'));
      setLastWeight(response.data);
    } catch (error) {
      console.error('Ошибка при получении последнего веса:', error);
    }
  };

  const fetchUserAndPlans = async () => {
    try {
      setLoading(true);
      const [userResponse, plansResponse] = await Promise.all([
        api.getUser(id),
        api.getMealPlans(id)
      ]);
      
      if (userResponse.data) {
        setUser(userResponse.data);
      } else {
        message.error('Получены некорректные данные пользователя');
      }

      if (plansResponse.data) {
        setPlans(plansResponse.data);
      } else {
        message.error('Получены некорректные данные планов');
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при загрузке данных');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNutritionData = async (planId) => {
    try {
      const response = await api.getMealPlanNutrition(planId);
      setNutritionData(prev => ({
        ...prev,
        [planId]: response.data
      }));
    } catch (error) {
      console.error('Ошибка при получении КБЖУ:', error);
    }
  };

  useEffect(() => {
    fetchUserAndPlans();
    fetchLastWeight();
  }, [id]);

  useEffect(() => {
    // Получаем КБЖУ для каждого плана
    plans.forEach(plan => {
      fetchNutritionData(plan.id);
    });
  }, [plans]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCreateModalVisible(true);
  };

  const handleCreatePlan = async () => {
    if (!selectedDate) return;

    try {
      // Проверяем, существует ли уже план на эту дату
      const existingPlan = plans.find(plan => 
        dayjs(plan.date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
      );

      if (existingPlan) {
        message.error('План на эту дату уже существует');
        setCreateModalVisible(false);
        return;
      }

      const response = await api.createMealPlan({
        user_id: parseInt(id),
        date: selectedDate.format('YYYY-MM-DD'),
      });

      if (response.data) {
        message.success('План создан');
        navigate(`/users/${id}/meal-plans/${response.data.id}/edit`);
      } else {
        message.error('Ошибка при создании плана');
      }
    } catch (error) {
      console.error('Ошибка при создании плана:', error);
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при создании плана');
      }
    } finally {
      setCreateModalVisible(false);
      setSelectedDate(null);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await api.deleteMealPlan(planId);
      setPlans(plans.filter(plan => plan.id !== planId));
      message.success('План удален');
    } catch (error) {
      console.error('Ошибка при удалении плана:', error);
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при удалении плана');
      }
    }
  };

  const renderNutritionInfo = (planId) => {
    const nutrition = nutritionData[planId];
    if (!nutrition || !nutrition.meal_types) return null;

    // Тестовые данные для статуса выполнения
    const completionStatus = {
      'Завтрак': { completed: true, time: '08:30' },
      'Обед': { completed: false, time: '13:00' },
      'Перекус': { completed: null, time: '16:00' }, // null означает "ожидает"
      'Ужин': { completed: null, time: '19:00' },
    };

    const getStatusIcon = (type) => {
      const status = completionStatus[type];
      if (!status) return null;

      if (status.completed === true) {
        return (
          <Tooltip title={`Выполнено ${dayjs().format('DD.MM.YYYY')} в ${status.time}`}>
            <CheckCircleFilled style={{ 
              color: '#52c41a',
              fontSize: '16px'
            }} />
          </Tooltip>
        );
      } else if (status.completed === false) {
        return (
          <Tooltip title={`Пропущено ${dayjs().format('DD.MM.YYYY')} в ${status.time}`}>
            <CloseCircleFilled style={{ 
              color: '#ff4d4f',
              fontSize: '16px'
            }} />
          </Tooltip>
        );
      }
      return (
        <Tooltip title={`Запланировано на ${status.time}`}>
          <ClockCircleFilled style={{ 
            color: '#8c8c8c',
            fontSize: '16px'
          }} />
        </Tooltip>
      );
    };

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
      <div style={{ width: '100%', marginTop: 8 }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: 12
        }}>
          {sortedTypes.map((type, typeIndex) => {
            const dishes = mealsByType[type];
            if (!dishes || dishes.length === 0) return null;
            if (type === 'Вода') return null; // Воду покажем отдельно

            return (
              <div 
                key={type} 
                style={{ 
                  background: '#fafafa',
                  padding: '12px',
                  borderRadius: '6px',
                  minWidth: '200px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: 8,
                  color: '#262626',
                  fontWeight: 500,
                  borderBottom: '1px solid #f0f0f0',
                  paddingBottom: 8,
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={type}>
                      <span style={{ fontSize: '16px', marginRight: 8 }}>
                        {mealTypeEmojis[type]}
                      </span>
                    </Tooltip>
                    <span style={{ fontSize: '14px' }}>{type}</span>
                  </div>
                  {getStatusIcon(type)}
                </div>
                <div style={{ 
                  fontSize: '13px',
                  color: '#595959',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {dishes.map((dish, index) => {
                    if (!dish) return null;
                    const match = dish.match(/(.*?)\s*\[(.*?)\]/);
                    if (match) {
                      const [_, dishName, nutritionInfo] = match;
                      const [calories, proteins, fats, carbs] = nutritionInfo.split(',').map(info => info?.trim() || '');
                      return (
                        <div key={index} style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ fontWeight: 500 }}>{dishName}</div>
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap'
                          }}>
                            <Tag style={{ 
                              margin: 0, 
                              fontSize: '11px', 
                              background: '#f5f5f5',
                              border: '1px solid #e8e8e8',
                              color: '#595959'
                            }}>К: {calories}</Tag>
                            <Tag style={{ 
                              margin: 0, 
                              fontSize: '11px',
                              background: '#f5f5f5',
                              border: '1px solid #e8e8e8',
                              color: '#595959'
                            }}>Б: {proteins}</Tag>
                            <Tag style={{ 
                              margin: 0, 
                              fontSize: '11px',
                              background: '#f5f5f5',
                              border: '1px solid #e8e8e8',
                              color: '#595959'
                            }}>Ж: {fats}</Tag>
                            <Tag style={{ 
                              margin: 0, 
                              fontSize: '11px',
                              background: '#f5f5f5',
                              border: '1px solid #e8e8e8',
                              color: '#595959'
                            }}>У: {carbs}</Tag>
                          </div>
                        </div>
                      );
                    }
                    return <div key={index}>{dish}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Отдельный блок для воды */}
        {mealsByType['Вода'] && (
          <div style={{ 
            background: '#f0f7ff',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>{mealTypeEmojis['Вода']}</span>
            <span style={{ fontSize: '13px', color: '#595959' }}>
              {mealsByType['Вода'].join(', ')}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/users')}
        style={{ marginBottom: 16 }}
      >
        Назад
      </Button>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>
                Планы питания: {user?.name}
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
                      marginLeft: 0
                    }}
                  >
                    {lastWeight.weight} кг
                  </Tag>
                </Tooltip>
              )}
            </Space>
            <DatePicker
              onChange={handleDateSelect}
              placeholder="Выберите дату"
              disabledDate={date => {
                const today = dayjs();
                return date.isBefore(today, 'day');
              }}
            />
          </div>

          <List
            loading={loading}
            dataSource={plans}
            renderItem={plan => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/users/${id}/meal-plans/${plan.id}/edit`)}
                  />,
                  <Popconfirm
                    title="Удалить план?"
                    description="Это действие нельзя отменить"
                    onConfirm={() => handleDeletePlan(plan.id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{dayjs(plan.date).format('DD.MM.YYYY')}</span>
                      {nutritionData[plan.id] && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Tag color="blue">К: {Math.round(nutritionData[plan.id].total_calories)}</Tag>
                          <Tag color="green">Б: {Math.round(nutritionData[plan.id].total_proteins)}</Tag>
                          <Tag color="orange">Ж: {Math.round(nutritionData[plan.id].total_fats)}</Tag>
                          <Tag color="purple">У: {Math.round(nutritionData[plan.id].total_carbs)}</Tag>
                        </div>
                      )}
                    </div>
                  }
                  description={renderNutritionInfo(plan.id)}
                />
              </List.Item>
            )}
          />
        </Space>
      </Card>

      <Modal
        title="Создать план питания"
        open={createModalVisible}
        onOk={handleCreatePlan}
        onCancel={() => {
          setCreateModalVisible(false);
          setSelectedDate(null);
        }}
        okText="Создать"
        cancelText="Отмена"
      >
        <p>Создать план питания на {selectedDate?.format('DD.MM.YYYY')}?</p>
      </Modal>
    </div>
  );
};

export default UserMealPlans; 