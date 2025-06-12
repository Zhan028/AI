import React, { useState, useRef, useEffect } from 'react';
import { askGroq } from './api/grok';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  useTheme,
  alpha,
  Drawer,
  Button,
  Tooltip,
  ListItemButton,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

const ChatInterface = () => {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const messagesEndRef = useRef(null);

  // Chat sessions state
  const [chatSessions, setChatSessions] = useState([
    {
      id: '1',
      title: 'Новый чат',
      messages: [{
        role: 'assistant',
        content: 'Привет! Я ваш AI ассистент на базе Groq. Чем могу помочь?'
      }],
      lastUpdated: new Date()
    }
  ]);

  // Set initial selected chat
  useEffect(() => {
    if (chatSessions.length > 0 && !selectedChatId) {
      setSelectedChatId(chatSessions[0].id);
    }
  }, [chatSessions, selectedChatId]);

  const currentChat = chatSessions.find(chat => chat.id === selectedChatId) || chatSessions[0];

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...currentChat.messages, userMessage];
    
    setChatSessions(prev => prev.map(chat => 
      chat.id === selectedChatId 
        ? { ...chat, messages: updatedMessages, lastUpdated: new Date() }
        : chat
    ));
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await askGroq(updatedMessages);
      if (response.success) {
        setChatSessions(prev => prev.map(chat => 
          chat.id === selectedChatId 
            ? { 
                ...chat, 
                messages: [...chat.messages, { role: 'assistant', content: response.content }],
                lastUpdated: new Date()
              }
            : chat
        ));
      } else {
        setChatSessions(prev => prev.map(chat => 
          chat.id === selectedChatId 
            ? { 
                ...chat, 
                messages: [...chat.messages, { 
                  role: 'assistant', 
                  content: `Ошибка: ${response.error || 'Неизвестная ошибка'}`
                }],
                lastUpdated: new Date()
              }
            : chat
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'Новый чат',
      messages: [{
        role: 'assistant',
        content: 'Привет! Я ваш AI ассистент на базе Groq. Чем могу помочь?'
      }],
      lastUpdated: new Date()
    };
    setChatSessions(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
  };

  const deleteChat = (chatId) => {
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(chatSessions[0]?.id || null);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      bgcolor: alpha(theme.palette.background.default, 0.8),
      backgroundImage: 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sx={{
          width: { xs: '100%', sm: 280 },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 280 },
            boxSizing: 'border-box',
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          height: { xs: '56px', sm: '64px' }
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            История чатов
          </Typography>
          <IconButton onClick={() => setIsSidebarOpen(false)}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Divider />
        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={createNewChat}
          sx={{ 
            m: 1,
            height: { xs: '40px', sm: '48px' },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
          variant="contained"
        >
          Новый чат
        </Button>
        <List sx={{ 
          overflow: 'auto', 
          height: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 120px)' }
        }}>
          {chatSessions.map((chat) => (
            <ListItemButton
              key={chat.id}
              selected={chat.id === selectedChatId}
              onClick={() => {
                setSelectedChatId(chat.id);
                if (window.innerWidth < 600) {
                  setIsSidebarOpen(false);
                }
              }}
              sx={{
                mb: 0.5,
                borderRadius: 1,
                mx: 1,
                py: { xs: 1, sm: 1.5 },
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ListItemText
                primary={chat.title}
                secondary={new Date(chat.lastUpdated).toLocaleString()}
                primaryTypographyProps={{
                  noWrap: true,
                  sx: { 
                    fontWeight: chat.id === selectedChatId ? 600 : 400,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }
                }}
                secondaryTypographyProps={{
                  noWrap: true,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedChatId(chat.id);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main Chat Area */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>
        {/* Header */}
        <Paper elevation={3} sx={{
          p: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(45deg, #6200ea 30%, #9c27b0 90%)',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: { xs: '56px', sm: '64px' }
        }}>
          <IconButton
            color="inherit"
            onClick={() => setIsSidebarOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Avatar sx={{ 
            bgcolor: '#9c27b0', 
            mr: 2,
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            boxShadow: '0 0 10px rgba(156, 39, 176, 0.5)'
          }}>
            AI
          </Avatar>
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            {currentChat?.title || 'Groq AI Чат'}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            color="inherit" 
            onClick={() => {
              setChatSessions(prev => prev.map(chat => 
                chat.id === selectedChatId 
                  ? { 
                      ...chat, 
                      messages: [{
                        role: 'assistant',
                        content: 'Чат очищен. Чем могу помочь?'
                      }],
                      lastUpdated: new Date()
                    }
                  : chat
              ));
            }}
            title="Очистить чат"
            sx={{
              '&:hover': {
                transform: 'rotate(180deg)',
                transition: 'transform 0.3s ease-in-out'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Paper>

        {/* Messages Area */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          p: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.primary.main, 0.1),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.3),
            borderRadius: '4px',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.5),
            },
          },
        }}>
          <List sx={{ 
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            px: { xs: 0.5, sm: 2, md: 4 }
          }}>
            {currentChat?.messages.map((msg, index) => (
              <React.Fragment key={index}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    mb: 2,
                    animation: 'fadeIn 0.3s ease-in-out',
                    '@keyframes fadeIn': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(10px)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                  }}
                >
                  <ListItemAvatar sx={{
                    minWidth: { xs: '32px', sm: '40px' },
                    margin: msg.role === 'user' ? '0 0 0 8px' : '0 8px 0 0'
                  }}>
                    <Avatar sx={{
                      bgcolor: msg.role === 'user' ? '#1976d2' : '#9c27b0',
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {msg.role === 'user' ? 'Я' : 'AI'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{
                      bgcolor: msg.role === 'user' 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.secondary.main, 0.1),
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 3,
                      maxWidth: { xs: '85%', sm: '80%' },
                      ml: msg.role === 'user' ? 0 : 1,
                      mr: msg.role === 'user' ? 1 : 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      },
                    }}
                    primary={
                      <Typography
                        component="span"
                        variant="body1"
                        sx={{
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                      >
                        {msg.content}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ 
                          display: 'block', 
                          mt: 1,
                          opacity: 0.7,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      >
                        {msg.role === 'user' ? 'Вы' : 'AI ассистент'} • {new Date().toLocaleTimeString()}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < currentChat.messages.length - 1 && (
                  <Divider 
                    variant="inset" 
                    component="li" 
                    sx={{ 
                      opacity: 0.3,
                      my: 1
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
            {isLoading && (
              <ListItem sx={{
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 },
                },
              }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  AI думает...
                </Typography>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        {/* Input Area */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 1, sm: 2 },
            background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.98))',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            position: 'sticky',
            bottom: 0,
            zIndex: 1000
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            maxWidth: '1200px',
            margin: '0 auto',
            px: { xs: 0.5, sm: 2, md: 4 }
          }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  bgcolor: alpha(theme.palette.primary.main, 0.3),
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <SendIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            </IconButton>
          </Box>
        </Paper>
      </Box>

      {/* Delete Chat Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        fullScreen={window.innerWidth < 600}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Удалить чат?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsDeleteDialogOpen(false)}
            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            Отмена
          </Button>
          <Button 
            onClick={() => deleteChat(selectedChatId)} 
            color="error"
            variant="contained"
            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatInterface;