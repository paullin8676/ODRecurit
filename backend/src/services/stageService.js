const { CandidateStage, Candidate } = require('../models');
const CandidateStageTimelineService = require('./CandidateStageTimelineService');

class StageService {
  static async getStage(candidateId) {
    const stage = await CandidateStage.findOne({
      where: { candidateId }
    });
    return stage;
  }

  static async updateStage(candidateId, newStage, updatedBy = null, transaction = null) {
    const stage = await CandidateStage.findOne({
      where: { candidateId },
      transaction
    });

    const previousStage = stage?.currentStage || null;

    if (!stage) {
      const result = await CandidateStage.create({
        candidateId,
        currentStage: newStage,
        updatedBy
      }, { transaction });
      await CandidateStageTimelineService.enterStage(candidateId, newStage, updatedBy, transaction);
      return result;
    }

    const history = JSON.parse(stage.stageHistory || '[]');
    history.push({
      stage: stage.currentStage,
      changedAt: new Date().toISOString(),
      changedBy: updatedBy
    });

    if (stage.currentStage && stage.currentStage !== newStage) {
      const protectUserDate = stage.currentStage === 'recommend_interview';
      await CandidateStageTimelineService.leaveStage(candidateId, stage.currentStage, updatedBy, transaction, null, protectUserDate);
    }

    await CandidateStageTimelineService.enterStage(candidateId, newStage, updatedBy, transaction);

    return await stage.update({
      currentStage: newStage,
      previousStage,
      stageHistory: JSON.stringify(history),
      updatedBy
    }, { transaction });
  }

  static async initStage(candidateId, initialStage = 'candidate_entry', updatedBy = null, consultantId = null) {
    const result = await CandidateStage.findOrCreate({
      where: { candidateId },
      defaults: {
        currentStage: initialStage,
        updatedBy,
        consultantId
      }
    });
    await CandidateStageTimelineService.enterStage(candidateId, initialStage, updatedBy);
    return result;
  }

  static async getStageHistory(candidateId) {
    const stage = await CandidateStage.findOne({
      where: { candidateId }
    });
    if (!stage) return [];
    return JSON.parse(stage.stageHistory || '[]');
  }

  static async deleteStage(candidateId) {
    return await CandidateStage.destroy({
      where: { candidateId }
    });
  }
}

module.exports = StageService;
