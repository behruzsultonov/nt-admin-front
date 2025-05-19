import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, List, Typography, Space, message, Tag } from 'antd';
import api from '../api/client';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const { Title, Text } = Typography;

const blockTypes = {
  water: { label: 'Вода', emoji: '💧' },
  breakfast: { label: 'Завтрак', emoji: '🍳' },
  lunch: { label: 'Обед', emoji: '🥘' },
  snack: { label: 'Перекус', emoji: '🍎' },
  dinner: { label: 'Ужин', emoji: '🍽️' }
};

const timeEmojis = {
  '06:00': '🕕',
  '08:00': '🕗',
  '11:00': '🕚',
  '12:00': '🕛',
  '14:30': '🕝',
  '17:00': '🕔',
  '19:00': '🕖'
};

const MealPlanView = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPlanAndBlocks = async () => {
    try {
      setLoading(true);
      const [planResponse, blocksResponse] = await Promise.all([
        api.getMealPlan(id),
        api.getMealBlocks(id)
      ]);
      setPlan(planResponse.data);
      
      // Получаем блюда для каждого блока
      const blocksWithMeals = await Promise.all(
        blocksResponse.data.map(async (block) => {
          const mealsResponse = await api.getMealItems(block.id);
          return { ...block, meals: mealsResponse.data };
        })
      );
      
      setBlocks(blocksWithMeals);
    } catch (error) {
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.data.error || 'Неизвестная ошибка'}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при загрузке данных');
      }
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanAndBlocks();
  }, [id]);

  const formatTime = (time) => {
    return dayjs(time, 'HH:mm').format('HH:mm');
  };

  const renderBlock = (block) => {
    const blockType = blockTypes[block.type];
    const timeEmoji = timeEmojis[block.time_start] || '';

    return (
      <List.Item>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>
            👉🏻{blockType?.emoji} {blockType?.label} {formatTime(block.time_start)} до {formatTime(block.time_end)} {timeEmoji}👈🏻
          </Title>
          
          {block.meals?.map((meal, index) => (
            <div key={meal.id} style={{ marginLeft: 20 }}>
              <Text>
                - {meal.dish_name} {meal.note ? `- ${meal.note}` : ''}
                {meal.video_url && (
                  <a href={meal.video_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                    Рецепт
                  </a>
                )}
              </Text>
            </div>
          ))}
        </Space>
      </List.Item>
    );
  };

  if (!plan) return null;

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Title level={3}>
            {dayjs(plan.date).format('D MMMM')}
          </Title>

          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Пользователь: </Text>
              <Text>{plan.user_name}</Text>
            </div>
          </Space>

          <List
            loading={loading}
            dataSource={blocks}
            renderItem={renderBlock}
          />
        </Space>
      </Card>
    </div>
  );
};

export default MealPlanView; 