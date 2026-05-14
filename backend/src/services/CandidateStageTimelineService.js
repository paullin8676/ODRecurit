const { CandidateStageTimeline, Candidate } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

class CandidateStageTimelineService {
  static calculateDurationHours(dateLeft, dateEntered) {
    if (!dateLeft || !dateEntered) {
      return null;
    }
    const diffMs = new Date(dateLeft) - new Date(dateEntered);
    return Math.round((diffMs / 3600000) * 100) / 100;
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

  static async getDurationRecords({ startDate, endDate, stage, page, pageSize, name }) {
    const params = [];
    let whereConditions = ['1=1'];

    if (startDate) {
      whereConditions.push('t.entered_at >= ?');
      params.push(new Date(startDate));
    }
    if (endDate) {
      whereConditions.push('t.entered_at <= ?');
      params.push(new Date(endDate));
    }
    if (stage) {
      whereConditions.push('t.stage = ?');
      params.push(stage);
    }
    if (name) {
      whereConditions.push('c.name LIKE ?');
      params.push(`%${name}%`);
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
      ORDER BY t.entered_at DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(pageSize), (page - 1) * pageSize];
    const [rows] = await sequelize.query(dataSql, { replacements: dataParams });

    const stageNames = {
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

    const records = rows.map(json => ({
      candidateId: json.candidate_id,
      candidateName: json.candidate_name || '未知',
      stage: json.stage,
      stageName: stageNames[json.stage] || json.stage,
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

    const stageNames = {
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
        stageName: stageNames[stageKey] || stageKey,
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
    const sql = `
      SELECT 
        t.candidate_id,
        c.name AS candidate_name,
        cs.current_stage,
        t.entered_at AS entry_entered_at
      FROM candidate_stage_timeline t
      INNER JOIN candidate c ON t.candidate_id = c.id
      INNER JOIN candidate_stage cs ON t.candidate_id = cs.candidate_id
      WHERE t.stage = 'candidate_entry'
      ORDER BY t.entered_at ASC
    `;
    const [results] = await sequelize.query(sql);

    const stageNames = {
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

    return results.map(r => {
      const entryDate = new Date(r.entry_entered_at);
      const now = new Date();
      const diffDays = Math.round(((now - entryDate) / (1000 * 60 * 60 * 24)) * 10) / 10;
      return {
        candidateId: r.candidate_id,
        candidateName: r.candidate_name || '未知',
        currentStage: r.current_stage,
        currentStageName: stageNames[r.current_stage] || r.current_stage || '未知',
        totalDays: diffDays,
        candidateEntryDate: entryDate
      };
    }).sort((a, b) => b.totalDays - a.totalDays);
  }
}

module.exports = CandidateStageTimelineService;
