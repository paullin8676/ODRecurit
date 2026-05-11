
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('./User');
const BusinessLine = require('./BusinessLine');
const ExamPaper = require('./ExamPaper');
const Candidate = require('./Candidate');
const CandidateStage = require('./CandidateStage');
const Exam = require('./Exam');
const Test = require('./Test');
const Interview = require('./Interview');
const InterviewRound = require('./InterviewRound');
const Employee = require('./Employee');
const StageConfig = require('./StageConfig')(sequelize);

User.hasMany(User, { as: 'subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

// Consultant association (now in CandidateStage)
User.hasMany(CandidateStage, { as: 'managedCandidateStages', foreignKey: 'consultantId' });
CandidateStage.belongsTo(User, { as: 'consultant', foreignKey: 'consultantId' });

// New associations for Exam, Test, Interview models
Candidate.hasOne(Exam, { foreignKey: 'candidateId' });
Exam.belongsTo(Candidate, { foreignKey: 'candidateId' });

Candidate.hasOne(Test, { foreignKey: 'candidateId' });
Test.belongsTo(Candidate, { foreignKey: 'candidateId' });

// Interview and Candidate direct association
Candidate.hasMany(Interview, { foreignKey: 'candidateId' });
Interview.belongsTo(Candidate, { foreignKey: 'candidateId', as: 'Candidate' });

// Interview and BusinessLine association
BusinessLine.hasMany(Interview, { foreignKey: 'businessLineId' });
Interview.belongsTo(BusinessLine, { foreignKey: 'businessLineId', as: 'BusinessLine' });

// Interview and InterviewRound associations
Interview.hasMany(InterviewRound, { foreignKey: 'interviewId', as: 'rounds' });
InterviewRound.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

// ExamPaper association with Exam
ExamPaper.hasMany(Exam, { foreignKey: 'examPaperId' });
Exam.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

// Candidate and User association (last operator)
Candidate.belongsTo(User, { foreignKey: 'lastOperatorId', as: 'lastOperator' });
User.hasMany(Candidate, { foreignKey: 'lastOperatorId', as: 'operatedCandidates' });

// CandidateStage associations
Candidate.hasOne(CandidateStage, { foreignKey: 'candidateId' });
CandidateStage.belongsTo(Candidate, { foreignKey: 'candidateId' });
User.hasMany(CandidateStage, { foreignKey: 'updatedBy' });
CandidateStage.belongsTo(User, { foreignKey: 'updatedBy', as: 'updatedByUser' });

// Employee and BusinessLine association
Employee.belongsTo(BusinessLine, { foreignKey: 'businessLineId', as: 'businessLine' });
BusinessLine.hasMany(Employee, { foreignKey: 'businessLineId' });

// Candidate to Employee association (when candidate enters employee management)
Candidate.hasMany(Employee, { foreignKey: 'candidateId' });
Employee.belongsTo(Candidate, { foreignKey: 'candidateId' });

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

    // Create manager user Crystal if not exists
    let aminUser = await User.findOne({ where: { username: 'Crystal' } });
    if (!aminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      aminUser = await User.create({
        username: 'Crystal',
        password: hashedPassword,
        role: 'manager',
        realName: 'Crystal',
        email: 'crystal@example.com',
        phone: '13800138001',
        managerId: adminUser.id, // Set Crystal's manager to admin
        isActive: true
      });
      console.log('Manager user Crystal created');
    } else {
      console.log('Manager user Crystal already exists');
    }

    // Get Crystal's ID
    const amin = await User.findOne({ where: { username: 'Crystal' } });
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

  // Initialize StageConfig (only if not exists)
  try {
    const existingCount = await StageConfig.count();
    if (existingCount === 0) {
      const stageConfigs = [
        {
          module: 'candidate_entry',
          stages: ['candidate_entry'],
          stageNames: {
            candidate_entry: '候选录入'
          }
        },
        {
          module: 'exam_management',
          stages: ['exam_declare', 'exam_complete'],
          stageNames: {
            exam_declare: '机考申报',
            exam_complete: '机考完成'
          }
        },
        {
          module: 'test_management',
          stages: ['test_declare', 'test_complete'],
          stageNames: {
            test_declare: '韧测申报',
            test_complete: '韧测完成'
          }
        },
        {
          module: 'interview_management',
          stages: ['recommend_interview', 'qualification_interview', 'tech_interview_1', 'tech_interview_2', 'manager_interview', 'approval', 'offer', 'pending_onboarding'],
          stageNames: {
            recommend_interview: '推荐面试',
            qualification_interview: '资面安排',
            tech_interview_1: '技术面试(一)',
            tech_interview_2: '技术面试(二)',
            manager_interview: '主管面试',
            approval: '租用审批',
            offer: 'Offer',
            pending_onboarding: '待入职'
          }
        },
        {
          module: 'employee_management',
          stages: ['pending_onboarding', 'entry', 'leave'],
          stageNames: {
            pending_onboarding: '待入职',
            entry: '入职',
            leave: '离职'
          }
        }
      ];

      for (const config of stageConfigs) {
        await StageConfig.create(config);
      }
      console.log('Stage configs initialized');
    } else {
      console.log('Stage configs already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Error creating stage configs:', error);
  }
};

module.exports = {
  sequelize,
  User,
  BusinessLine,
  ExamPaper,
  Candidate,
  CandidateStage,
  Exam,
  Test,
  Interview,
  InterviewRound,
  Employee,
  StageConfig,
  initDatabase
};

