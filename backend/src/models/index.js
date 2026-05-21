const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('./User');
const BusinessLine = require('./BusinessLine');
const ExamPaper = require('./ExamPaper');
const Candidate = require('./Candidate');
const CandidateStage = require('./CandidateStage');
const CandidateStageTimeline = require('./CandidateStageTimeline');
const Exam = require('./Exam');
const Test = require('./Test');
const Interview = require('./Interview');
const InterviewRound = require('./InterviewRound');
const Employee = require('./Employee');
const StageConfig = require('./StageConfig')(sequelize);
const Role = require('./Role');
const Permission = require('./Permission');
const UserRole = require('./UserRole');
const RolePermission = require('./RolePermission');

User.hasMany(User, { as: 'subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId' });

Permission.hasMany(Permission, { as: 'children', foreignKey: 'parentId' });
Permission.belongsTo(Permission, { as: 'parent', foreignKey: 'parentId' });

User.hasMany(CandidateStage, { as: 'managedCandidateStages', foreignKey: 'consultantId' });
CandidateStage.belongsTo(User, { as: 'consultant', foreignKey: 'consultantId' });

Candidate.hasOne(Exam, { foreignKey: 'candidateId' });
Exam.belongsTo(Candidate, { foreignKey: 'candidateId' });

Candidate.hasOne(Test, { foreignKey: 'candidateId' });
Test.belongsTo(Candidate, { foreignKey: 'candidateId' });

Candidate.hasMany(Interview, { foreignKey: 'candidateId' });
Interview.belongsTo(Candidate, { foreignKey: 'candidateId', as: 'Candidate' });

BusinessLine.hasMany(Interview, { foreignKey: 'businessLineId' });
Interview.belongsTo(BusinessLine, { foreignKey: 'businessLineId', as: 'BusinessLine' });

Interview.hasMany(InterviewRound, { foreignKey: 'interviewId', as: 'rounds' });
InterviewRound.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

ExamPaper.hasMany(Exam, { foreignKey: 'examPaperId' });
Exam.belongsTo(ExamPaper, { foreignKey: 'examPaperId' });

Candidate.belongsTo(User, { foreignKey: 'lastOperatorId', as: 'lastOperator' });
User.hasMany(Candidate, { foreignKey: 'lastOperatorId', as: 'operatedCandidates' });

Candidate.hasOne(CandidateStage, { foreignKey: 'candidateId' });
CandidateStage.belongsTo(Candidate, { foreignKey: 'candidateId' });
User.hasMany(CandidateStage, { foreignKey: 'updatedBy' });
CandidateStage.belongsTo(User, { foreignKey: 'updatedBy', as: 'updatedByUser' });

Candidate.hasMany(CandidateStageTimeline, { foreignKey: 'candidateId' });
CandidateStageTimeline.belongsTo(Candidate, { foreignKey: 'candidateId' });

Employee.belongsTo(BusinessLine, { foreignKey: 'businessLineId', as: 'businessLine' });
BusinessLine.hasMany(Employee, { foreignKey: 'businessLineId' });

Candidate.hasMany(Employee, { foreignKey: 'candidateId' });
Employee.belongsTo(Candidate, { foreignKey: 'candidateId' });

const initDatabase = async () => {
  await sequelize.sync({ force: false, alter: false });
  console.log('Database synchronized');

  await initRoles();
  await initPermissions();
  await initRolePermissions();
  await initUsers();
  await initStageConfigs();
};

const initRoles = async () => {
  const roles = [
    { name: '顾问', code: 'consultant', level: 1, dataScope: 'self', description: '只能看到自己录入的候选人' },
    { name: '主管', code: 'supervisor', level: 2, dataScope: 'subordinate', description: '能看到自己和下属顾问的数据' },
    { name: '经理', code: 'manager', level: 3, dataScope: 'subordinate', description: '能看到自己和下属主管、顾问的数据' },
    { name: '总监', code: 'director', level: 4, dataScope: 'subordinate', description: '能看到所有下级数据' },
    { name: '管理员', code: 'admin', level: 5, dataScope: 'global', description: '能看到所有数据，拥有全部权限' }
  ];

  for (const role of roles) {
    const existing = await Role.findOne({ where: { code: role.code } });
    if (!existing) {
      await Role.create(role);
      console.log(`Role ${role.name} created`);
    }
  }
  console.log('Roles initialized');
};

