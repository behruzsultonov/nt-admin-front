import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Typography,
  Popconfirm,
  Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/client';

const { Title } = Typography;

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [form] = Form.useForm();

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await api.getIngredients();
      setIngredients(response.data);
    } catch (error) {
      message.error('Ошибка при загрузке ингредиентов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleSubmit = async (values) => {
    try {
      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, values);
        message.success('Ингредиент обновлен');
      } else {
        await api.createIngredient(values);
        message.success('Ингредиент добавлен');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingIngredient(null);
      fetchIngredients();
    } catch (error) {
      message.error('Ошибка при сохранении ингредиента');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteIngredient(id);
      message.success('Ингредиент удален');
      fetchIngredients();
    } catch (error) {
      message.error('Ошибка при удалении ингредиента');
    }
  };

  const columns = [
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingIngredient(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить ингредиент?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
      width: 80,
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Калории (на 100г)',
      dataIndex: 'calories_per_100',
      key: 'calories_per_100',
    },
    {
      title: 'Белки (на 100г)',
      dataIndex: 'proteins_per_100',
      key: 'proteins_per_100',
    },
    {
      title: 'Жиры (на 100г)',
      dataIndex: 'fats_per_100',
      key: 'fats_per_100',
    },
    {
      title: 'Углеводы (на 100г)',
      dataIndex: 'carbs_per_100',
      key: 'carbs_per_100',
    },
  ];
  

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Ингредиенты</Title>
            <Tooltip title="Добавить ингредиент">
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingIngredient(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
          </div>

          <Table
            loading={loading}
            dataSource={ingredients}
            columns={columns}
            rowKey="id"
          />
        </Space>
      </Card>

      <Modal
        title={editingIngredient ? 'Редактировать ингредиент' : 'Добавить ингредиент'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingIngredient(null);
        }}
        okText={editingIngredient ? 'Сохранить' : 'Добавить'}
        cancelText="Отмена"
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название ингредиента' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="calories_per_100"
            label="Калории (на 100г)"
            rules={[{ required: true, message: 'Введите калории' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="proteins_per_100"
            label="Белки (на 100г)"
            rules={[{ required: true, message: 'Введите количество белков' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="fats_per_100"
            label="Жиры (на 100г)"
            rules={[{ required: true, message: 'Введите количество жиров' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="carbs_per_100"
            label="Углеводы (на 100г)"
            rules={[{ required: true, message: 'Введите количество углеводов' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Ingredients; 