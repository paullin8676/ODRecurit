const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('./User');
const { ProductLine, ProductLineUser } = require('./ProductLine');
const ExamPaper = require('./ExamPaper');
const TestType = require('./TestType');
const ExamPassLine = require('./ExamPassLine');
const Candidate = require('./Candidate');
const CandidateProductLine = require('./CandidateProductLine');
const Exam = require('./Exam');
const Test = require('./Test');
const Interview = require('./Interview');
const InterviewRound = require('./InterviewRound');
const ExamStage = require('./ExamStage');
const Employee = require('./Employee');
const StageConfig = require('./StageConfig')(sequelize);

User.hasMany(User, { as: 'subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

// ProductLine and User many-to-many association (already defined in ProductLine model)

// Candidate and ProductLine many-to-many association
Candidate.belongsToMany(ProductLine, {
  through: CandidateProductLine,
  as: 'productLines',
  foreignKey: 'candidateId',
  otherKey: 'productLineId'
});

ProductLine.belongsToMany(Candidate, {
  through: CandidateProductLine,
  as: 'candidates',
  foreignKey: 'productLineId',
  otherKey: 'candidateId'
});

// CandidateProductLine additional associations
CandidateProductLine.belongsTo(Candidate, { foreignKey: 'candidateId' });
CandidateProductLine.belongsTo(ProductLine, { foreignKey: 'productLineId' });

ExamPaper.hasMany(ExamPassLine, { foreignKey: 'examPaperId' });
ExamPassLine.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

// Candidate associations
Candidate.hasMany(ExamStage, { foreignKey: 'candidateId' });
ExamStage.belongsTo(Candidate, { foreignKey: 'candidateId' });

// Consultant association
User.hasMany(Candidate, { as: 'candidates', foreignKey: 'consultantId' });
Candidate.belongsTo(User, { as: 'consultant', foreignKey: 'consultantId' });

// New associations for Exam, Test, Interview models
Candidate.hasOne(Exam, { foreignKey: 'candidateId' });
Exam.belongsTo(Candidate, { foreignKey: 'candidateId' });

Candidate.hasOne(Test, { foreignKey: 'candidateId' });
Test.belongsTo(Candidate, { foreignKey: 'candidateId' });

// CandidateProductLine association with Interview
CandidateProductLine.hasOne(Interview, { foreignKey: 'candidateProductLineId' });
Interview.belongsTo(CandidateProductLine, { foreignKey: 'candidateProductLineId', as: 'candidateProductLine' });

// Interview and InterviewRound associations
Interview.hasMany(InterviewRound, { foreignKey: 'interviewId', as: 'rounds' });
InterviewRound.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

// ExamPaper association with Exam
ExamPaper.hasMany(Exam, { foreignKey: 'examPaperId' });
Exam.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

// TestType association with Test
TestType.hasMany(Test, { foreignKey: 'testTypeId' });
Test.belongsTo(TestType, { foreignKey: 'testTypeId' });

// Candidate and User association (last operator)
Candidate.belongsTo(User, { foreignKey: 'lastOperatorId', as: 'lastOperator' });
User.hasMany(Candidate, { foreignKey: 'lastOperatorId', as: 'operatedCandidates' });

// Employee and User association (last operator)
Employee.belongsTo(User, { foreignKey: 'lastOperatorId', as: 'lastOperator' });
User.hasMany(Employee, { foreignKey: 'lastOperatorId', as: 'operatedEmployees' });

// Employee and ProductLine association
Employee.belongsTo(ProductLine, { foreignKey: 'productLineId', as: 'productLine' });
ProductLine.hasMany(Employee, { foreignKey: 'productLineId' });

// Candidate to Employee association (when candidate enters employee management)
Candidate.hasMany(Employee, { foreignKey: 'candidateId' });
Employee.belongsTo(Candidate, { foreignKey: 'candidateId' });

// ExamPaper association with ExamStage
// ExamPaper.hasMany(ExamStage, { foreignKey: 'examPaperId' });
// ExamStage.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

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
    console.log('Stage configs recreated');
  } catch (error) {
    console.error('Error creating stage configs:', error);
  }
};

module.exports = {
  sequelize,
  User,
  ProductLine,
  ProductLineUser,
  ExamPaper,
  TestType,
  ExamPassLine,
  Candidate,
  CandidateProductLine,
  Exam,
  Test,
  Interview,
  InterviewRound,
  ExamStage,
  Employee,
  StageConfig,
  initDatabase
};
