'use client';

import { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Paper, 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  InputAdornment,
  IconButton,
  Avatar,
  Divider,
  Alert,
  Slide,
  useMediaQuery,
  Fade,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Login as LoginIcon, 
  LockOutlined, 
  AccountCircle,
  ImageSearch
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Custom theme with modern color palette
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
    },
    secondary: {
      main: '#EC4899', // Pink
      light: '#F472B6',
      dark: '#DB2777',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.03), 0px 1px 2px rgba(0,0,0,0.04)',
    // ... rest of shadows
    '0px 8px 16px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15)',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.95rem',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
  },
});

// Get API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'OCR Annotation Tool';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('batches', JSON.stringify(data.batches));
        localStorage.setItem('username', username);
        
        // Check if user is admin
        if (data.is_admin) {
          localStorage.setItem('isAdmin', 'true');
          // Redirect admin to dashboard
          router.push('/admin');
        } else {
          // Regular user goes to annotation page
          router.push('/annotation');
        }
      } else {
        setError(data.message);
        setLoading(false);
      }
    } catch (error) {
      setError('Failed to connect to server. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 8,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: '100%' }}
          >
            <Fade in={true} timeout={1000}>
              <Paper
                elevation={6}
                sx={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f8 100%)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: '8px', 
                    background: 'linear-gradient(90deg, #6366F1 0%, #EC4899 100%)',
                  }} 
                />
                <Box
                  sx={{
                    padding: { xs: 3, sm: 6 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      mb: 2,
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <ImageSearch fontSize="large" />
                  </Avatar>

                  <Typography 
                    component="h1" 
                    variant="h4" 
                    sx={{ 
                      mb: 1, 
                      background: 'linear-gradient(90deg, #4F46E5 0%, #EC4899 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {APP_NAME}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ mb: 4, textAlign: 'center' }}
                  >
                    Sign in to access the annotation workspace
                  </Typography>

                  <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="username"
                      label="Username"
                      name="username"
                      autoComplete="username"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountCircle color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 2 }}
                    />

                    <Slide direction="up" in={!!error} mountOnEnter unmountOnExit>
                      <Alert 
                        severity="error" 
                        variant="filled" 
                        sx={{ 
                          mb: 3, 
                          mt: 1, 
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)'
                        }}
                      >
                        {error}
                      </Alert>
                    </Slide>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      sx={{ 
                        mt: 1, 
                        mb: 3, 
                        py: 1.5,
                        position: 'relative',
                        backgroundImage: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)',
                        '&:hover': {
                          backgroundImage: 'linear-gradient(90deg, #4338CA 0%, #4F46E5 100%)',
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <>
                          <LoginIcon sx={{ mr: 1 }} />
                          Sign In
                        </>
                      )}
                    </Button>

                    <Divider sx={{ my: 2, opacity: 0.6 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ px: 1, fontSize: '0.75rem' }}
                      >
                        OCR Annotation System
                      </Typography>
                    </Divider>

                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                    >
                      © 2023 OCR Annotation Tool | All Rights Reserved
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </motion.div>
        </Box>
      </Container>
    </ThemeProvider>
  );
} 