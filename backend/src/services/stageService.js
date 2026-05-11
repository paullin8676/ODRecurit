const { CandidateStage, Candidate } = require('../models');

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

    if (!stage) {
      return await CandidateStage.create({
        candidateId,
        currentStage: newStage,
        updatedBy
      }, { transaction });
    }

    const history = JSON.parse(stage.stageHistory || '[]');
    history.push({
      stage: stage.currentStage,
      changedAt: new Date().toISOString(),
      changedBy: updatedBy
    });

    return await stage.update({
      currentStage: newStage,
      previousStage: stage.currentStage,
      stageHistory: JSON.stringify(history),
      updatedBy
    }, { transaction });
  }

  static async initStage(candidateId, initialStage = 'candidate_entry', updatedBy = null, consultantId = null) {
    return await CandidateStage.findOrCreate({
      where: { candidateId },
      defaults: {
        currentStage: initialStage,
        updatedBy,
        consultantId
      }
    });
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