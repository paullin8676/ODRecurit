const { CandidateStageTimeline, Candidate } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const isSQLite = sequelize.getDialect() === 'sqlite';
const isMySQL = sequelize.getDialect() === 'mysql' || sequelize.getDialect() === 'mariadb';

const STAGE_NAMES = {
  candidate_entry: '候选录入',
  exam_declare: '机考申报',
  exam_complete: '机考完成',
  test_declare: '韧测申报',
  test_complete: '韧测完成',
  recommend_interview: '推荐面试',
  qualification_interview: '资面安排',
  tech_interview_1: '技术面试(一)',
  tech_interview_2: '技术面试(二)',
  manager_interview: '主管面试',
  approval: '租用审批',
  offer: 'Offer',
  pending_onboarding: '待入职',
  entry: '入职',
  leave: '离职'
};

const STAGE_ORDER = ['candidate_entry', 'exam_declare', 'exam_complete', 'test_declare', 'test_complete',
                    'recommend_interview', 'qualification_interview', 'tech_interview_1', 'tech_interview_2',
                    'manager_interview', 'approval', 'offer', 'pending_onboarding', 'entry', 'leave'];

function localDate(col) {
  if (isSQLite) return `DATE(datetime(${col}, '+8 hours'))`;
  return `DATE(CONVERT_TZ(${col}, '+00:00', '+08:00'))`;
}

function dateAdd1Day(col) {
  if (isSQLite) return `date(${col}, '+1 day')`;
  return `DATE_ADD(${col}, INTERVAL 1 DAY)`;
}

function julianDayDiff(colA, colB) {
  if (isSQLite) return `julianday(${colA}) - julianday(${colB})`;
  return `TIMESTAMPDIFF(SECOND, ${colB}, ${colA}) / 86400.0`;
}

function diffDaysNowMinusDate(col) {
  if (isSQLite) return `(julianday('now') - julianday(${col}))`;
  return `TIMESTAMPDIFF(SECOND, ${col}, NOW()) / 86400.0`;
}

async function executeReportQuery(sql) {
  return await sequelize.query(sql);
}

class CandidateStageTimelineService {
  static calculateDurationHours(dateLeft, dateEntered) {
    if (!dateLeft || !dateEntered) {
      return null;
    }
    const diffMs = new Date(dateLeft) - new Date(dateEntered);
    return Math.round((diffMs / 3600000) * 100) / 100;
  }

  static toLocalDateString(d) {
    const pad = (n) => n.toString().padStart(2, '0');
    const Y = d.getFullYear();
    const M = pad(d.getMonth() + 1);
    const D = pad(d.getDate());
    return `${Y}-${M}-${D}`;
  }

  static async enterStage(candidateId, stage, userId = null, transaction = null) {
    const now = new Date();
    const options = transaction ? { transaction } : {};

    if (stage === 'candidate_entry') {
      await CandidateStageTimeline.destroy({
        where: {
          candidateId,
          stage: { [Op.ne]: 'candidate_entry' }
        },
        ...options
      });
    }

    const existingRecord = await CandidateStageTimeline.findOne({
      where: { candidateId, stage },
      ...options
    });

    if (existingRecord) {
      return existingRecord.update({
        enteredAt: now,
        leftAt: null,
        durationHours: null,
        enteredBy: userId
      }, options);
    }

    return CandidateStageTimeline.create({
      candidateId,
      stage,
      enteredAt: now,
      leftAt: null,
      durationHours: null,
      enteredBy: userId
    }, options);
  }

  static async leaveStage(candidateId, stage, userId = null, transaction = null, overrideDate = null, protectUserDate = false) {
    const options = transaction ? { transaction } : {};

    const record = await CandidateStageTimeline.findOne({
      where: { candidateId, stage },
      ...options
    });

    if (!record) {
      return null;
    }

    if (protectUserDate && record.leftAt) {
      const leftDate = new Date(record.leftAt);
      if (leftDate.getHours() === 18 && leftDate.getMinutes() === 0 && leftDate.getSeconds() === 0) {
        return record;
      }
    }

    const now = overrideDate || new Date();
    const duration = this.calculateDurationHours(now, record.enteredAt);
    return record.update({
      leftAt: now,
      durationHours: duration,
      leftBy: userId
    }, options);
  }

