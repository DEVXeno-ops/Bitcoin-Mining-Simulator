// src/server.js
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', apiRoutes);

// เสิร์ฟ index.html สำหรับเส้นทางหลัก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// จัดการ 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found on this server' });
});

// จัดการข้อผิดพลาดทั่วไป
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));