const initPermissions = async () => {
  const permissions = [
    { code: 'menu_dashboard', name: '仪表盘', type: 'menu', path: '/', icon: 'el-icon-home', sortOrder: 1 },
    { code: 'menu_candidates', name: '候选录入', type: 'menu', path: '/candidates', icon: 'el-icon-user-plus', sortOrder: 2 },
    { code: 'menu_exam', name: '机考管理', type: 'menu', path: '/exam-stage', icon: 'el-icon-edit', sortOrder: 3 },
    { code: 'menu_test', name: '韧测管理', type: 'menu', path: '/test-stage', icon: 'el-icon-bar-chart', sortOrder: 4 },
    { code: 'menu_interview', name: '面试管理', type: 'menu', path: '/interview-stage', icon: 'el-icon-suitcase', sortOrder: 5 },
    { code: 'menu_employee', name: '员工管理', type: 'menu', path: '/employee-management', icon: 'el-icon-users', sortOrder: 6 },
    { code: 'menu_users', name: '用户管理', type: 'menu', path: '/settings/users', icon: 'el-icon-user', sortOrder: 10 },
    { code: 'menu_business_lines', name: '业务配置', type: 'menu', path: '/settings/business-lines', icon: 'el-icon-office-building', sortOrder: 11 },
    { code: 'menu_exam_papers', name: '机考配置', type: 'menu', path: '/settings/exam-papers', icon: 'el-icon-file-text', sortOrder: 12 },
    { code: 'menu_stage_config', name: '阶段配置', type: 'menu', path: '/stage-config', icon: 'el-icon-setting', sortOrder: 13 },
    { code: 'menu_statistics', name: '统计报表', type: 'menu', path: '/statistics', icon: 'el-icon-pie-chart', sortOrder: 7 },
    { code: 'menu_statistics_data', name: '数据统计', type: 'menu', path: '/statistics', sortOrder: 71 },
    { code: 'menu_statistics_duration', name: '停留分析', type: 'menu', path: '/duration-analysis', sortOrder: 72 },
    { code: 'menu_statistics_records', name: '停留明细', type: 'menu', path: '/duration-records', sortOrder: 73 },
    { code: 'menu_role_management', name: '角色管理', type: 'menu', path: '/settings/roles', icon: 'el-icon-key', sortOrder: 14 },
    { code: 'menu_permission_management', name: '权限管理', type: 'menu', path: '/settings/permissions', icon: 'el-icon-lock', sortOrder: 15 },
    { code: 'btn_candidate_create', name: '创建候选人', type: 'button' },
    { code: 'btn_candidate_edit', name: '编辑候选人', type: 'button' },
    { code: 'btn_candidate_delete', name: '删除候选人', type: 'button' },
    { code: 'btn_candidate_advance', name: '推进阶段', type: 'button' },
    { code: 'btn_candidate_push_interview', name: '面推', type: 'button' },
    { code: 'btn_user_create', name: '创建用户', type: 'button' },
    { code: 'btn_user_edit', name: '编辑用户', type: 'button' },
    { code: 'btn_user_delete', name: '删除用户', type: 'button' },
    { code: 'btn_business_line_create', name: '创建业务线', type: 'button' },
    { code: 'btn_business_line_edit', name: '编辑业务线', type: 'button' },
    { code: 'btn_business_line_delete', name: '删除业务线', type: 'button' },
    { code: 'btn_role_create', name: '创建角色', type: 'button' },
    { code: 'btn_role_edit', name: '编辑角色', type: 'button' },
    { code: 'btn_role_delete', name: '删除角色', type: 'button' },
    { code: 'btn_permission_assign', name: '分配权限', type: 'button' },
    { code: 'btn_permission_create', name: '创建权限', type: 'button' },
    { code: 'btn_permission_edit', name: '编辑权限', type: 'button' },
    { code: 'btn_permission_delete', name: '删除权限', type: 'button' },
    { code: 'btn_exam_paper_create', name: '创建试卷', type: 'button' },
    { code: 'btn_exam_paper_edit', name: '编辑试卷', type: 'button' },
    { code: 'btn_exam_paper_delete', name: '删除试卷', type: 'button' }
  ];

  for (const perm of permissions) {
    const existing = await Permission.findOne({ where: { code: perm.code } });
    if (!existing) {
      await Permission.create(perm);
      console.log(`Permission ${perm.name} created`);
    }
  }
  console.log('Permissions initialized');
};

