'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Chip,
  LinearProgress,
  Tooltip,
  Zoom,
  Fade,
  Badge,
  Skeleton,
  Avatar,
  Slider,
  Stack,
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  CheckCircle,
  RadioButtonUnchecked,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Save as SaveIcon,
  ImageSearch,
  KeyboardArrowRight,
  KeyboardArrowLeft,
  WarningAmber,
  Info,
  Brightness7,
  Brightness4,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  RestartAlt,
  ErrorOutline,
  ReportProblem,
  Celebration,
  EmojiEvents,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

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
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
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

const DRAWER_WIDTH = 280;

export default function AnnotationPage() {
  const [images, setImages] = useState([]);
  const [labels, setLabels] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentLabel, setCurrentLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const [loadingImage, setLoadingImage] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(220);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const imageSizeRef = useRef({ width: 0, height: 0 });
  const isPanningRef = useRef(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const textFieldRef = useRef(null);
  const customTheme = getTheme(darkMode ? 'dark' : 'light');
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [nextImagePreloaded, setNextImagePreloaded] = useState(false);
  const nextImageRef = useRef(null);

  // Progress calculation
  const completedCount = images.filter(img => img.labeled || img.invalid).length;
  const invalidCount = images.filter(img => img.invalid).length;
  const validLabeledCount = completedCount - invalidCount;
  const totalCount = images.length;
  const progress = totalCount > 0 ? ((completedCount) / totalCount) * 100 : 0;

  // Text input character limit
  const MAX_CHARS = 15;

  // Completely rebuild zoom functions with boundary checks
  const updateImageBounds = () => {
    if (!imageRef.current || !imageContainerRef.current) return;
    
    // Update container and image size references
    containerSizeRef.current = {
      width: imageContainerRef.current.clientWidth,
      height: imageContainerRef.current.clientHeight
    };
    
    // Calculate scaled image dimensions
    const scaleFactor = zoomLevel / 100;
    const scaledWidth = imageSizeRef.current.width * scaleFactor;
    const scaledHeight = imageSizeRef.current.height * scaleFactor;
    
    // Calculate boundaries to keep image within view
    const maxX = Math.max(0, (scaledWidth - containerSizeRef.current.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerSizeRef.current.height) / 2);
    
    // Constrain position within boundaries
    setImagePosition(prev => ({
      x: Math.min(maxX, Math.max(-maxX, prev.x)),
      y: Math.min(maxY, Math.max(-maxY, prev.y))
    }));
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prevZoom => {
      const newZoom = Math.min(prevZoom + 20, 400);
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prevZoom => {
      const newZoom = Math.max(prevZoom - 20, 50);
      return newZoom;
    });
  };
  
  const resetZoom = () => {
    setZoomLevel(220);
    setImagePosition({ x: 0, y: 0 });
  };
  
  // Update boundary constraints whenever zoom changes
  useEffect(() => {
    updateImageBounds();
  }, [zoomLevel]);
  
  // New panning implementation with better constraints
  const startPan = (clientX, clientY) => {
    if (zoomLevel <= 100) return; // Only pan when zoomed in
    
    isPanningRef.current = true;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setInitialPosition({ ...imagePosition });
  };
  
  const doPan = (clientX, clientY) => {
    if (!isPanningRef.current) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Calculate constraints
    const scaleFactor = zoomLevel / 100;
    const scaledWidth = imageSizeRef.current.width * scaleFactor;
    const scaledHeight = imageSizeRef.current.height * scaleFactor;
    
    const maxX = Math.max(0, (scaledWidth - containerSizeRef.current.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerSizeRef.current.height) / 2);
    
    // Apply constraints during panning
    setImagePosition({
      x: Math.min(maxX, Math.max(-maxX, initialPosition.x + deltaX)),
      y: Math.min(maxY, Math.max(-maxY, initialPosition.y + deltaY))
    });
  };
  
  const endPan = () => {
    isPanningRef.current = false;
    setIsDragging(false);
  };
  
  // Improved mouse event handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    startPan(e.clientX, e.clientY);
  };
  
  const handleMouseMove = (e) => {
    if (!isPanningRef.current) return;
    e.preventDefault();
    doPan(e.clientX, e.clientY);
  };
  
  const handleMouseUp = () => {
    endPan();
  };
  
  // Improved touch event handlers
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startPan(touch.clientX, touch.clientY);
  };
  
  const handleTouchMove = (e) => {
    if (!isPanningRef.current || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling while panning
    const touch = e.touches[0];
    doPan(touch.clientX, touch.clientY);
  };
  
  const handleTouchEnd = () => {
    endPan();
  };
  
  // Improved wheel zoom with center point focus
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Get mouse position relative to container
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate relative position within the image
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
    
    // Direction and amount to zoom
    const zoomDirection = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = 15; // Smoother zooming
    
    // Calculate new zoom level
    setZoomLevel(prevZoom => {
      const newZoom = Math.min(400, Math.max(50, prevZoom + (zoomDirection * zoomFactor)));
      
      // Only adjust position if actually zooming
      if (newZoom !== prevZoom) {
        // Scale factor change
        const prevScale = prevZoom / 100;
        const newScale = newZoom / 100;
        const scaleDiff = newScale / prevScale;
        
        // Calculate position adjustment based on cursor position
        const offsetX = (mouseX - containerCenterX - imagePosition.x) * (scaleDiff - 1);
        const offsetY = (mouseY - containerCenterY - imagePosition.y) * (scaleDiff - 1);
        
        // Update position with constraints to be applied in useEffect
        setImagePosition(prev => ({
          x: prev.x - offsetX,
          y: prev.y - offsetY
        }));
      }
      
      return newZoom;
    });
  };
  
  // Setup event handlers
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;
    
    // Set passive: false for wheel to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    // Cleanup
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [imagePosition]); // Re-apply when position changes
  
  // Store original image dimensions when loaded
  const handleImageLoad = () => {
    setLoadingImage(false);
    if (imageRef.current) {
      imageSizeRef.current = {
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      };
      updateImageBounds();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const batches = JSON.parse(localStorage.getItem('batches') || '[]');
    if (batches.length === 0) {
      router.push('/');
      return;
    }

    fetchBatchImages(batches[0]);
    
    // Load user preference for dark mode
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  // Reset zoom when changing images to default 220%
  useEffect(() => {
    resetZoom();
  }, [currentImageIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        if (e.key === '+' || (e.key === '=' && e.ctrlKey)) {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-' && e.ctrlKey) {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0' && e.ctrlKey) {
          e.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchBatchImages = async (batchId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/${batchId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      
      // Add 'invalid' flag to images based on label text
      const imagesWithInvalidFlag = data.images.map(img => ({
        ...img,
        invalid: data.labels[img.name]?.text === 'INVALID'
      }));
      
      setImages(imagesWithInvalidFlag);
      setLabels(data.labels);
      setLoading(false);

      if (data.images.length > 0) {
        const firstImage = data.images[0].name;
        setCurrentLabel(data.labels[firstImage]?.text === 'INVALID' ? '' : (data.labels[firstImage]?.text || ''));
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setLoading(false);
    }
  };

  // Preload next image function
  const preloadNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      const nextImageSrc = getImageUrl(images[currentImageIndex + 1]?.name || '');
      if (nextImageSrc) {
        const img = new Image();
        img.src = nextImageSrc;
        img.onload = () => {
          setNextImagePreloaded(true);
        };
        nextImageRef.current = img;
      }
    }
  };

  // Call preload when current image is loaded
  useEffect(() => {
    if (!loadingImage && images.length > 0) {
      preloadNextImage();
    }
  }, [currentImageIndex, loadingImage, images.length]);

  // Optimized label submit function
  const handleLabelSubmit = async () => {
    if (!images[currentImageIndex]) return;
    const batches = JSON.parse(localStorage.getItem('batches') || '[]');
    if (batches.length === 0) return;
    const batchId = batches[0];

    // First move to next image immediately for responsiveness
    if (currentImageIndex < images.length - 1) {
      const nextIndex = currentImageIndex + 1;
      const nextLabel = labels[images[nextIndex]?.name]?.text === 'INVALID' ? '' : (labels[images[nextIndex]?.name]?.text || '');
      
      // Update state first to make UI feel responsive
      setCurrentImageIndex(nextIndex);
      setCurrentLabel(nextLabel);
      setLoadingImage(true);
      
      // If the next image is preloaded, set loading to false immediately
      if (nextImagePreloaded) {
        setTimeout(() => setLoadingImage(false), 50);
        setNextImagePreloaded(false);
      }
    }

    // Optimistically update local state
    setLabels(prevLabels => ({
      ...prevLabels,
      [images[currentImageIndex].name]: { text: currentLabel },
    }));

    setImages(prevImages =>
      prevImages.map((img, idx) =>
        idx === currentImageIndex ? { ...img, labeled: true } : img
      )
    );

    // Show feedback animation
    setShowSaveAnimation(true);
    setTimeout(() => setShowSaveAnimation(false), 800); // Reduced from 1500ms

    // Perform API call in background
    try {
      const response = await fetch(`${API_BASE_URL}/api/labels/${batchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          image_name: images[currentImageIndex].name,
          label_text: currentLabel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save label');
      }

    } catch (error) {
      console.error('Error saving label:', error);
      // Consider adding error handling UI feedback here
    }
  };

  // Optimized mark invalid function
  const handleMarkInvalid = async () => {
    if (!images[currentImageIndex]) return;
    const batches = JSON.parse(localStorage.getItem('batches') || '[]');
    if (batches.length === 0) return;
    const batchId = batches[0];

    // First move to next image immediately for responsiveness
    if (currentImageIndex < images.length - 1) {
      const nextIndex = currentImageIndex + 1;
      const nextLabel = labels[images[nextIndex]?.name]?.text === 'INVALID' ? '' : (labels[images[nextIndex]?.name]?.text || '');
      
      // Update state first to make UI feel responsive
      setCurrentImageIndex(nextIndex);
      setCurrentLabel(nextLabel);
      setLoadingImage(true);
      
      // If the next image is preloaded, set loading to false immediately
      if (nextImagePreloaded) {
        setTimeout(() => setLoadingImage(false), 50);
        setNextImagePreloaded(false);
      }
    }

    // Optimistically update local state
    setLabels(prevLabels => ({
      ...prevLabels,
      [images[currentImageIndex].name]: { text: 'INVALID' },
    }));

    setImages(prevImages =>
      prevImages.map((img, idx) =>
        idx === currentImageIndex ? { ...img, labeled: true, invalid: true } : img
      )
    );

    // Show feedback animation
    setShowSaveAnimation(true);
    setTimeout(() => setShowSaveAnimation(false), 800); // Reduced from 1500ms

    // Perform API call in background
    try {
      const response = await fetch(`${API_BASE_URL}/api/labels/${batchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          image_name: images[currentImageIndex].name,
          label_text: 'INVALID',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark image as invalid');
      }

    } catch (error) {
      console.error('Error marking image as invalid:', error);
      // Consider adding error handling UI feedback here
    }
  };

  // Add back the handleKeyPress function
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleLabelSubmit();
    }
  };

  // Optimized navigation function
  const navigateImage = (direction) => {
    const newIndex =
      direction === 'next'
        ? Math.min(currentImageIndex + 1, images.length - 1)
        : Math.max(currentImageIndex - 1, 0);
        
    if (newIndex !== currentImageIndex) {
      setLoadingImage(true);
      setCurrentImageIndex(newIndex);
      setCurrentLabel(labels[images[newIndex]?.name]?.text === 'INVALID' ? '' : (labels[images[newIndex]?.name]?.text || ''));
      
      // If moving to next image and it's preloaded, reduce loading time
      if (direction === 'next' && nextImagePreloaded) {
        setTimeout(() => setLoadingImage(false), 50);
        setNextImagePreloaded(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const getImageUrl = (imageName) => {
    const token = localStorage.getItem('token');
    const batches = JSON.parse(localStorage.getItem('batches') || '[]');
    if (!token || batches.length === 0) return '';
    
    // Remove 'Bearer ' if it exists in the token
    const cleanToken = token.replace('Bearer ', '');
    // Use the user's batch instead of hardcoded 'batch1'
    const batchId = batches[0];
    return `${API_BASE_URL}/images/${batchId}/${imageName}?token=${cleanToken}`;
  };

  const handleImageError = () => {
    setImageError(true);
    setLoadingImage(false);
    console.error('Failed to load image:', images[currentImageIndex]?.name);
  };
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  // Check if all images are labeled
  useEffect(() => {
    if (images.length > 0 && completedCount === totalCount) {
      setShowCompletionMessage(true);
    } else {
      setShowCompletionMessage(false);
    }
  }, [images, completedCount, totalCount]);

  if (loading) {
    return (
      <ThemeProvider theme={customTheme}>
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
            Loading Annotation Workspace
          </Typography>
          <CircularProgress size={60} thickness={4} />
        </Box>
      </ThemeProvider>
    );
  }

  const drawer = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <ImageSearch sx={{ color: 'primary.main', mr: 0.5, fontSize: '1.1rem' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Images
          </Typography>
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
              Progress: {completedCount} of {totalCount}
            </Typography>
            <Chip 
              size="small" 
              label={`${Math.round(progress)}%`} 
              color="primary" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>
      </Box>
      
      <List dense sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
        {images.map((image, index) => (
          <Fade key={image.name} in={true} timeout={300} style={{ transitionDelay: `${index * 30}ms` }}>
            <ListItem
              button
              dense
              selected={index === currentImageIndex}
              onClick={() => {
                setCurrentImageIndex(index);
                setCurrentLabel(labels[image.name]?.text === 'INVALID' ? '' : (labels[image.name]?.text || ''));
                setLoadingImage(true);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                transition: 'all 0.2s',
                py: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
                '&:hover': {
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Badge 
                color={index === currentImageIndex ? "secondary" : "default"}
                variant="dot" 
                invisible={!image.labeled}
                sx={{ mr: 1 }}
              >
                <Avatar 
                  sx={{ 
                    width: 26, 
                    height: 26, 
                    bgcolor: image.invalid ? 'error.main' : (image.labeled ? 'success.main' : 'grey.300'),
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                >
                  {index + 1}
                </Avatar>
              </Badge>
              <ListItemText 
                primary={image.name}
                primaryTypographyProps={{
                  noWrap: true,
                  fontSize: '0.85rem',
                }}
              />
              {image.invalid ? (
                <ReportProblem color="error" sx={{ ml: 1, fontSize: '1rem' }} />
              ) : image.labeled ? (
                <CheckCircle color="success" sx={{ ml: 1, fontSize: '1rem' }} />
              ) : (
                <RadioButtonUnchecked sx={{ ml: 1, opacity: 0.5, fontSize: '1rem' }} />
              )}
            </ListItem>
          </Fade>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <AppBar 
          position="fixed" 
          elevation={0}
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.8), rgba(236, 72, 153, 0.6))',
            color: 'white',
          }}
        >
          <Toolbar variant="dense">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ImageSearch sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {APP_NAME}
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {images.length > 0 && (
                <Chip 
                  size="small"
                  color="secondary" 
                  variant="filled"
                  label={`Image ${currentImageIndex + 1}/${images.length}`}
                  sx={{ mr: 1, fontWeight: 500, height: 22 }}
                />
              )}
              
              <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton color="inherit" onClick={toggleDarkMode} size="small">
                  {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Toggle Image List">
                <IconButton 
                  onClick={() => setDrawerOpen(!drawerOpen)} 
                  color="inherit"
                  size="small"
                  sx={{ 
                    transition: 'transform 0.3s',
                    transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Logout">
                <IconButton onClick={handleLogout} color="inherit" size="small">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Add Completion Animation Overlay */}
        <Fade in={showCompletionMessage} timeout={800}>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.85)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
            >
              <EmojiEvents 
                sx={{ 
                  fontSize: 100, 
                  color: 'gold',
                  filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))',
                  mb: 2
                }} 
              />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Typography 
                variant="h4" 
                color="white" 
                sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center',
                  mb: 2,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                Congratulations!
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Typography 
                variant="h6" 
                color="white" 
                sx={{ 
                  textAlign: 'center', 
                  maxWidth: 600,
                  mb: 3,
                  opacity: 0.9
                }}
              >
                You've successfully completed all image annotations!
              </Typography>
            </motion.div>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mt: 2
            }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Paper
                  elevation={4}
                  sx={{
                    py: 2,
                    px: 4,
                    mb: 4,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 4, color: 'white' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
                        {totalCount}
                      </Typography>
                      <Typography variant="body2">
                        Total Images
                      </Typography>
                    </Box>
                    
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700, color: '#10B981' }}>
                        {validLabeledCount}
                      </Typography>
                      <Typography variant="body2">
                        Labeled
                      </Typography>
                    </Box>
                    
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700, color: '#EF4444' }}>
                        {invalidCount}
                      </Typography>
                      <Typography variant="body2">
                        Invalid
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/')}
                  startIcon={<Celebration />}
                  sx={{ 
                    px: 4, 
                    py: 1.2,
                    fontSize: '1rem',
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #4F46E5 0%, #EC4899 100%)',
                    boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)',
                    '&:hover': {
                      boxShadow: '0 10px 25px rgba(236, 72, 153, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Return to Dashboard
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Fade>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pt: 6, // Reduced space for AppBar
            pb: 1.5,
            px: { xs: 1, sm: 2 },
          }}
        >
          {images.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                flexGrow: 1,
                height: '100%'
              }}
            >
              <Paper
                elevation={darkMode ? 2 : 1}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                {/* Save animation overlay */}
                <Fade in={showSaveAnimation} timeout={200}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      zIndex: 10,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />
                    <Typography variant="h6" color="white">
                      Saved
                    </Typography>
                  </Box>
                </Fade>

                {/* Image Navigation Header */}
                <Box
                  sx={{
                    py: 1,
                    px: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Tooltip title="Previous Image">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={() => navigateImage('prev')}
                        disabled={currentImageIndex === 0}
                        size="small"
                      >
                        <KeyboardArrowLeft fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.85rem',
                    }}
                  >
                    {images[currentImageIndex].name}
                    {images[currentImageIndex].invalid ? (
                      <Tooltip title="Marked as Invalid">
                        <ReportProblem color="error" sx={{ fontSize: '0.85rem' }} />
                      </Tooltip>
                    ) : images[currentImageIndex].labeled ? (
                      <Tooltip title="Already Labeled">
                        <CheckCircle color="success" sx={{ fontSize: '0.85rem' }} />
                      </Tooltip>
                    ) : null}
                  </Typography>
                  
                  <Tooltip title="Next Image">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={() => navigateImage('next')}
                        disabled={currentImageIndex === images.length - 1}
                        size="small"
                      >
                        <KeyboardArrowRight fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                {/* Zoom controls */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 0.75, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  gap: 0.5
                }}>
                  <Tooltip title="Zoom Out (Ctrl+- or Mouse Wheel)">
                    <IconButton 
                      onClick={handleZoomOut} 
                      size="small" 
                      disabled={zoomLevel <= 50}
                      color="primary"
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover:not(:disabled)': { 
                          bgcolor: 'action.hover',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <ZoomOut fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Slider
                    value={zoomLevel}
                    onChange={(_, newValue) => {
                      // Update zoom level directly
                      setZoomLevel(newValue);
                    }}
                    min={50}
                    max={400}
                    step={5}
                    marks={[
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' },
                      { value: 300, label: '300%' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={x => `${x}%`}
                    sx={{ 
                      width: { xs: '120px', sm: '160px' }, 
                      mx: 1,
                      '& .MuiSlider-markLabel': {
                        fontSize: '0.7rem',
                      }
                    }}
                  />
                  
                  <Tooltip title="Zoom In (Ctrl++ or Mouse Wheel)">
                    <IconButton 
                      onClick={handleZoomIn} 
                      size="small" 
                      disabled={zoomLevel >= 400}
                      color="primary"
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover:not(:disabled)': { 
                          bgcolor: 'action.hover',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <ZoomIn fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Reset Zoom (Ctrl+0)">
                    <IconButton 
                      onClick={resetZoom} 
                      size="small" 
                      color="primary"
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <RestartAlt fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Chip
                    label={`${zoomLevel}%`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 0.5, minWidth: 48, height: 20, fontSize: '0.7rem' }}
                  />
                </Box>

                {/* Image Viewer Component */}
                <Box
                  ref={imageContainerRef}
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(250, 250, 250, 0.8)',
                    cursor: isDragging ? 'grabbing' : (zoomLevel > 100 ? 'grab' : 'default'),
                    userSelect: 'none',
                    height: { xs: '450px', sm: '500px', md: '600px', lg: '650px' }, // Increased heights
                    touchAction: 'none', // Disable browser touch actions
                    border: '2px solid',
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                    borderRadius: 2,
                    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.05)',
                    mt: 1,
                    mb: 1,
                    mx: { xs: 1, sm: 2 },
                    transition: 'border-color 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  {loadingImage && !imageError && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 5,
                      }}
                    >
                      <LinearProgress color="secondary" />
                    </Box>
                  )}
                  
                  {imageError ? (
                    <Box textAlign="center">
                      <WarningAmber sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                      <Typography color="error" variant="h6" gutterBottom>
                        Failed to load image
                      </Typography>
                      <Typography color="text.secondary">
                        Please check if the image exists and you have proper permissions.
                      </Typography>
                    </Box>
                  ) : (
                    <Fade in={!loadingImage} timeout={200}>
                      <Box
                        component="img"
                        ref={imageRef}
                        sx={{
                          transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel/100})`,
                          transformOrigin: 'center',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: 1,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                          opacity: loadingImage ? 0 : 1,
                          pointerEvents: 'auto',
                          willChange: 'transform',
                          transition: isDragging ? 'none' : 'opacity 0.2s ease',
                        }}
                        src={getImageUrl(images[currentImageIndex]?.name || '')}
                        alt="OCR Image"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        draggable="false"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      />
                    </Fade>
                  )}
                </Box>

                <Divider />

                {/* Redesigned Compact Action Area for 15-character inputs */}
                <Box sx={{ 
                  display: 'flex', 
                  p: { xs: 1.5, sm: 2 },
                  gap: 1.5,
                  alignItems: 'stretch',
                }}>
                  {/* Compact text input for 15 characters */}
                  <Box sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={500} color="primary">
                        Transcribed Text (Max 15 chars)
                      </Typography>
                      <Typography variant="caption" color={currentLabel.length > MAX_CHARS ? "error.main" : "text.secondary"}>
                        {currentLabel.length}/{MAX_CHARS}
                      </Typography>
                    </Box>
                    
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Enter text..."
                      value={currentLabel}
                      onChange={(e) => {
                        setCurrentLabel(e.target.value.toUpperCase());
                      }}
                      onKeyDown={handleKeyPress}
                      inputRef={textFieldRef}
                      error={currentLabel.length > MAX_CHARS}
                      helperText={currentLabel.length > MAX_CHARS ? "Text exceeds maximum length" : "Press Ctrl+Enter to save"}
                      InputProps={{
                        sx: { 
                          fontFamily: 'monospace',
                          fontSize: '22px',
                          fontWeight: 'bold',
                          letterSpacing: '0.05em',
                          py: 1,
                          px: 1.5,
                          height: '54px',
                          '& input': {
                            textAlign: 'center',
                            textTransform: 'uppercase'
                          }
                        }
                      }}
                      FormHelperTextProps={{
                        sx: {
                          textAlign: 'right',
                          mt: 0.5,
                          fontSize: '0.75rem'
                        }
                      }}
                      inputProps={{
                        style: {
                          textAlign: 'center',
                        }
                      }}
                    />
                    
                    {/* Navigation controls inline with text field */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mt: 1.5,
                      gap: 1,
                    }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<NavigateBefore />}
                        onClick={() => navigateImage('prev')}
                        disabled={currentImageIndex === 0}
                        sx={{ minWidth: '100px', py: 0.5 }}
                      >
                        Previous
                      </Button>
                      
                      <Box sx={{ flexGrow: 1 }} />
                      
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleMarkInvalid}
                        startIcon={<ErrorOutline />}
                        size="medium"
                        sx={{ 
                          py: 0.75,
                          px: 2,
                          fontWeight: 500,
                        }}
                      >
                        Mark Invalid
                      </Button>
                      
                      <Zoom in={true} timeout={400}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleLabelSubmit}
                          startIcon={<SaveIcon />}
                          size="medium"
                          disabled={currentLabel.length > MAX_CHARS}
                          sx={{ 
                            py: 0.75,
                            px: 2,
                            boxShadow: 2,
                            fontWeight: 600,
                            backgroundImage: 'linear-gradient(to right, #4F46E5, #EC4899)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundImage: 'linear-gradient(to right, #4338CA, #BE185D)',
                              transform: 'translateY(-1px)',
                              boxShadow: 3,
                            },
                          }}
                        >
                          Save & Next
                        </Button>
                      </Zoom>
                      
                      <Box sx={{ flexGrow: 1 }} />
                      
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<NavigateNext />}
                        onClick={() => navigateImage('next')}
                        disabled={currentImageIndex === images.length - 1}
                        sx={{ minWidth: '100px', py: 0.5 }}
                      >
                        Next
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
              
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                <Info fontSize="small" sx={{ mr: 0.5, color: 'info.main', fontSize: '1rem' }} />
                <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                  Total: {images.length} images | Labeled: {completedCount} | Invalid: {invalidCount} | Remaining: {totalCount - completedCount - invalidCount}
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2
            }}>
              <WarningAmber sx={{ fontSize: 60, color: 'warning.main' }} />
              <Typography variant="h6">No images available in this batch</Typography>
              <Button variant="outlined" onClick={() => router.push('/')}>
                Return to Dashboard
              </Button>
            </Box>
          )}
        </Box>

        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          anchor="right"
          open={drawerOpen}
          onClose={() => isMobile && setDrawerOpen(false)}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderLeft: 1,
              borderColor: 'divider',
            },
          }}
        >
          <Toolbar variant="dense" /> {/* Space for AppBar */}
          <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <ImageSearch sx={{ color: 'primary.main', mr: 0.5, fontSize: '1.1rem' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Images
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                    Progress: {completedCount} of {totalCount}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={`${Math.round(progress)}%`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            </Box>
            
            <List dense sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
              {images.map((image, index) => (
                <Fade key={image.name} in={true} timeout={300} style={{ transitionDelay: `${index * 30}ms` }}>
                  <ListItem
                    button
                    dense
                    selected={index === currentImageIndex}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setCurrentLabel(labels[image.name]?.text === 'INVALID' ? '' : (labels[image.name]?.text || ''));
                      setLoadingImage(true);
                    }}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      transition: 'all 0.2s',
                      py: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                      '&:hover': {
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Badge 
                      color={index === currentImageIndex ? "secondary" : "default"}
                      variant="dot" 
                      invisible={!image.labeled}
                      sx={{ mr: 1 }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 26, 
                          height: 26, 
                          bgcolor: image.invalid ? 'error.main' : (image.labeled ? 'success.main' : 'grey.300'),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </Badge>
                    <ListItemText 
                      primary={image.name}
                      primaryTypographyProps={{
                        noWrap: true,
                        fontSize: '0.85rem',
                      }}
                    />
                    {image.invalid ? (
                      <ReportProblem color="error" sx={{ ml: 1, fontSize: '1rem' }} />
                    ) : image.labeled ? (
                      <CheckCircle color="success" sx={{ ml: 1, fontSize: '1rem' }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ ml: 1, opacity: 0.5, fontSize: '1rem' }} />
                    )}
                  </ListItem>
                </Fade>
              ))}
            </List>
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
} 