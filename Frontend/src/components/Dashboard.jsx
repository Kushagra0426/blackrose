import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Paper, Typography, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Snackbar, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, WidthFull } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../api/axios';
import Constants from '../Constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [randomNumbers, setRandomNumbers] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [formData, setFormData] = useState({
    user: '',
    broker: '',
    'API key': '',
    'API secret': '',
    pnl: '',
    margin: '',
    max_risk: ''
  });
  const ws = useRef(null);

  const ws_url = Constants.WEB_SOCKET_URL;

  const handleSessionExpired = () => {
    setShowSessionExpiredModal(true);
    // Close WebSocket connection when session expires
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
  };

  const handleApiError = (error) => {
    if (error.response?.status === 401 || error.response?.data?.message === 'Invalid token') {
      handleSessionExpired();
    } else {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  useEffect(() => {
    fetchCsvData();
    setupWebSocket();

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const setupWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      handleSessionExpired();
      console.error('No token found');
      return;
    }

    const wsUrl = `${ws_url}/stream?token=${token}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error === 'Invalid token') {
          handleSessionExpired();
          return;
        }
        setRandomNumbers(prev => [...prev.slice(-19), data]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };
  };

  const fetchCsvData = async () => {
    try {
      const response = await api.get('/fetch_csv');
      setCsvData(response.data);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleCrudOperation = async (operation, data) => {
    try {
      await api.post('/crud', {
        operation,
        data
      });
      fetchCsvData();
      setSuccess('Operation successful');
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      handleApiError(error);
    }
  };

  const resetForm = () => {
    setFormData({
      user: '',
      broker: '',
      'API key': '',
      'API secret': '',
      pnl: '',
      margin: '',
      max_risk: ''
    });
    setCurrentRecord(null);
  };

  const chartData = {
    labels: randomNumbers.map(n => new Date(n.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Random Numbers',
      data: randomNumbers.map(n => n.value),
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        display: true,
        grid: {
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
        border: {
          display: true
        }
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        max: 100,
        grid: {
          drawBorder: true,
          drawOnChartArea: true,
        },
        border: {
          display: true
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 40,
          padding: 20
        }
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 20
      }
    }
  };

  const handleDialogOpen = (record = null) => {
    if (record) {
      setFormData(record);
    } else {
      resetForm();
    }
    setCurrentRecord(record);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRecovery = async() => {
    try{
      const response = await api.post('/recover');
      fetchCsvData();
      setSuccess('Successfully recovered data!');
    } catch (error) {
      handleApiError(error);
    }
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
              <Typography component="h2" variant="h6" gutterBottom>
                Real-time Random Numbers
              </Typography>
              <Line data={chartData} options={chartOptions} />
            </Paper>
          </Grid>

          {/* CSV Data Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography component="h2" variant="h6" gutterBottom>
                Trading Data
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mb: 2 }}
                onClick={() => {
                  handleDialogOpen();
                }}
              >
                Add New Record
              </Button>
              <Button 
                variant="contained" 
                sx={{ mb: 2, ml: 2 }}
                onClick={() => {
                  handleRecovery();
                }}
              >
                Recover Data
              </Button>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Broker</TableCell>
                      <TableCell>API Key</TableCell>
                      <TableCell>API Secret</TableCell>
                      <TableCell>PNL</TableCell>
                      <TableCell>Margin</TableCell>
                      <TableCell>Max Risk</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvData
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow key={row.user}>
                          <TableCell>{row.user}</TableCell>
                          <TableCell>{row.broker}</TableCell>
                          <TableCell>{row['API key']}</TableCell>
                          <TableCell>{row['API secret']}</TableCell>
                          <TableCell>{row.pnl}</TableCell>
                          <TableCell>{row.margin}</TableCell>
                          <TableCell>{row.max_risk}</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => {
                                handleDialogOpen(row);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleCrudOperation('delete', { user: row.user })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={csvData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          </Grid>
        </Grid>

        <Dialog 
          open={showSessionExpiredModal}
          disableEscapeKeyDown
          disableBackdropClick
          aria-labelledby="session-expired-dialog"
        >
          <DialogTitle id="session-expired-dialog">
            Session Expired
          </DialogTitle>
          <DialogContent>
            <Typography>
              Your session has expired. Please login again.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/login')}
              fullWidth
            >
              Go to Login
            </Button>
          </DialogActions>
        </Dialog>

        {/* CRUD Dialog */}
        <Dialog open={openDialog} onClose={handleDialogClose}>
          <DialogTitle>
            {currentRecord ? 'Edit Record' : 'Add New Record'}
          </DialogTitle>
          <DialogContent>
          <TextField
              autoFocus
              margin="dense"
              name="user"
              label="User"
              fullWidth
              value={formData.user}
              onChange={handleInputChange}
              disabled={!!currentRecord}
            />
            <TextField
              margin="dense"
              name="broker"
              label="Broker"
              fullWidth
              value={formData.broker}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="API key"
              label="API Key"
              fullWidth
              value={formData['API key']}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="API secret"
              label="API Secret"
              fullWidth
              value={formData['API secret']}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="pnl"
              label="PNL"
              fullWidth
              type="number"
              value={formData.pnl}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="margin"
              label="Margin"
              fullWidth
              type="number"
              value={formData.margin}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="max_risk"
              label="Max Risk"
              fullWidth
              type="number"
              value={formData.max_risk}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={() => handleCrudOperation(currentRecord ? 'update' : 'create', formData)}>
              {currentRecord ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Snackbar 
        open={!!error || !!success} 
        autoHideDuration={6000} 
        onClose={() => {
          setError('');
          setSuccess('');
        }}
      >
        <Alert 
          severity={error ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard;