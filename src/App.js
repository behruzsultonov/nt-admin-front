import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Users from './pages/Users';
import Ingredients from './pages/Ingredients';
import Dishes from './pages/Dishes';
import NewMealPlan from './pages/NewMealPlan';
import MealPlanEditor from './pages/MealPlanEditor';
import MealPlanView from './pages/MealPlanView';
import UserMealPlans from './pages/UserMealPlans';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const { Content } = Layout;

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout style={{ minHeight: '100vh' }}>
                  <Sidebar />
                  <Layout style={{ marginLeft: 200 }}>
                    <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                      <Routes>
                        <Route path="/" element={<Navigate to="/users" replace />} />
                        <Route path="/dashboard" element={<Navigate to="/users" replace />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/users/:id/meal-plans" element={<UserMealPlans />} />
                        <Route path="/users/:id/meal-plans/:planId/edit" element={<MealPlanEditor />} />
                        <Route path="/ingredients" element={<Ingredients />} />
                        <Route path="/dishes" element={<Dishes />} />
                        <Route path="/meal-plans/new" element={<NewMealPlan />} />
                        <Route path="/meal-plans/:id" element={<MealPlanView />} />
                        <Route path="/meal-plans/:id/edit" element={<MealPlanEditor />} />
                      </Routes>
                    </Content>
                  </Layout>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
