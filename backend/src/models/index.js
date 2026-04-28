const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('./User');
const ProductLine = require('./ProductLine');
const ExamPaper = require('./ExamPaper');
const TestType = require('./TestType');
const ExamPassLine = require('./ExamPassLine');
const Candidate = require('./Candidate');
const CandidateProductLine = require('./CandidateProductLine');
const Exam = require('./Exam');
const Test = require('./Test');
const Interview = require('./Interview');
const ExamStage = require('./ExamStage');
const InterviewStage = require('./InterviewStage');
const StageConfig = require('./StageConfig')(sequelize);

User.hasMany(User, { as: 'subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

// ProductLine and User many-to-many association (already defined in ProductLine model)

// Candidate and ProductLine many-to-many association (defined in CandidateProductLine model)

ExamPaper.hasMany(ExamPassLine, { foreignKey: 'examPaperId' });
ExamPassLine.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

// Candidate associations
Candidate.hasMany(ExamStage, { foreignKey: 'candidateId' });
ExamStage.belongsTo(Candidate, { foreignKey: 'candidateId' });

Candidate.hasMany(InterviewStage, { foreignKey: 'candidateId' });
InterviewStage.belongsTo(Candidate, { foreignKey: 'candidateId' });

// New associations for Exam, Test, Interview models
Candidate.hasOne(Exam, { foreignKey: 'candidateId' });
Exam.belongsTo(Candidate, { foreignKey: 'candidateId' });

Candidate.hasOne(Test, { foreignKey: 'candidateId' });
Test.belongsTo(Candidate, { foreignKey: 'candidateId' });

// CandidateProductLine association with Interview
CandidateProductLine.hasOne(Interview, { foreignKey: 'candidateProductLineId' });
Interview.belongsTo(CandidateProductLine, { foreignKey: 'candidateProductLineId', as: 'candidateProductLine' });

// ExamPaper association with Exam
ExamPaper.hasMany(Exam, { foreignKey: 'examPaperId' });
Exam.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

// TestType association with Test
TestType.hasMany(Test, { foreignKey: 'testTypeId' });
Test.belongsTo(TestType, { foreignKey: 'testTypeId' });

// Candidate and User association (last operator)
Candidate.belongsTo(User, { foreignKey: 'lastOperatorId', as: 'lastOperator' });
User.hasMany(Candidate, { foreignKey: 'lastOperatorId', as: 'operatedCandidates' });

// ExamPaper association with ExamStage
// ExamPaper.hasMany(ExamStage, { foreignKey: 'examPaperId' });
// ExamStage.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

// User association with InterviewStage (as interviewer)
User.hasMany(InterviewStage, { foreignKey: 'interviewerId', as: 'interviews' });
InterviewStage.belongsTo(User, { foreignKey: 'interviewerId', as: 'interviewer' });

// ProductLine association with InterviewStage
ProductLine.hasMany(InterviewStage, { foreignKey: 'productLineId', as: 'interviewStages' });
InterviewStage.belongsTo(ProductLine, { foreignKey: 'productLineId', as: 'productLine' });

const initDatabase = async () => {
  await sequelize.sync({ force: false, alter: false });
  console.log('Database synchronized');
  
  // Create default admin user if not exists
  try {
    let adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'manager',
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        isActive: true
      });
      console.log('Default admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Create manager user Amin if not exists
    let aminUser = await User.findOne({ where: { username: 'Amin' } });
    if (!aminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      aminUser = await User.create({
        username: 'Amin',
        password: hashedPassword,
        role: 'manager',
        realName: 'Amin',
        email: 'amin@example.com',
        phone: '13800138001',
        managerId: adminUser.id, // Set Amin's manager to admin
        isActive: true
      });
      console.log('Manager user Amin created');
    } else {
      console.log('Manager user Amin already exists');
    }

    // Get Amin's ID
    const amin = await User.findOne({ where: { username: 'Amin' } });
    if (amin) {
      // Create consultant user Lisa if not exists
      const lisaUser = await User.findOne({ where: { username: 'Lisa' } });
      if (!lisaUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          username: 'Lisa',
          password: hashedPassword,
          role: 'consultant',
          realName: 'Lisa',
          email: 'lisa@example.com',
          phone: '13800138002',
          managerId: amin.id,
          isActive: true
        });
        console.log('Consultant user Lisa created');
      } else {
        console.log('Consultant user Lisa already exists');
      }

      // Create consultant user Lin if not exists
      const linUser = await User.findOne({ where: { username: 'Lin' } });
      if (!linUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          username: 'Lin',
          password: hashedPassword,
          role: 'consultant',
          realName: 'Lin',
          email: 'lin@example.com',
          phone: '13800138003',
          managerId: amin.id,
          isActive: true
        });
        console.log('Consultant user Lin created');
      } else {
        console.log('Consultant user Lin already exists');
      }
    }
  } catch (error) {
    console.error('Error creating users:', error);
  }

  // Initialize StageConfig (force recreate)
  try {
    // Delete existing stage configs
    await StageConfig.destroy({ where: {} });
    
    const stageConfigs = [
      {
        module: 'candidate_entry',
        stages: ['employee_entry']
      },
      {
        module: 'exam_management',
        stages: ['exam_declare', 'exam_complete']
      },
      {
        module: 'test_management',
        stages: ['test_declare', 'test_complete']
      },
      {
        module: 'interview_management',
        stages: ['recommend_interview', 'qualification_interview', 'tech_interview_1', 'tech_interview_2', 'manager_interview', 'approval', 'offer']
      },
      {
        module: 'employee_management',
        stages: ['entry', 'leave']
      }
    ];

    for (const config of stageConfigs) {
      await StageConfig.create(config);
    }
    console.log('Stage configs recreated');
  } catch (error) {
    console.error('Error creating stage configs:', error);
  }
};

module.exports = {
  sequelize,
  User,
  ProductLine,
  ExamPaper,
  TestType,
  ExamPassLine,
  Candidate,
  CandidateProductLine,
  Exam,
  Test,
  Interview,
  ExamStage,
  InterviewStage,
  StageConfig,
  initDatabase
};
