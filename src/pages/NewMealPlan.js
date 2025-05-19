import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Space,
  message,
  Typography
} from 'antd';
import api from '../api/client';

const { Title } = Typography;
const { Option } = Select;

const NewMealPlan = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.getUsers();
        setUsers(response.data);
      } catch (error) {
        message.error('Ошибка при загрузке данных');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const mealPlanData = {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      };
      await api.createMealPlan(mealPlanData);
      message.success('План питания создан');
      navigate('/meal-plans');
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.error || 'Неизвестная ошибка';
        message.error(`Ошибка сервера: ${errorMessage}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при создании плана питания');
      }
      console.error('Ошибка при создании плана питания:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Title level={4}>Создание плана питания</Title>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
          >
            <Form.Item
              name="user_id"
              label="Пользователь"
              rules={[{ required: true, message: 'Выберите пользователя' }]}
            >
              <Select placeholder="Выберите пользователя">
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="date"
              label="Дата"
              rules={[{ required: true, message: 'Выберите дату' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="weight"
              label="Вес (кг)"
              rules={[{ required: true, message: 'Введите вес' }]}
            >
              <Input type="number" step="0.1" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Создать
                </Button>
                <Button onClick={() => navigate('/meal-plans')}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default NewMealPlan; 