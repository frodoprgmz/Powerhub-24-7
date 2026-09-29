const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const passesRoutes = require('./routes/passes');
const lockRoutes = require('./routes/lock');
const usersRoutes = require('./routes/users');

const app = express();
app.use(express.json());
app.use(cors());

// Add a placeholder to check status
app.get('/api/status', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/passes', passesRoutes);
app.use('/api/lock', lockRoutes);
app.use('/api/users', usersRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