const initRolePermissions = async () => {
  const consultantRole = await Role.findOne({ where: { code: 'consultant' } });
  const supervisorRole = await Role.findOne({ where: { code: 'supervisor' } });
  const managerRole = await Role.findOne({ where: { code: 'manager' } });
  const directorRole = await Role.findOne({ where: { code: 'director' } });
  const adminRole = await Role.findOne({ where: { code: 'admin' } });

  const consultantPerms = ['menu_dashboard', 'menu_candidates', 'menu_exam', 'menu_test', 'menu_interview', 'menu_employee', 'menu_statistics', 'btn_candidate_create', 'btn_candidate_edit', 'btn_candidate_advance', 'btn_candidate_push_interview'];
  const supervisorPerms = [...consultantPerms, 'btn_candidate_delete'];
  const managerPerms = [...supervisorPerms, 'menu_users', 'menu_business_lines', 'menu_exam_papers', 'menu_stage_config', 'btn_user_create', 'btn_user_edit', 'btn_business_line_create', 'btn_business_line_edit', 'btn_exam_paper_create', 'btn_exam_paper_edit', 'btn_exam_paper_delete'];
  const directorPerms = [...managerPerms, 'btn_user_delete', 'btn_business_line_delete'];
  const adminPerms = ['menu_dashboard', 'menu_candidates', 'menu_exam', 'menu_test', 'menu_interview', 'menu_employee', 'menu_users', 'menu_business_lines', 'menu_exam_papers', 'menu_stage_config', 'menu_statistics', 'menu_role_management', 'menu_permission_management', 'btn_candidate_create', 'btn_candidate_edit', 'btn_candidate_delete', 'btn_candidate_advance', 'btn_candidate_push_interview', 'btn_user_create', 'btn_user_edit', 'btn_user_delete', 'btn_business_line_create', 'btn_business_line_edit', 'btn_business_line_delete', 'btn_role_create', 'btn_role_edit', 'btn_role_delete', 'btn_permission_assign', 'btn_permission_create', 'btn_permission_edit', 'btn_permission_delete', 'btn_exam_paper_create', 'btn_exam_paper_edit', 'btn_exam_paper_delete'];

  await assignPermissionsToRole(consultantRole, consultantPerms);
  await assignPermissionsToRole(supervisorRole, supervisorPerms);
  await assignPermissionsToRole(managerRole, managerPerms);
  await assignPermissionsToRole(directorRole, directorPerms);
  await assignPermissionsToRole(adminRole, adminPerms);

  console.log('Role permissions initialized');
};

const assignPermissionsToRole = async (role, permCodes) => {
  if (!role) return;
  
  for (const code of permCodes) {
    const permission = await Permission.findOne({ where: { code } });
    if (permission) {
      const existing = await RolePermission.findOne({ where: { roleId: role.id, permissionId: permission.id } });
      if (!existing) {
        await RolePermission.create({ roleId: role.id, permissionId: permission.id });
      }
    }
  }
};

