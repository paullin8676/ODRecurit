const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');
const { promisify } = require('util');
const { BackupRecord, sequelize } = require('../models');

const execAsync = promisify(exec);

const DEFAULT_BACKUP_DIR = path.join(__dirname, '../../backups');
const DEFAULT_SCHEDULE_TIME = '02:00';
const RETENTION_DAYS = 7;

let currentScheduleTime = DEFAULT_SCHEDULE_TIME;
let scheduleInterval = null;

function ensureBackupDir(dirPath = DEFAULT_BACKUP_DIR) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

function parseTimeToMs(timeStr) {
  const [h, m] = (timeStr || '02:00').split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m || 0, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target - now;
}

function getDbCredentials() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'recruit_db'
  };
}

async function createBackup(backupType = 'manual') {
  const backupDir = ensureBackupDir();
  const now = new Date();
  const fileName = `backup_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}.sql`;
  const filePath = path.join(backupDir, fileName);
  
  const db = getDbCredentials();
  
  let record;
  try {
    record = await BackupRecord.create({
      fileName,
      filePath,
      backupType,
      status: 'in_progress',
      scheduleTime: currentScheduleTime
    });

    const env = { ...process.env, MYSQL_PWD: db.password };
    const cmd = `/opt/homebrew/bin/mysqldump -h ${db.host} -P ${db.port} -u ${db.user} ${db.database}`;
    
    const { stdout, stderr } = await execAsync(cmd, { env, maxBuffer: 100 * 1024 * 1024 });
    fs.writeFileSync(filePath, stdout);
    
    const stats = fs.statSync(filePath);
    await record.update({ 
      status: 'completed', 
      fileSize: stats.size 
    });
    
    return { success: true, record: record.toJSON() };
  } catch (error) {
    if (record) {
      await record.update({ 
        status: 'failed', 
        errorMessage: String(error.message || error).substring(0, 500) 
      });
    }
    return { success: false, error: error.message };
  }
}

async function restoreBackup(recordId) {
  const record = await BackupRecord.findByPk(recordId);
  if (!record) {
    return { success: false, error: 'Backup record not found' };
  }
  if (!fs.existsSync(record.filePath)) {
    return { success: false, error: 'Backup file not found: ' + record.filePath };
  }

  const db = getDbCredentials();
  const env = { ...process.env, MYSQL_PWD: db.password };
  
  try {
    const sqlContent = fs.readFileSync(record.filePath, 'utf8');
    const cmd = `/opt/homebrew/bin/mysql -h ${db.host} -P ${db.port} -u ${db.user} ${db.database}`;
    await execAsync(cmd, { env, input: sqlContent });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteBackup(recordId) {
  const record = await BackupRecord.findByPk(recordId);
  if (!record) {
    return { success: false, error: 'Backup record not found' };
  }
  if (fs.existsSync(record.filePath)) {
    fs.unlinkSync(record.filePath);
  }
  await record.destroy();
  return { success: true };
}

async function cleanupOldBackups(retentionDays = RETENTION_DAYS) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  
  const oldRecords = await BackupRecord.findAll({
    where: {
      created_at: { [require('sequelize').Op.lt]: cutoff }
    }
  });
  
  let deletedCount = 0;
  for (const rec of oldRecords) {
    if (fs.existsSync(rec.filePath)) {
      try { fs.unlinkSync(rec.filePath); } catch(e) {}
    }
    await rec.destroy();
    deletedCount++;
  }
  return deletedCount;
}

async function listBackups(page = 1, pageSize = 20) {
  page = parseInt(page) || 1;
  pageSize = parseInt(pageSize) || 20;
  const { count, rows } = await BackupRecord.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  });
  return { 
    backups: rows, 
    pagination: { page, pageSize, total: count } 
  };
}

function getScheduleConfig() {
  return {
    scheduleTime: currentScheduleTime,
    retentionDays: RETENTION_DAYS,
    backupDir: DEFAULT_BACKUP_DIR
  };
}

async function updateScheduleTime(timeStr) {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error('Invalid time format, expected HH:MM');
  }
  currentScheduleTime = timeStr;
  restartSchedule();
  return getScheduleConfig();
}

async function scheduledBackupTask() {
  console.log(`[BackupSchedule] Running scheduled backup at ${new Date().toISOString()}`);
  await createBackup('scheduled');
  await cleanupOldBackups(RETENTION_DAYS);
  scheduleNextRun();
}

function scheduleNextRun() {
  if (scheduleInterval) {
    clearTimeout(scheduleInterval);
  }
  const delayMs = parseTimeToMs(currentScheduleTime);
  const timeStr = new Date(Date.now() + delayMs).toLocaleString('zh-CN');
  console.log(`[BackupSchedule] Next backup scheduled at: ${timeStr}`);
  scheduleInterval = setTimeout(scheduledBackupTask, delayMs);
}

function restartSchedule() {
  scheduleNextRun();
}

function initBackupSchedule() {
  ensureBackupDir();
  scheduleNextRun();
}

module.exports = {
  createBackup,
  restoreBackup,
  deleteBackup,
  cleanupOldBackups,
  listBackups,
  getScheduleConfig,
  updateScheduleTime,
  initBackupSchedule,
  DEFAULT_BACKUP_DIR
};
