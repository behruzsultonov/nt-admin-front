import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UserOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  CoffeeOutlined,
  TeamOutlined,
  LogoutOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Пользователи',
    },
    {
      key: '/chats',
      icon: <MessageOutlined />,
      label: 'Чаты',
    },
    {
      key: '/ingredients',
      icon: <ShoppingOutlined />,
      label: 'Ингредиенты',
    },
    {
      key: '/dishes',
      icon: <CoffeeOutlined />,
      label: 'Блюда',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: handleLogout,
    },
  ];

  return (
    <Sider
      theme="light"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#f9fafb',
      }}
    >
      <div style={{ padding: '16px 16px 8px 16px' }}>
        <Title level={5} style={{ marginBottom: 8 }}>Панель управления</Title>
        <p style={{ margin: 0, color: '#888' }}>
          {user?.name || user?.email}
        </p>
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => key !== 'logout' && navigate(key)}
      />
    </Sider>
  );
};

export default Sidebar;
