import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Button, Input, Space, message, Typography, Tag, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, CalendarOutlined, UserOutlined, MailOutlined, DashboardOutlined, HistoryOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../api/client';

const { Title } = Typography;

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [lastWeights, setLastWeights] = useState({});

  // Тестовые данные для стартового веса и дней подписки
  const mockStartWeights = {
    1: 80.5,
    2: 75.2,
    3: 65.8,
    4: 98.3,
    5: 70.1
  };

  const mockSubscriptionDays = {
    1: 45,
    2: 12,
    3: 89,
    4: 5,
    5: 156
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      if (response.data) {
        setUsers(response.data);
        // Получаем последний вес для каждого пользователя
        const weights = {};
        for (const user of response.data) {
          try {
            const weightResp = await api.getLastWeight(user.id, new Date().toISOString());
            weights[user.id] = weightResp.data?.weight;
          } catch {
            weights[user.id] = null;
          }
        }
        setLastWeights(weights);
      }
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.error || 'Неизвестная ошибка';
        message.error(`Ошибка сервера: ${errorMessage}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при загрузке пользователей');
      }
      console.error('Ошибка при загрузке пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.phone && user.phone.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            placeholder="Поиск по имени или email"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: 300 }}
          />

          <List
            loading={loading}
            dataSource={filteredUsers}
            renderItem={user => (
              <List.Item
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  ':hover': {
                    backgroundColor: '#fafafa',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }
                }}
                onClick={() => navigate(`/users/${user.id}/meal-plans`)}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  width: '100%',
                  gap: '16px'
                }}>
                  <div style={{ 
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                  </div>
                  
                  <div style={{ flex: '1 1 auto' }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      width: '100%'
                    }}>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '180px'
                      }}>
                        {user.name}
                      </span>

                      <Space size="middle">
                        <Tooltip title="Стартовый вес">
                          <Tag color="purple" style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            margin: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            <HistoryOutlined />
                            {mockStartWeights[user.id]} кг
                          </Tag>
                        </Tooltip>

                        {lastWeights[user.id] !== undefined && lastWeights[user.id] !== null ? (
                          <Tooltip title="Текущий вес">
                            <Tag color="blue" style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              margin: 0,
                              whiteSpace: 'nowrap'
                            }}>
                              <DashboardOutlined />
                              {lastWeights[user.id]} кг
                            </Tag>
                          </Tooltip>
                        ) : (
                          <span style={{ color: '#999', whiteSpace: 'nowrap' }}>Нет данных</span>
                        )}

                        <Tooltip title="День подписки">
                          <Tag color="green" style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            margin: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            <CalendarOutlined />
                            День {mockSubscriptionDays[user.id]}
                          </Tag>
                        </Tooltip>
                      </Space>
                      
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: '#666',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {user.email ? (
                          <>
                            <MailOutlined />
                            {user.email}
                          </>
                        ) : user.phone ? (
                          <>
                            <PhoneOutlined />
                            {user.phone}
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>

                  <Tooltip title="Планы питания">
                    <Button
                      type="text"
                      icon={<CalendarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/users/${user.id}/meal-plans`);
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none'
                      }}
                    />
                  </Tooltip>
                </div>
              </List.Item>
            )}
          />
        </Space>
      </Card>
    </div>
  );
};

export default Users; 