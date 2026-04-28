const express = require('express');
const { Interview, CandidateProductLine } = require('../models');

const router = express.Router();

// Get all interviews
router.get('/', async (req, res, next) => {
  try {
    const interviews = await Interview.findAll({
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        }
      ]
    });
    
    // Transform data to match expected format
    const transformedInterviews = interviews.map(interview => {
      const candidate = interview.candidateProductLine?.Candidate;
      const productLine = interview.candidateProductLine?.ProductLine;
      const recommendDate = interview.candidateProductLine?.recommendDate;
      const candidateProductLineId = interview.candidateProductLine?.id;
      const productLineId = interview.candidateProductLine?.productLineId;

      return {
        ...interview.toJSON(),
        Candidate: candidate,
        productLine: productLine,
        productLineId: productLineId,
        candidateProductLineId: candidateProductLineId,
        recommendDate: recommendDate,
        clientOwner: productLine?.clientOwner || ''
      };
    }).filter(interview => interview.Candidate && interview.productLine); // Filter out interviews without candidate or product line
    
    res.json({ interviews: transformedInterviews });
  } catch (error) {
    console.error('Error in GET interviews:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// Create or update interview
router.post('/', async (req, res, next) => {
  try {
    const { candidateId, productLineId, recommendDate, qualificationInterviewDate, qualificationInterviewer, qualificationConclusion, qualificationPassed, techInterview1Date, techInterview1Interviewer, techInterview1Content, techInterview1Passed, techInterview2Date, techInterview2Interviewer, techInterview2Content, techInterview2Passed, managerInterviewDate, managerInterviewer, managerInterviewContent, managerInterviewPassed, approvalDate, approver, approvalRemark, approvalPassed, offerDate, offerApprover, offerRemark, entryDate, entryRemark, leaveDate, leaveReason, leaveRemark } = req.body;
    
    // Find or create CandidateProductLine
    let candidateProductLine = await CandidateProductLine.findOne({
      where: { candidateId, productLineId }
    });
    
    if (!candidateProductLine) {
      // Create new CandidateProductLine if it doesn't exist
      candidateProductLine = await CandidateProductLine.create({
        candidateId,
        productLineId,
        recommendDate
      });
    } else {
      // Update existing CandidateProductLine
      await candidateProductLine.update({
        recommendDate
      });
    }
    
    // Create or update interview
    const [interview, created] = await Interview.findOrCreate({
      where: { candidateProductLineId: candidateProductLine.id },
      defaults: {
        qualificationInterviewDate,
        qualificationInterviewer,
        qualificationConclusion,
        qualificationPassed,
        techInterview1Date,
        techInterview1Interviewer,
        techInterview1Content,
        techInterview1Passed,
        techInterview2Date,
        techInterview2Interviewer,
        techInterview2Content,
        techInterview2Passed,
        managerInterviewDate,
        managerInterviewer,
        managerInterviewContent,
        managerInterviewPassed,
        approvalDate,
        approver,
        approvalRemark,
        approvalPassed,
        offerDate,
        offerApprover,
        offerRemark,
        entryDate,
        entryRemark,
        leaveDate,
        leaveReason,
        leaveRemark
      }
    });
    
    if (!created) {
      // Update existing interview
      await interview.update({
        qualificationInterviewDate,
        qualificationInterviewer,
        qualificationConclusion,
        qualificationPassed,
        techInterview1Date,
        techInterview1Interviewer,
        techInterview1Content,
        techInterview1Passed,
        techInterview2Date,
        techInterview2Interviewer,
        techInterview2Content,
        techInterview2Passed,
        managerInterviewDate,
        managerInterviewer,
        managerInterviewContent,
        managerInterviewPassed,
        approvalDate,
        approver,
        approvalRemark,
        approvalPassed,
        offerDate,
        offerApprover,
        offerRemark,
        entryDate,
        entryRemark,
        leaveDate,
        leaveReason,
        leaveRemark
      });
    }
    
    // Return the updated interview with associations
    const updatedInterview = await Interview.findByPk(interview.id, {
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        }
      ]
    });
    
    // Transform data to match expected format
    const candidate = updatedInterview.candidateProductLine?.Candidate;
    const productLine = updatedInterview.candidateProductLine?.ProductLine;
    const cplRecommendDate = updatedInterview.candidateProductLine?.recommendDate;
    const cplId = updatedInterview.candidateProductLine?.id;
    const cplProductLineId = updatedInterview.candidateProductLine?.productLineId;

    const transformedInterview = {
      ...updatedInterview.toJSON(),
      Candidate: candidate,
      productLine: productLine,
      productLineId: cplProductLineId,
      candidateProductLineId: cplId,
      recommendDate: cplRecommendDate,
      clientOwner: productLine?.clientOwner || ''
    };

    res.json(transformedInterview);
  } catch (error) {
    console.error('Error in interview operation:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// Get interviews by candidate ID
router.get('/candidate/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { productLineId } = req.query;
    
    // Find CandidateProductLine records for this candidate
    const where = { candidateId };
    if (productLineId) {
      where.productLineId = productLineId;
    }
    
    const candidateProductLines = await CandidateProductLine.findAll({
      where,
      include: ['Candidate', 'ProductLine']
    });
    
    // Find interviews for these CandidateProductLine records
    const candidateProductLineIds = candidateProductLines.map(cpl => cpl.id);
    const interviews = await Interview.findAll({
      where: { candidateProductLineId: candidateProductLineIds },
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        }
      ]
    });
    
    // Transform data to match expected format
    const transformedInterviews = interviews.map(interview => {
      const candidate = interview.candidateProductLine?.Candidate;
      const productLine = interview.candidateProductLine?.ProductLine;
      const recommendDate = interview.candidateProductLine?.recommendDate;
      const candidateProductLineId = interview.candidateProductLine?.id;
      const productLineId = interview.candidateProductLine?.productLineId;

      return {
        ...interview.toJSON(),
        Candidate: candidate,
        productLine: productLine,
        productLineId: productLineId,
        candidateProductLineId: candidateProductLineId,
        recommendDate: recommendDate,
        clientOwner: productLine?.clientOwner || ''
      };
    }).filter(interview => interview.Candidate && interview.productLine); // Filter out interviews without candidate or product line
    
    res.json({ interviews: transformedInterviews });
  } catch (error) {
    console.error('Error in GET interviews by candidate:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

module.exports = router;