  static async setRecommendInterviewFeedbackDate(candidateId, feedbackDateStr, userId) {
    const record = await CandidateStageTimeline.findOne({
      where: { candidateId, stage: 'recommend_interview' }
    });

    if (!record) {
      return null;
    }

    const feedbackDate = new Date(feedbackDateStr);
    feedbackDate.setHours(18, 0, 0, 0);

    const duration = this.calculateDurationHours(feedbackDate, record.enteredAt);

    return record.update({
      leftAt: feedbackDate,
      durationHours: duration,
      leftBy: userId
    });
  }

  static async getCandidateTimeline(candidateId) {
    return CandidateStageTimeline.findAll({
      where: { candidateId },
      order: [['enteredAt', 'ASC']]
    });
  }

  static async getDurationRecords({ startDate, endDate, leaveStartDate, leaveEndDate, stage, page, pageSize, name, sortField, sortOrder, stages }) {
    const params = [];
    let whereConditions = ['1=1'];

    if (startDate && endDate) {
      whereConditions.push('(' + localDate('t.entered_at') + ' >= ? AND ' + localDate('t.entered_at') + ' <= ?)');
      params.push(startDate, endDate);
    } else if (startDate) {
      whereConditions.push(localDate('t.entered_at') + ' >= ?');
      params.push(startDate);
    } else if (endDate) {
      whereConditions.push(localDate('t.entered_at') + ' <= ?');
      params.push(endDate);
    }
    if (leaveStartDate && leaveEndDate) {
      whereConditions.push('t.left_at IS NOT NULL AND ' + localDate('t.left_at') + ' >= ? AND ' + localDate('t.left_at') + ' <= ?');
      params.push(leaveStartDate, leaveEndDate);
    } else if (leaveStartDate) {
      whereConditions.push('t.left_at IS NOT NULL AND ' + localDate('t.left_at') + ' >= ?');
      params.push(leaveStartDate);
    } else if (leaveEndDate) {
      whereConditions.push('t.left_at IS NOT NULL AND ' + localDate('t.left_at') + ' <= ?');
      params.push(leaveEndDate);
    }
    if (stage) {
      whereConditions.push('t.stage = ?');
      params.push(stage);
    }
    if (stages) {
      const stagesArr = stages.split(',').map(s => s.trim()).filter(s => s);
      if (stagesArr.length === 1) {
        whereConditions.push('t.stage = ?');
        params.push(stagesArr[0]);
      } else if (stagesArr.length > 1) {
        const marks = stagesArr.map(() => '?').join(',');
        whereConditions.push(`t.stage IN (${marks})`);
        stagesArr.forEach(s => params.push(s));
      }
    }
    if (name) {
      const separators = /[\s,\u3001\uff0c]+/;
      const nameParts = name.trim().split(separators).filter(n => n && n.trim());
      if (nameParts.length > 0) {
        const nameConds = nameParts.map(() => 'c.name LIKE ?').join(' OR ');
        whereConditions.push(`(${nameConds})`);
        nameParts.forEach(n => params.push(`%${n.trim()}%`));
      }
    }

    const whereClause = whereConditions.join(' AND ');

    const countSql = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM candidate_stage_timeline t
      INNER JOIN candidate c ON t.candidate_id = c.id
      LEFT JOIN candidate_stage cs ON t.candidate_id = cs.candidate_id
      LEFT JOIN user u ON cs.consultant_id = u.id
      WHERE ${whereClause}
    `;
    const [countResult] = await sequelize.query(countSql, { replacements: params });
    const total = parseInt(countResult[0].total);

    let orderBy = 'ORDER BY t.entered_at DESC';
    if (sortField === 'durationHours' && sortOrder) {
      const direction = sortOrder === 'ascending' ? 'ASC' : 'DESC';
      orderBy = `ORDER BY t.duration_hours ${direction} NULLS LAST`;
    } else if (sortField === 'candidateName' && sortOrder) {
      const direction = sortOrder === 'ascending' ? 'ASC' : 'DESC';
      orderBy = `ORDER BY c.name ${direction}, CASE t.stage
        WHEN 'candidate_entry' THEN 0
        WHEN 'exam_declare' THEN 1
        WHEN 'exam_complete' THEN 2
        WHEN 'test_declare' THEN 3
        WHEN 'test_complete' THEN 4
        WHEN 'recommend_interview' THEN 5
        WHEN 'qualification_interview' THEN 6
        WHEN 'tech_interview_1' THEN 7
        WHEN 'tech_interview_2' THEN 8
        WHEN 'manager_interview' THEN 9
        WHEN 'approval' THEN 10
        WHEN 'offer' THEN 11
        WHEN 'pending_onboarding' THEN 12
        WHEN 'entry' THEN 13
        WHEN 'leave' THEN 14
        ELSE 99 END ASC`;
    }

    const dataSql = `
      SELECT 
        t.id,
        t.candidate_id,
        c.name AS candidate_name,
        t.stage,
        t.entered_at,
        t.left_at,
        t.duration_hours,
        u.id AS consultant_id,
        u.real_name AS consultant_name,
        u.username AS consultant_username
      FROM candidate_stage_timeline t
      INNER JOIN candidate c ON t.candidate_id = c.id
      LEFT JOIN candidate_stage cs ON t.candidate_id = cs.candidate_id
      LEFT JOIN user u ON cs.consultant_id = u.id
      WHERE ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(pageSize), (page - 1) * pageSize];
    const [rows] = await sequelize.query(dataSql, { replacements: dataParams });

