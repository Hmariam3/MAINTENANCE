require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const apiRoutes = require('./routes/apiRoutes');
const pmRoutes = require('./routes/pmRoutes');

// Basic health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.$queryRawUnsafe('SELECT NOW()');
    res.json({ status: 'ok', db_time: result[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Use API routes
app.use('/api', apiRoutes);
app.use('/api/pm', pmRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
