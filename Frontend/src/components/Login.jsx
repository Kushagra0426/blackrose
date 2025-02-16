import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Alert as MuiAlert // Renamed to avoid conflict
} from '@mui/material';
import { setCredentials } from '../store/authSlice';
import api from '../api/axios';

const Login = () => {
  const [credentials, setCredentialsState] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', credentials);
      dispatch(setCredentials({
        token: response.data.token,
        user: credentials.username
      }));
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center">
          Dashboard Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            autoFocus
            value={credentials.username}
            onChange={(e) => setCredentialsState(prev => ({
              ...prev,
              username: e.target.value
            }))}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentialsState(prev => ({
              ...prev,
              password: e.target.value
            }))}
          />
          {error && (
            <MuiAlert severity="error" sx={{ mt: 2 }}>
              {error}
            </MuiAlert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;