    const records = rows.map(json => ({
      candidateId: json.candidate_id,
      candidateName: json.candidate_name || '未知',
      stage: json.stage,
      stageName: STAGE_NAMES[json.stage] || json.stage,
      enteredAt: json.entered_at,
      leftAt: json.left_at,
      durationHours: json.duration_hours,
      durationDays: json.duration_hours !== null ? (json.duration_hours / 24).toFixed(2) : null,
      consultantId: json.consultant_id,
      consultantName: json.consultant_name
    }));

    return { records, pagination: { page, pageSize, total } };
  }

  static calculatePercentiles(values, percentile) {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.min(index, values.length - 1)];
  }

  static async getDurationAggregations({ startDate, endDate, stage }) {
    const where = {};
    if (startDate) {
      where.enteredAt = where.enteredAt || {};
      where.enteredAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      where.enteredAt = where.enteredAt || {};
      where.enteredAt[Op.lte] = new Date(endDate);
    }
    if (stage) {
      where.stage = stage;
    }

    where.durationHours = { [Op.not]: null };

    const allRows = await CandidateStageTimeline.findAll({
      where,
      attributes: ['stage', 'durationHours']
    });

    const byStage = {};
    for (const row of allRows) {
      if (!byStage[row.stage]) {
        byStage[row.stage] = [];
      }
      byStage[row.stage].push(parseFloat(row.durationHours));
    }

    const aggregations = [];
    let globalAvg = 0;
    let count = 0;
    for (const s in byStage) {
      for (const h of byStage[s]) { globalAvg += h; ++count; }
    }
    if (count > 0) {
      globalAvg = globalAvg / count;
    }

    for (const stageKey in byStage) {
      const hours = byStage[stageKey];
      const avg = hours.reduce((s, x) => s + x, 0) / hours.length;
      aggregations.push({
        stage: stageKey,
        stageName: STAGE_NAMES[stageKey] || stageKey,
        avgHours: Math.round(avg * 100) / 100,
        avgDays: Math.round((avg / 24) * 100) / 100,
        p50Hours: Math.round(this.calculatePercentiles(hours, 50) * 100) / 100,
        p75Hours: Math.round(this.calculatePercentiles(hours, 75) * 100) / 100,
        p90Hours: Math.round(this.calculatePercentiles(hours, 90) * 100) / 100,
        count: hours.length,
        isBottleneck: avg >= globalAvg * 1.5
      });
    }

    aggregations.sort((a, b) => b.avgHours - a.avgHours);

    return { aggregations };
  }

  static async getCandidateTotalDurations() {
    const dayDiffExpr = diffDaysNowMinusDate('t.entered_at');
    const sql = `
      SELECT 
        t.candidate_id,
        c.name AS candidate_name,
        cs.current_stage,
        (${dayDiffExpr}) AS total_days_raw,
        t.entered_at AS entry_entered_at
      FROM candidate_stage_timeline t
      INNER JOIN candidate c ON t.candidate_id = c.id
      INNER JOIN candidate_stage cs ON t.candidate_id = cs.candidate_id
      WHERE t.stage = 'candidate_entry'
      ORDER BY t.entered_at ASC
    `;
    const [results] = await sequelize.query(sql);

    const records = results.map(r => {
      const entryDate = new Date(r.entry_entered_at);
      const diffDays = Math.round(parseFloat(r.total_days_raw) * 10) / 10;
      return {
        candidateId: r.candidate_id,
        candidateName: r.candidate_name || '未知',
        currentStage: r.current_stage,
        currentStageName: STAGE_NAMES[r.current_stage] || r.current_stage || '未知',
        totalDays: diffDays,
        candidateEntryDate: entryDate
      };
    }).sort((a, b) => b.totalDays - a.totalDays);
    return { records };
  }

  static async getStageTrend({ periodDays, startDate, endDate }) {
    let startStr, endStr;
    
    if (startDate && endDate) {
      startStr = startDate;
      endStr = endDate;
    } else {
      const end = new Date();
      const start = new Date();
      const days = parseInt(periodDays || 7);
      start.setDate(end.getDate() - (days - 1));
      startStr = this.toLocalDateString(start);
      endStr = this.toLocalDateString(end);
    }

    const stageListLiteral = STAGE_ORDER.map(s => `'${s}'`).join(',');
    const allStagesCte = STAGE_ORDER.map(s => `SELECT '${s}' AS stage`).join(' UNION ALL ');

    const sql = `
WITH RECURSIVE dates(date) AS (
    SELECT '${startStr}'
    UNION ALL
    SELECT ${dateAdd1Day('date')} FROM dates WHERE date < '${endStr}'
),
all_stages AS (
    ${allStagesCte}
),
daily_completion AS (
    SELECT 
        ${localDate('t.left_at')} as completion_date,
        t.stage,
        COUNT(DISTINCT t.candidate_id) as candidate_count,
        AVG(t.duration_hours) as avg_hours
    FROM candidate_stage_timeline t
    WHERE t.duration_hours IS NOT NULL
      AND ${localDate('t.left_at')} >= '${startStr}'
      AND ${localDate('t.left_at')} <= '${endStr}'
      AND t.stage IN (${stageListLiteral})
    GROUP BY completion_date, stage
)
SELECT 
    d.date as trend_date,
    s.stage,
    COALESCE(dc.candidate_count, 0) as candidate_count,
    COALESCE(dc.avg_hours, 0) as avg_hours
FROM dates d
CROSS JOIN all_stages s
LEFT JOIN daily_completion dc 
    ON dc.completion_date = d.date 
   AND dc.stage = s.stage
ORDER BY d.date ASC, s.stage ASC
    `;
    const [rows] = await executeReportQuery(sql);
    
    const datesSet = new Set();
    const dataMap = {};
    for (const r of rows) {
      const d = String(r.trend_date).split('T')[0];
      datesSet.add(d);
      const sname = STAGE_NAMES[r.stage] || r.stage;
      if (!dataMap[sname]) dataMap[sname] = {};
      dataMap[sname][d] = Math.round((parseFloat(r.avg_hours) / 24) * 100) / 100;
    }
    const dates = Array.from(datesSet).sort();
    
    const series = [];
    for (const stageKey of STAGE_ORDER) {
      const stageName = STAGE_NAMES[stageKey];
      if (stageName && dataMap[stageName]) {
        const data = [];
        for (const d of dates) {
          data.push(dataMap[stageName][d] || 0);
        }
        series.push({ name: stageName, data });
      }
    }
    return { dates, series };
  }

  static async getTotalFlowTrend({ periodDays, startDate, endDate }) {
    let startStr, endStr;
    
    if (startDate && endDate) {
      startStr = startDate;
      endStr = endDate;
    } else {
      const end = new Date();
      const start = new Date();
      const days = parseInt(periodDays || 7);
      start.setDate(end.getDate() - (days - 1));
      startStr = this.toLocalDateString(start);
      endStr = this.toLocalDateString(end);
    }

    const stageListLiteral = STAGE_ORDER.map(s => `'${s}'`).join(',');
    const allStagesSqliteCte = STAGE_ORDER
      .map((s, i) => `SELECT '${s}' AS stage`)
      .join(' UNION ALL ');

    let sql;
    if (isSQLite) {
      sql = `
WITH RECURSIVE dates(date) AS (
    SELECT '${startStr}'
    UNION ALL
    SELECT date(date, '+1 day') FROM dates WHERE date < '${endStr}'
),
all_stages AS (
    ${allStagesSqliteCte}
),
daily_stats AS (
    WITH date_stage_candidates AS (
        SELECT 
            d.date as trend_date,
            s.stage,
            t.candidate_id,
            entry.entered_at as entry_entered_at,
            t.entered_at as stage_entered_at,
            t.left_at as stage_left_at
        FROM dates d
        CROSS JOIN all_stages s
        INNER JOIN candidate_stage_timeline t 
            ON t.stage = s.stage
            AND (
                 DATE(datetime(t.left_at, '+8 hours')) = d.date 
                 OR 
                 (t.left_at IS NULL AND DATE(datetime(t.entered_at, '+8 hours')) <= d.date)
                 OR
                 (DATE(datetime(t.entered_at, '+8 hours')) <= d.date AND d.date < DATE(datetime(t.left_at, '+8 hours')))
            )
        INNER JOIN candidate c ON t.candidate_id = c.id
        INNER JOIN candidate_stage_timeline entry 
            ON entry.candidate_id = t.candidate_id 
            AND entry.stage = 'candidate_entry'
            AND d.date >= DATE(datetime(entry.entered_at, '+8 hours'))
    )
    SELECT 
        trend_date,
        stage,
        AVG(
            CAST(
              julianday(
                CASE
                  WHEN stage_left_at IS NULL THEN IIF(trend_date = date(datetime('now', '+8 hours')), datetime('now'), datetime(datetime(trend_date, '+1 day', '-1 second'), '-8 hours'))
                  WHEN DATE(datetime(stage_left_at, '+8 hours')) = trend_date THEN stage_left_at
                  WHEN DATE(datetime(stage_entered_at, '+8 hours')) <= trend_date AND trend_date < DATE(datetime(stage_left_at, '+8 hours')) 
                    THEN IIF(trend_date = date(datetime('now', '+8 hours')), datetime('now'), datetime(datetime(trend_date, '+1 day', '-1 second'), '-8 hours'))
                  ELSE IIF(trend_date = date(datetime('now', '+8 hours')), datetime('now'), datetime(datetime(trend_date, '+1 day', '-1 second'), '-8 hours'))
                END
              ) 
              - julianday(entry_entered_at) 
            AS REAL)
        ) as avg_total_days
    FROM date_stage_candidates
    GROUP BY trend_date, stage
)
SELECT 
    d.date as trend_date,
    s.stage,
    COALESCE(ds.avg_total_days, 0) as avg_total_days
FROM dates d
CROSS JOIN all_stages s
LEFT JOIN daily_stats ds 
    ON ds.trend_date = d.date 
   AND ds.stage = s.stage
ORDER BY d.date ASC, s.stage ASC
      `;
    } else {
      sql = `
WITH RECURSIVE dates(date) AS (
    SELECT '${startStr}'
    UNION ALL
    SELECT DATE_ADD(date, INTERVAL 1 DAY) FROM dates WHERE date < '${endStr}'
),
all_stages AS (
    ${allStagesSqliteCte}
),
daily_stats AS (
    WITH date_stage_candidates AS (
        SELECT 
            d.date as trend_date,
            s.stage,
            t.candidate_id,
            entry.entered_at as entry_entered_at,
            t.entered_at as stage_entered_at,
            t.left_at as stage_left_at
        FROM dates d
        CROSS JOIN all_stages s
        INNER JOIN candidate_stage_timeline t 
            ON t.stage = s.stage
            AND (
                 DATE(CONVERT_TZ(t.left_at, '+00:00', '+08:00')) = d.date 
                 OR 
                 (t.left_at IS NULL AND DATE(CONVERT_TZ(t.entered_at, '+00:00', '+08:00')) <= d.date)
                 OR
                 (DATE(CONVERT_TZ(t.entered_at, '+00:00', '+08:00')) <= d.date AND d.date < DATE(CONVERT_TZ(t.left_at, '+00:00', '+08:00')))
            )
        INNER JOIN candidate c ON t.candidate_id = c.id
        INNER JOIN candidate_stage_timeline entry 
            ON entry.candidate_id = t.candidate_id 
            AND entry.stage = 'candidate_entry'
            AND d.date >= DATE(CONVERT_TZ(entry.entered_at, '+00:00', '+08:00'))
    )
    SELECT 
        trend_date,
        stage,
        AVG(
            TIMESTAMPDIFF(HOUR, entry_entered_at,
                CASE
                  WHEN stage_left_at IS NULL THEN IF(DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00')) = trend_date, NOW(), DATE_SUB(DATE_ADD(trend_date, INTERVAL 1 DAY), INTERVAL 1 SECOND))
                  WHEN DATE(CONVERT_TZ(stage_left_at, '+00:00', '+08:00')) = trend_date THEN stage_left_at
                  WHEN DATE(CONVERT_TZ(stage_entered_at, '+00:00', '+08:00')) <= trend_date AND trend_date < DATE(CONVERT_TZ(stage_left_at, '+00:00', '+08:00')) 
                    THEN IF(DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00')) = trend_date, NOW(), DATE_SUB(DATE_ADD(trend_date, INTERVAL 1 DAY), INTERVAL 1 SECOND))
                  ELSE IF(DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00')) = trend_date, NOW(), DATE_SUB(DATE_ADD(trend_date, INTERVAL 1 DAY), INTERVAL 1 SECOND))
                END
            ) / 24.0
        ) as avg_total_days
    FROM date_stage_candidates
    GROUP BY trend_date, stage
)
SELECT 
    d.date as trend_date,
    s.stage,
    COALESCE(ds.avg_total_days, 0) as avg_total_days
FROM dates d
CROSS JOIN all_stages s
LEFT JOIN daily_stats ds 
    ON ds.trend_date = d.date 
   AND ds.stage = s.stage
ORDER BY d.date ASC, s.stage ASC
      `;
    }
    const [rows] = await executeReportQuery(sql);

    const datesSet = new Set();
    const dataMap = {};
    for (const r of rows) {
      const d = String(r.trend_date).split('T')[0];
      datesSet.add(d);
      const sname = STAGE_NAMES[r.stage] || r.stage;
      if (!dataMap[sname]) dataMap[sname] = {};
      dataMap[sname][d] = Math.round(parseFloat(r.avg_total_days) * 100) / 100;
    }
    const dates = Array.from(datesSet).sort();
    
    const series = [];
    for (const stageKey of STAGE_ORDER) {
      const stageName = STAGE_NAMES[stageKey];
      if (stageName && dataMap[stageName]) {
        const data = [];
        for (const d of dates) {
          data.push(dataMap[stageName][d] || 0);
        }
        series.push({ name: stageName, data });
      }
    }
    return { dates, series };
  }
}

module.exports = CandidateStageTimelineService;
module.exports.STAGE_NAMES = STAGE_NAMES;
module.exports.STAGE_ORDER = STAGE_ORDER;
