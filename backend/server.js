require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Neon Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test Database Connection
pool.on('connect', () => {
  console.log('✅ Connected to Neon Database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// ==================== API Routes ====================

// 1. Test Connection
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'API connected successfully!',
      databaseTime: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 2. Get All Reservations
app.get('/api/reservations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Create New Reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const { customer_name, email, phone, date, time, guests, table_id } = req.body;
    const result = await pool.query(
      `INSERT INTO reservations (customer_name, email, phone, date, time, guests, table_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [customer_name, email, phone, date, time, guests, table_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get Single Reservation
app.get('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Update Reservation
app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, email, phone, date, time, guests, table_id, status } = req.body;
    const result = await pool.query(
      `UPDATE reservations 
       SET customer_name = $1, email = $2, phone = $3, date = $4, time = $5, 
           guests = $6, table_id = $7, status = $8, updated_at = NOW()
       WHERE id = $9 
       RETURNING *`,
      [customer_name, email, phone, date, time, guests, table_id, status, id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Delete Reservation
app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reservations WHERE id = $1', [id]);
    res.json({ success: true, message: 'Reservation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   GET    /api/test             - Test connection`);
  console.log(`   GET    /api/reservations     - Get all reservations`);
  console.log(`   POST   /api/reservations     - Create reservation`);
  console.log(`   GET    /api/reservations/:id - Get single reservation`);
  console.log(`   PUT    /api/reservations/:id - Update reservation`);
  console.log(`   DELETE /api/reservations/:id - Delete reservation\n`);
});