const initUsers = async () => {
  try {
    let adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        username: 'admin',
        password: hashedPassword,
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        isActive: true
      });
      console.log('Default admin user created');
    }

    const adminRole = await Role.findOne({ where: { code: 'admin' } });
    if (adminUser && adminRole) {
      const existing = await UserRole.findOne({ where: { userId: adminUser.id, roleId: adminRole.id } });
      if (!existing) {
        await UserRole.create({ userId: adminUser.id, roleId: adminRole.id });
      }
    }

    let crystalUser = await User.findOne({ where: { username: 'Crystal' } });
    if (!crystalUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      crystalUser = await User.create({
        username: 'Crystal',
        password: hashedPassword,
        realName: 'Crystal',
        email: 'crystal@example.com',
        phone: '13800138001',
        managerId: adminUser?.id,
        isActive: true
      });
      console.log('Manager user Crystal created');
    }

    const managerRole = await Role.findOne({ where: { code: 'manager' } });
    if (crystalUser && managerRole) {
      const existing = await UserRole.findOne({ where: { userId: crystalUser.id, roleId: managerRole.id } });
      if (!existing) {
        await UserRole.create({ userId: crystalUser.id, roleId: managerRole.id });
      }
    }

    const amin = await User.findOne({ where: { username: 'Crystal' } });
    if (amin) {
      const lisaUser = await User.findOne({ where: { username: 'Lisa' } });
      if (!lisaUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          username: 'Lisa',
          password: hashedPassword,
          realName: 'Lisa',
          email: 'lisa@example.com',
          phone: '13800138002',
          managerId: amin.id,
          isActive: true
        });
        console.log('Consultant user Lisa created');
      }

      const linUser = await User.findOne({ where: { username: 'Lin' } });
      if (!linUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          username: 'Lin',
          password: hashedPassword,
          realName: 'Lin',
          email: 'lin@example.com',
          phone: '13800138003',
          managerId: amin.id,
          isActive: true
        });
        console.log('Consultant user Lin created');
      }
    }

    const consultantRole = await Role.findOne({ where: { code: 'consultant' } });
    const lisa = await User.findOne({ where: { username: 'Lisa' } });
    const lin = await User.findOne({ where: { username: 'Lin' } });
    
    if (lisa && consultantRole) {
      const existing = await UserRole.findOne({ where: { userId: lisa.id, roleId: consultantRole.id } });
      if (!existing) {
        await UserRole.create({ userId: lisa.id, roleId: consultantRole.id });
      }
    }
    
    if (lin && consultantRole) {
      const existing = await UserRole.findOne({ where: { userId: lin.id, roleId: consultantRole.id } });
      if (!existing) {
        await UserRole.create({ userId: lin.id, roleId: consultantRole.id });
      }
    }

    console.log('Users and roles association initialized');
  } catch (error) {
    console.error('Error creating users:', error);
  }
};

const initStageConfigs = async () => {
  try {
    const existingCount = await StageConfig.count();
    if (existingCount === 0) {
      const stageConfigs = [
        {
          module: 'candidate_entry',
          stages: ['candidate_entry'],
          stageNames: { candidate_entry: '候选录入' }
        },
        {
          module: 'exam_management',
          stages: ['exam_declare', 'exam_complete'],
          stageNames: { exam_declare: '机考申报', exam_complete: '机考完成' }
        },
        {
          module: 'test_management',
          stages: ['test_declare', 'test_complete'],
          stageNames: { test_declare: '韧测申报', test_complete: '韧测完成' }
        },
        {
          module: 'interview_management',
          stages: ['recommend_interview', 'qualification_interview', 'tech_interview_1', 'tech_interview_2', 'manager_interview', 'approval', 'offer', 'pending_onboarding'],
          stageNames: { recommend_interview: '推荐面试', qualification_interview: '资面安排', tech_interview_1: '技术面试(一)', tech_interview_2: '技术面试(二)', manager_interview: '主管面试', approval: '租用审批', offer: 'Offer', pending_onboarding: '待入职' }
        },
        {
          module: 'employee_management',
          stages: ['pending_onboarding', 'entry', 'leave'],
          stageNames: { pending_onboarding: '待入职', entry: '入职', leave: '离职' }
        }
      ];

      for (const config of stageConfigs) {
        await StageConfig.create(config);
      }
      console.log('Stage configs initialized');
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
  CandidateStageTimeline,
  Exam,
  Test,
  Interview,
  InterviewRound,
  Employee,
  StageConfig,
  Role,
  Permission,
  UserRole,
  RolePermission,
  initDatabase
};
