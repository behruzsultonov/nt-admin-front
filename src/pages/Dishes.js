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
  Select,
  List,
  Upload,
  Divider,
  Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../api/client';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const mealTypes = [
  { value: 'Вода', label: '💧 Вода' },
  { value: 'Завтрак', label: '🍳 Завтрак' },
  { value: 'Обед', label: '🥘 Обед' },
  { value: 'Ужин', label: '🍽️ Ужин' },
  { value: 'Перекус', label: '🍎 Перекус' }
];

const Dishes = () => {
  const [dishes, setDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [form] = Form.useForm();

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const [dishesResponse, ingredientsResponse] = await Promise.all([
        api.getDishes(),
        api.getIngredients()
      ]);
      if (dishesResponse.data) {
        setDishes(dishesResponse.data);
      }
      if (ingredientsResponse.data) {
        setIngredients(ingredientsResponse.data);
      }
    } catch (error) {
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.data.message || 'Неизвестная ошибка'}`);
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
    fetchDishes();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      
      // Если это редактирование, используем существующие значения как базовые
      const baseValues = editingDish ? {
        name: editingDish.name,
        calories_per_100: editingDish.calories_per_100,
        proteins_per_100: editingDish.proteins_per_100,
        carbs_per_100: editingDish.carbs_per_100,
        fats_per_100: editingDish.fats_per_100,
        instruction: editingDish.instruction,
        video_url: editingDish.video_url || '',
        unit: editingDish.unit,
        meal_times: editingDish.meal_times,
        ingredients: editingDish.ingredients
      } : {};

      // Объединяем базовые значения с новыми
      const finalValues = { ...baseValues, ...values };
      
      console.log('Final values before FormData:', finalValues);
      
      // Добавляем все поля формы в FormData
      Object.keys(finalValues).forEach(key => {
        if (key === 'ingredients') {
          formData.append(key, JSON.stringify(finalValues[key]));
        } else if (key === 'meal_times') {
          formData.append(key, JSON.stringify(finalValues[key]));
        } else if (key === 'image') {
          console.log('Processing image field:', finalValues[key]);
          if (Array.isArray(finalValues[key]) && finalValues[key].length > 0) {
            const file = finalValues[key][0].originFileObj;
            console.log('File to append:', file);
            if (file instanceof File) {
              formData.append('image', file);
              console.log('File appended to FormData');
            } else {
              console.error('Not a File object:', file);
            }
          } else {
            console.log('No file in image array');
          }
        } else {
          formData.append(key, finalValues[key] || '');
        }
      });

      // Проверяем содержимое FormData
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }

      if (editingDish) {
        await api.updateDish(editingDish.id, formData);
        message.success('Блюдо обновлено');
      } else {
        await api.createDish(formData);
        message.success('Блюдо добавлено');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDish(null);
      fetchDishes();
    } catch (error) {
      console.error('Ошибка при сохранении блюда:', error);
      if (error.response) {
        const errorMessage = error.response.data.error || 'Неизвестная ошибка';
        message.error(`Ошибка сервера: ${errorMessage}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при сохранении блюда');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDish(id);
      message.success('Блюдо удалено');
      fetchDishes();
    } catch (error) {
      if (error.response) {
        message.error(`Ошибка сервера: ${error.response.data.message || 'Неизвестная ошибка'}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу');
      } else {
        message.error('Ошибка при удалении блюда');
      }
      console.error('Ошибка при удалении блюда:', error);
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
              console.log('Editing dish:', record);
              setEditingDish(record);
              form.setFieldsValue({
                ...record,
                unit: record.unit || 'г',
                meal_times: record.meal_times || [],
                ingredients: record.ingredients.map(ing => {
                  const ingredient_id = ing.ingredient_id || ing.id;
                  const ingredientObj = ingredients.find(i => i.id === ingredient_id);
                  return {
                    ingredient_id,
                    amount: ing.amount,
                    unit: ing.unit || 'г',
                    name: ing.name || (ingredientObj ? ingredientObj.name : '')
                  };
                }),
                image: record.image_url ? [{
                  uid: '-1',
                  name: record.image_url.split('/').pop(),
                  status: 'done',
                  url: record.image_url.startsWith('http') ? record.image_url : `http://localhost:3001${record.image_url}`
                }] : []
              });
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить блюдо?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Изображение',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (image_url) => (
        image_url ? (
          <img 
            src={image_url.startsWith('http') ? image_url : `http://localhost:3001${image_url}`} 
            alt="Блюдо" 
            style={{ width: 100, height: 100, objectFit: 'cover' }} 
          />
        ) : null
      ),
    },
    {
      title: 'Калории на 100г',
      dataIndex: 'calories_per_100',
      key: 'calories_per_100',
    },
    {
      title: 'Белки на 100г',
      dataIndex: 'proteins_per_100',
      key: 'proteins_per_100',
    },
    {
      title: 'Углеводы на 100г',
      dataIndex: 'carbs_per_100',
      key: 'carbs_per_100',
    },
    {
      title: 'Жиры на 100г',
      dataIndex: 'fats_per_100',
      key: 'fats_per_100',
    },
    {
      title: 'Типы приема пищи',
      dataIndex: 'meal_times',
      key: 'meal_times',
      render: (mealTimes) => (
        <Space>
          {mealTimes?.map(time => (
            <span key={time}>{time}</span>
          ))}
        </Space>
      ),
    },
    {
      title: 'Ингредиенты',
      dataIndex: 'ingredients',
      key: 'ingredients',
      render: (ingredients) => (
        <List
          size="small"
          dataSource={ingredients}
          renderItem={item => (
            <List.Item>
              {item.name} - {item.amount}{item.unit}
            </List.Item>
          )}
        />
      ),
    },
  ];
  

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Блюда</Title>
            <Tooltip title="Добавить блюдо">
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingDish(null);
                  form.resetFields();
                  form.setFieldsValue({ unit: 'г' });
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
            dataSource={dishes}
            columns={columns}
            rowKey="id"
          />
        </Space>
      </Card>

      <Modal
        title={editingDish ? 'Редактировать блюдо' : 'Добавить блюдо'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDish(null);
        }}
        okText={editingDish ? 'Сохранить' : 'Добавить'}
        cancelText="Отмена"
        width={800}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Название *"
            rules={[{ required: true, message: 'Введите название блюда' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="calories_per_100"
            label="Калории на 100г *"
            rules={[{ required: true, message: 'Введите калории на 100г' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="proteins_per_100"
            label="Белки на 100г *"
            rules={[{ required: true, message: 'Введите белки на 100г' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="carbs_per_100"
            label="Углеводы на 100г *"
            rules={[{ required: true, message: 'Введите углеводы на 100г' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="fats_per_100"
            label="Жиры на 100г *"
            rules={[{ required: true, message: 'Введите жиры на 100г' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="meal_times"
            label="Типы приема пищи *"
            rules={[{ required: true, message: 'Выберите типы приема пищи' }]}
          >
            <Select mode="multiple">
              {mealTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="instruction"
            label="Инструкция по приготовлению *"
            rules={[{ required: true, message: 'Введите инструкцию по приготовлению' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="video_url"
            label="Ссылка на видео"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="image"
            label="Изображение блюда *"
            rules={[{ required: true, message: 'Загрузите изображение блюда' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              console.log('Upload event:', e);
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              name="image"
              listType="picture"
              maxCount={1}
              beforeUpload={(file) => {
                console.log('Before upload file:', file);
                return false;
              }}
              accept="image/*"
              onChange={(info) => {
                console.log('Upload onChange:', info);
              }}
            >
              <Button icon={<UploadOutlined />}>Выбрать изображение</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="unit"
            label="Единица измерения блюда *"
            rules={[{ required: true, message: 'Выберите единицу измерения блюда' }]}
            initialValue="г"
          >
            <Select style={{ width: 120 }}>
              <Option value="г">г</Option>
              <Option value="мл">мл</Option>
              <Option value="шт">шт</Option>
            </Select>
          </Form.Item>

          <Divider style={{ margin: '24px 0 12px' }} />
          <Title level={5} style={{ marginBottom: 16 }}>Ингредиенты</Title>

          <Form.List
            name="ingredients"
            rules={[
              {
                validator: async (_, ingredients) => {
                  if (!ingredients || ingredients.length < 1) {
                    return Promise.resolve();
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'ingredient_id']}
                      rules={[{ required: true, message: 'Выберите ингредиент' }]}
                    >
                      <Select style={{ width: 200 }} placeholder="Ингредиент">
                        {ingredients.map(ingredient => (
                          <Option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'amount']}
                      rules={[{ required: true, message: 'Введите количество' }]}
                    >
                      <InputNumber min={0} step={0.1} placeholder="Количество" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unit']}
                      rules={[{ required: true, message: 'Выберите единицу' }]}
                      initialValue="г"
                    >
                      <Select style={{ width: 80 }} placeholder="Ед. изм.">
                        <Option value="г">г</Option>
                        <Option value="мл">мл</Option>
                        <Option value="шт">шт</Option>
                      </Select>
                    </Form.Item>
                    <Button type="link" onClick={() => remove(name)} icon={<DeleteOutlined />} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Добавить ингредиент
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default Dishes;
