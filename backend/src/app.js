require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const businessLineRoutes = require('./routes/businessLine');
const examPaperRoutes = require('./routes/examPaper');
const candidateRoutes = require('./routes/candidate');
const employeeRoutes = require('./routes/employee');
const examRoutes = require('./routes/exam');
const testRoutes = require('./routes/test');
const interviewRoutes = require('./routes/interview');
const statisticsRoutes = require('./routes/statistics');
const stageConfigRoutes = require('./routes/stageConfig');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/business-lines', businessLineRoutes);
app.use('/api/exam-papers', examPaperRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/stage-configs', stageConfigRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
