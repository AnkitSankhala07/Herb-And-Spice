import io from 'socket.io-client';
import axios from 'axios';

// Use the current hostname so it works from both localhost AND phone (via IP)
const HOST = window.location.hostname;
const SOCKET_URL = `http://${HOST}:5000`;
const API_URL = `http://${HOST}:5000/api`;

// Robust Socket.IO config — prevents auto-disconnect on phones / unstable WiFi
export const socket = io(SOCKET_URL, {
    reconnection: true,           // auto-reconnect on drop
    reconnectionAttempts: Infinity,// never stop trying
    reconnectionDelay: 1000,      // start with 1s delay
    reconnectionDelayMax: 5000,   // max 5s between retries
    timeout: 20000,               // 20s connection timeout (generous for mobile)
    transports: ['websocket', 'polling'], // prefer WS, fall back to polling
    upgrade: true,                // allow transport upgrade
    forceNew: false,              // reuse existing connection
});

// Connection lifecycle logging (helps debug on phone)
socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
});
socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket disconnected:', reason);
    // If the server closed the connection, manually reconnect
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});
socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Reconnected after ${attemptNumber} attempt(s)`);
});
socket.on('reconnect_error', (error) => {
    console.warn('🔴 Reconnect error:', error.message);
});
socket.on('connect_error', (error) => {
    console.warn('🔴 Connection error:', error.message);
});

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getMenu = async () => {
    const response = await api.get('/menu');
    return response.data;
};

export const placeOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const getKitchenOrders = async () => {
    const response = await api.get('/orders');
    return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
};

export const markTablePaid = async (tableId, paymentMode = 'Cash') => {
    const response = await api.put(`/orders/table/${tableId}/mark-paid`, { paymentMode });
    return response.data;
};

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

export const getTables = async () => {
    const response = await api.get('/tables');
    return response.data;
};

export const addTable = async (tableData) => {
    const response = await api.post('/tables', tableData);
    return response.data;
};

export const updateTable = async (id, tableData) => {
    const response = await api.patch(`/tables/${id}`, tableData);
    return response.data;
};

export const deleteTable = async (id) => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
};

// ── QR Code APIs ──
export const getTableQR = async (tableId) => {
    const response = await api.get(`/qr/${tableId}`);
    return response.data;
};

export const getAllTableQRs = async () => {
    const response = await api.get('/qr/all');
    return response.data;
};

export const downloadQRPdf = () => {
    // Direct browser download — open in new tab to trigger PDF download
    return `${API_URL}/qr/download-pdf`;
};
