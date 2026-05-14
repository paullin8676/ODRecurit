const express = require('express');
const cors = require('cors');
const { initDatabase, User, Role, UserRole } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ 
      where: { username },
      include: [{
        model: Role,
        through: UserRole,
        as: 'Roles'
      }]
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await user.update({ lastLoginAt: new Date() });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const roles = user.Roles ? user.Roles.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      level: r.level,
      dataScope: r.dataScope
    })) : [];

    res.json({ 
      message: 'Login successful', 
      token, 
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roles
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const startServer = async () => {
  try {
    console.log('Starting server...');
    await initDatabase();
    console.log('Database initialized successfully');
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
    server.on('close', () => {
      console.log('Server closed');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();