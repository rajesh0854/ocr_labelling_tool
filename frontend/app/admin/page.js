'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Avatar,
  Chip,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useMediaQuery,
  Button,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Dashboard,
  Person,
  Assignment,
  CheckCircle,
  Error,
  Logout,
  ImageSearch,
  BarChart,
  Brightness4,
  Brightness7,
  Article,
  Warning,
  Speed,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Get API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'OCR Annotation Tool';

// Custom theme with modern color palette
const getTheme = (mode) => createTheme({
  palette: {
    mode,
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
      default: mode === 'dark' ? '#111827' : '#F9FAFB',
      paper: mode === 'dark' ? '#1F2937' : '#FFFFFF',
    },
    success: {
      main: '#10B981', // Emerald
    },
    error: {
      main: '#EF4444', // Red
    },
    warning: {
      main: '#F59E0B', // Amber
    },
    info: {
      main: '#3B82F6', // Blue
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    subtitle1: {
      fontSize: '0.95rem',
    },
    body1: {
      fontSize: '0.9rem',
    },
    body2: {
      fontSize: '0.85rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.9rem',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '6px 14px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 18px 0 rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          height: 24,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        sizeSmall: {
          padding: 4,
        },
      },
    },
  },
});

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString();
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = getTheme(darkMode ? 'dark' : 'light');

  // Total statistics
  const totalUsers = progress.length;
  const totalImages = progress.reduce((sum, user) => sum + user.total_images, 0);
  const totalLabeled = progress.reduce((sum, user) => sum + user.labeled_count, 0);
  const totalValidLabeled = progress.reduce((sum, user) => sum + user.valid_labeled, 0);
  const totalInvalidMarked = progress.reduce((sum, user) => sum + user.invalid_marked, 0);
  const overallProgress = totalImages ? (totalLabeled / totalImages) * 100 : 0;

  // Chart data
  const chartData = {
    labels: progress.map(user => user.user),
    datasets: [
      {
        label: 'Completed (%)',
        data: progress.map(user => user.completion_percentage),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      }
    ]
  };

  const pieData = {
    labels: ['Valid', 'Invalid', 'Unlabeled'],
    datasets: [
      {
        data: [
          totalValidLabeled,
          totalInvalidMarked,
          totalImages - totalLabeled
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)', // Green for valid
          'rgba(239, 68, 68, 0.7)',  // Red for invalid
          'rgba(156, 163, 175, 0.7)', // Gray for unlabeled
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: progress.map(user => user.user),
    datasets: [
      {
        label: 'Total Images',
        data: progress.map(user => user.total_images),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Labeled Images',
        data: progress.map(user => user.labeled_count),
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Completion Progress by User',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Completion Percentage'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Image Labeling Status',
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Images and Labeling Status by User',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Images'
        }
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (!token || !isAdmin) {
      router.push('/');
      return;
    }

    // Load user preference for dark mode
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }

    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/admin/progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch progress data');
        }

        const data = await response.json();
        setProgress(data.progress || []);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
    
    // Setup auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [refreshCounter]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  if (loading && progress.length === 0) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            gap: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Loading Admin Dashboard
          </Typography>
          <CircularProgress size={60} thickness={4} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            zIndex: theme => theme.zIndex.drawer + 1,
            backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.8), rgba(236, 72, 153, 0.6))',
            color: 'white',
          }}
        >
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Dashboard sx={{ mr: 1 }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {APP_NAME} Admin Dashboard
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  color="inherit" 
                  onClick={() => setRefreshCounter(prev => prev + 1)}
                  sx={{ 
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'rotate(180deg)' }
                  }}
                >
                  <Schedule />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton color="inherit" onClick={toggleDarkMode}>
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Logout">
                <IconButton onClick={handleLogout} color="inherit">
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" gutterBottom fontWeight="600" color="primary">
              Annotation Progress Overview
            </Typography>
          </motion.div>

          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <Person />
                      </Avatar>
                      <Typography variant="h5" fontWeight="600">
                        {totalUsers}
                      </Typography>
                    </Box>
                    <Typography color="textSecondary" variant="body2">
                      Active Annotators
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                        <ImageSearch />
                      </Avatar>
                      <Typography variant="h5" fontWeight="600">
                        {totalImages}
                      </Typography>
                    </Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Images
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                        <CheckCircle />
                      </Avatar>
                      <Typography variant="h5" fontWeight="600">
                        {totalLabeled}
                      </Typography>
                    </Box>
                    <Typography color="textSecondary" variant="body2">
                      Labeled Images
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                        <Error />
                      </Avatar>
                      <Typography variant="h5" fontWeight="600">
                        {totalInvalidMarked}
                      </Typography>
                    </Box>
                    <Typography color="textSecondary" variant="body2">
                      Invalid Images
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          </Grid>

          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper elevation={0} sx={{ p: 3, mb: 4, border: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Overall Project Progress</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {totalLabeled} of {totalImages} images labeled
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {overallProgress.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={overallProgress} 
                  sx={{ height: 10, borderRadius: 2 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3, justifyContent: 'center' }}>
                <Chip 
                  icon={<CheckCircle fontSize="small" />} 
                  label={`${totalValidLabeled} Valid`} 
                  color="success"
                  size="small"
                />
                <Chip 
                  icon={<Warning fontSize="small" />} 
                  label={`${totalInvalidMarked} Invalid`} 
                  color="error"
                  size="small"
                />
                <Chip 
                  icon={<Assignment fontSize="small" />} 
                  label={`${totalImages - totalLabeled} Remaining`} 
                  color="default"
                  size="small"
                />
              </Box>
            </Paper>
          </motion.div>

          {/* Charts */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={1000}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', border: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom>
                    Completion by User
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar data={chartData} options={barOptions} />
                  </Box>
                </Paper>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={1000}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', border: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom>
                    Label Distribution
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                    <Pie data={pieData} options={pieOptions} />
                  </Box>
                </Paper>
              </Fade>
            </Grid>
            
            <Grid item xs={12}>
              <Fade in={true} timeout={1000}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom>
                    Images Per User
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line data={lineData} options={lineOptions} />
                  </Box>
                </Paper>
              </Fade>
            </Grid>
          </Grid>

          {/* Detailed Table */}
          <Box sx={{ mt: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Detailed Annotation Progress
              </Typography>
            </motion.div>
            
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <Table aria-label="annotation progress table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Images</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Valid Labels</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Invalid Marked</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Last Update</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progress.map((user, index) => (
                    <TableRow 
                      key={`${user.user}-${user.batch_id}`}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        animation: 'fadeIn 0.5s',
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: 'both',
                        '@keyframes fadeIn': {
                          '0%': { opacity: 0, transform: 'translateY(10px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              bgcolor: 'primary.main', 
                              mr: 1, 
                              fontSize: '0.8rem' 
                            }}
                          >
                            {user.user[0].toUpperCase()}
                          </Avatar>
                          {user.user}
                        </Box>
                      </TableCell>
                      <TableCell>{user.batch_id}</TableCell>
                      <TableCell>{user.total_images}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          color="success" 
                          label={user.valid_labeled} 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          color="error" 
                          label={user.invalid_marked} 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={user.completion_percentage} 
                            sx={{ 
                              flexGrow: 1, 
                              height: 6, 
                              borderRadius: 3,
                              background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }} 
                          />
                          <Typography variant="caption" sx={{ minWidth: 32 }}>
                            {user.completion_percentage.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(user.last_update)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box mt={3} mb={2} display="flex" justifyContent="center">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setRefreshCounter(prev => prev + 1)}
              startIcon={<Schedule />}
              sx={{ mx: 1 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogout}
              startIcon={<Logout />}
              sx={{ mx: 1 }}
            >
              Logout
            </Button>
          </Box>
        </Container>
        
        <Box 
          component="footer" 
          sx={{ 
            p: 2, 
            mt: 'auto',
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {APP_NAME} Admin Dashboard © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
} 