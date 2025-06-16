import React, { useState, useEffect } from 'react';
import { Card, List, Input, Button, Space, Typography, Badge, Avatar, message, Upload, Modal, Form } from 'antd';
import { SendOutlined, UserOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { PHP_API_URL } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return imageUrl.startsWith('http') ? imageUrl : `${PHP_API_URL}${imageUrl}`;
};

const Chats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [overlayImage, setOverlayImage] = useState(null);
  const [hoveredImgId, setHoveredImgId] = useState(null);
  const messagesContainerRef = React.useRef(null);
  const isFirstLoad = React.useRef(true);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Загрузка списка чатов
  const fetchChats = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.getChats(user.id, null);
      const data = Array.isArray(response.data) ? response.data : [];
      setChats(data);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка при загрузке чатов';
      message.error(errorMessage);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Загрузка сообщений выбранного чата
  const fetchMessages = async (chatId) => {
    try {
      setMessagesLoading(true);
      const response = await api.getChatMessages(chatId);
      const newMessages = response.data || [];
      
      // Скроллим только если это первая загрузка или количество сообщений изменилось
      const shouldScroll = isFirstLoad.current || newMessages.length > messages.length;
      setMessages(newMessages);
      
      if (shouldScroll) {
        scrollToBottom();
      }
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }

      // Отмечаем сообщения как прочитанные
      await api.markMessagesAsRead(chatId);
      // Обновляем список чатов, чтобы обновить счетчик непрочитанных
      fetchChats(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка при загрузке сообщений';
      message.error(errorMessage);
    } finally {
      setMessagesLoading(false);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${PHP_API_URL}/index.php?action=upload_chat_image`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImageFile(file);
        const fullUrl = getFullImageUrl(data.url);
        setUploadedImageUrl(data.url);
        onSuccess({ ...data, url: fullUrl }, file);
      } else {
        onError(new Error(data.error || 'Ошибка загрузки'));
        setImageFile(null);
        setUploadedImageUrl(null);
      }
    } catch (e) {
      console.error('Upload error:', e);
      onError(e);
      setImageFile(null);
      setUploadedImageUrl(null);
    }
  };

  const handleImageChange = (info) => {
    const { status, originFileObj } = info.file;
    
    if (status === 'uploading') {
      return;
    }
    
    if (status === 'done' || status === undefined) {
      setImageFile(originFileObj);
    } else if (status === 'error') {
      message.error(`${info.file.name} ошибка загрузки.`);
      setImageFile(null);
      setUploadedImageUrl(null);
    } else if (status === 'removed') {
      setImageFile(null);
      setUploadedImageUrl(null);
    }
  };

  // Отправка нового сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() && !uploadedImageUrl) return;
    
    try {
      await api.sendMessage(
        selectedChat.id,
        newMessage.trim(),
        user.id,
        null,
        uploadedImageUrl
      );
      
      setNewMessage('');
      setImageFile(null);
      setUploadedImageUrl(null);
      
      // Обновляем сообщения после отправки и скроллим вниз
      await fetchMessages(selectedChat.id);
      scrollToBottom();
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при отправке сообщения';
      message.error(errorMessage);
    }
  };

  // Периодическое обновление чатов
  useEffect(() => {
    fetchChats(true); // первый раз показываем loader
    const interval = setInterval(() => fetchChats(false), 30000); // автообновление без loader
    return () => clearInterval(interval);
  }, []);

  // Сброс флага первой загрузки при смене чата
  useEffect(() => {
    if (selectedChat) {
      isFirstLoad.current = true;
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', height: 'calc(100vh - 200px)' }}>
          {/* Список чатов */}
          <div style={{ width: 300, borderRight: '1px solid #f0f0f0', padding: '0 16px' }}>
            <Title level={4}>Чаты</Title>
            <List
              loading={loading}
              dataSource={chats.filter(chat => chat.user_name && chat.user_email)}
              renderItem={chat => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: selectedChat?.id === chat.id ? '#f0f0f0' : 'transparent',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                  onClick={() => setSelectedChat(chat)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={chat.unread_count} offset={[-5, 5]}>
                        <Avatar icon={<UserOutlined />} />
                      </Badge>
                    }
                    title={chat.user_name}
                    description={chat.user_email}
                  />
                </List.Item>
              )}
            />
          </div>

          {/* Область чата */}
          <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
            {selectedChat ? (
              <>
                {/* Верхняя панель чата */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0',
                  padding: '16px 0 12px 0',
                  marginBottom: 0,
                  position: 'sticky',
                  top: 0,
                  background: '#fff',
                  zIndex: 2
                }}>
                  <Avatar size={44} icon={<UserOutlined />} style={{ marginRight: 16, background: '#e6f0ff', color: '#4094f7' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18 }}>{selectedChat.user_name}</div>
                    <div style={{ color: '#888', fontSize: 14 }}>{selectedChat.user_email}</div>
                  </div>
                </div>
                {/* Сообщения */}
                <div 
                  ref={messagesContainerRef}
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '16px 0', 
                    position: 'relative', 
                    background: '#f9fbff',
                    display: 'flex',
                    flexDirection: 'column-reverse'
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      Нет сообщений
                    </div>
                  ) : (
                    <div>
                      {messages.map(message => {
                        const isAdmin = message.sender_type === 'nutritionist';
                        const hasText = !!message.message;
                        const hasImage = !!message.image_url;
                        const imgSrc = hasImage ? getFullImageUrl(message.image_url) : null;
                        // Только картинка
                        if (hasImage && !hasText) {
                          return (
                            <div
                              key={`${message.sender_type}-${message.id}`}
                              style={{
                                display: 'flex',
                                justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                marginBottom: 10,
                                paddingLeft: isAdmin ? 60 : 0,
                                paddingRight: isAdmin ? 0 : 60,
                              }}
                            >
                              <div style={{ 
                                position: 'relative', 
                                display: 'inline-block',
                                maxWidth: 'fit-content' 
                              }}>
                                <img
                                  src={imgSrc}
                                  alt="chat-img"
                                  style={{
                                    display: 'block',
                                    maxWidth: 340,
                                    maxHeight: 320,
                                    borderRadius: 16,
                                    boxShadow: '0 2px 16px rgba(0,0,0,0.13)',
                                    cursor: 'pointer',
                                    background: '#fff',
                                    transition: 'box-shadow 0.2s',
                                    width: 'auto'
                                  }}
                                  onClick={() => setOverlayImage(imgSrc)}
                                  onError={e => { e.target.style.display = 'none'; }}
                                  onMouseEnter={() => setHoveredImgId(message.id)}
                                  onMouseLeave={() => setHoveredImgId(null)}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 14,
                                    bottom: 10,
                                    fontSize: 13,
                                    color: '#fff',
                                    background: 'rgba(0,0,0,0.45)',
                                    borderRadius: 8,
                                    padding: '1px 8px 0 8px',
                                    opacity: hoveredImgId === message.id ? 1 : 0,
                                    pointerEvents: 'none',
                                    transition: 'opacity 0.18s',
                                    userSelect: 'none',
                                  }}
                                >
                                  {dayjs(message.created_at).format('HH:mm')}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        // Картинка + текст: всё в одном bubble, картинка сверху, текст снизу, время внизу bubble
                        if (hasImage && hasText) {
                          return (
                            <div
                              key={`${message.sender_type}-${message.id}`}
                              style={{
                                display: 'flex',
                                justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                marginBottom: 10,
                                paddingLeft: isAdmin ? 60 : 0,
                                paddingRight: isAdmin ? 0 : 60,
                              }}
                            >
                              <div
                                style={{
                                  width: 'fit-content',
                                  maxWidth: 340,
                                  minWidth: 60,
                                  background: isAdmin ? 'linear-gradient(135deg, #4f8cff 0%, #4094f7 100%)' : '#fff',
                                  color: isAdmin ? '#fff' : '#222',
                                  borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.08)',
                                  fontSize: 16,
                                  lineHeight: 1.6,
                                  padding: 0,
                                  position: 'relative',
                                  wordBreak: 'break-word',
                                  border: 'none',
                                  cursor: 'default',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  transition: 'box-shadow 0.2s',
                                  marginLeft: isAdmin ? 'auto' : 0,
                                  marginRight: isAdmin ? 0 : 'auto',
                                  paddingBottom: 22,
                                  overflow: 'hidden',
                                }}
                              >
                                <img
                                  src={imgSrc}
                                  alt="chat-img"
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    maxHeight: 260,
                                    objectFit: 'cover',
                                    borderTopLeftRadius: isAdmin ? 18 : 18,
                                    borderTopRightRadius: isAdmin ? 18 : 18,
                                    borderBottomLeftRadius: 0,
                                    borderBottomRightRadius: 0,
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => setOverlayImage(imgSrc)}
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                                <div style={{ padding: '12px 18px 8px 18px', fontSize: 16, whiteSpace: 'pre-line', paddingRight: 36 }}>{message.message}</div>
                                <div style={{
                                  position: 'absolute',
                                  right: 12,
                                  bottom: 8,
                                  fontSize: 12,
                                  color: isAdmin ? 'rgba(255,255,255,0.7)' : '#b0b0b0',
                                  opacity: 0.85,
                                  fontWeight: 400,
                                  letterSpacing: 0.2,
                                  background: 'transparent',
                                  padding: 0,
                                  lineHeight: 1,
                                }}>
                                  {dayjs(message.created_at).format('HH:mm')}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        // Только текст
                        return (
                          <div
                            key={`${message.sender_type}-${message.id}`}
                            style={{
                              display: 'flex',
                              justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                              marginBottom: 10,
                              paddingLeft: isAdmin ? 60 : 0,
                              paddingRight: isAdmin ? 0 : 60,
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '70%',
                                minWidth: 60,
                                background: isAdmin ? 'linear-gradient(135deg, #4f8cff 0%, #4094f7 100%)' : '#fff',
                                color: isAdmin ? '#fff' : '#222',
                                borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.08)',
                                fontSize: 16,
                                lineHeight: 1.6,
                                padding: '12px 18px 8px 18px',
                                position: 'relative',
                                wordBreak: 'break-word',
                                border: 'none',
                                cursor: 'default',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'box-shadow 0.2s',
                                marginLeft: isAdmin ? 'auto' : 0,
                                marginRight: isAdmin ? 0 : 'auto',
                                paddingBottom: 22,
                                paddingRight: 36,
                              }}
                            >
                              <div style={{ fontSize: 16, whiteSpace: 'pre-line' }}>{message.message}</div>
                              <div style={{
                                position: 'absolute',
                                right: 12,
                                bottom: 8,
                                fontSize: 12,
                                color: isAdmin ? 'rgba(255,255,255,0.7)' : '#b0b0b0',
                                opacity: 0.85,
                                fontWeight: 400,
                                letterSpacing: 0.2,
                                background: 'transparent',
                                padding: 0,
                                lineHeight: 1,
                              }}>
                                {dayjs(message.created_at).format('HH:mm')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {messagesLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 2,
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: 8,
                      padding: 4
                    }}>
                      <span>⏳</span>
                    </div>
                  )}
                </div>
                {/* Область ввода сообщения */}
                <div style={{
                  padding: '16px 0',
                  background: '#fff',
                  borderTop: '1px solid #f0f0f0',
                  position: 'sticky',
                  bottom: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Form.Item style={{ margin: 0 }}>
                      <Upload
                        name="image"
                        listType="picture"
                        maxCount={1}
                        beforeUpload={(file) => {
                          const isImage = file.type.startsWith('image/');
                          if (!isImage) {
                            message.error('Можно загружать только изображения!');
                          }
                          return isImage;
                        }}
                        accept="image/*"
                        customRequest={customRequest}
                        onChange={handleImageChange}
                        showUploadList={false}
                      >
                        <Button
                          icon={<UploadOutlined />}
                          style={{
                            borderRadius: 8,
                            height: 38,
                            width: 38,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      </Upload>
                    </Form.Item>
                    
                    {imageFile && (
                      <div style={{ 
                        position: 'relative',
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #d9d9d9'
                      }}>
                        <img
                          src={URL.createObjectURL(imageFile)}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          alt=""
                        />
                        <Button 
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setUploadedImageUrl(null);
                          }}
                          style={{
                            position: 'absolute',
                            right: 2,
                            top: 2,
                            background: 'rgba(255,255,255,0.8)',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            padding: 0
                          }}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <TextArea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onPressEnter={e => {
                          if (!e.shiftKey && (newMessage.trim() || imageFile)) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Введите сообщение..."
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !imageFile}
                      style={{
                        borderRadius: 8,
                        marginLeft: 0,
                        background: '#4094f7',
                        border: 'none',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(64,148,247,0.10)',
                        transition: 'all 0.2s',
                        height: 38,
                        width: 38,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: (!newMessage.trim() && !imageFile) ? 0.5 : 1
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                Выберите чат для начала общения
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Модальное окно для просмотра изображения */}
      <Modal
        visible={!!modalImage}
        footer={null}
        onCancel={() => setModalImage(null)}
        width="auto"
        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
      >
        {modalImage && (
          <img
            src={modalImage}
            alt="Full size"
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Chats; 