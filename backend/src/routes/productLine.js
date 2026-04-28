const express = require('express');
const { ProductLine, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const productLines = await ProductLine.findAll({
      where,
      include: [
        { model: User, as: 'consultants', attributes: ['id', 'username', 'realName', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // For consultants, filter product lines where they are one of the consultants
    if (req.user.role === 'consultant') {
      const filteredProductLines = productLines.filter(productLine => 
        productLine.consultants.some(consultant => consultant.id === req.user.id)
      );
      return res.json({ productLines: filteredProductLines });
    }

    res.json({ productLines });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const productLine = await ProductLine.findByPk(req.params.id, {
      include: [
        { model: User, as: 'consultants', attributes: ['id', 'username', 'realName', 'role'] }
      ]
    });

    if (!productLine) {
      return res.status(404).json({ error: 'Product line not found' });
    }

    // Check if consultant has access to this product line
    if (req.user.role === 'consultant' && 
        !productLine.consultants.some(consultant => consultant.id === req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ productLine });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { name, clientOwner, consultantIds, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const productLine = await ProductLine.create({
      name,
      clientOwner,
      description
    });

    // Associate consultants if provided
    if (consultantIds && Array.isArray(consultantIds)) {
      await productLine.setConsultants(consultantIds);
    }

    // Reload with consultants
    await productLine.reload({
      include: [{ model: User, as: 'consultants', attributes: ['id', 'username', 'realName', 'role'] }]
    });

    res.status(201).json({
      message: 'Product line created successfully',
      productLine
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Product line name already exists' });
    }
    next(error);
  }
});

router.put('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const productLine = await ProductLine.findByPk(req.params.id);

    if (!productLine) {
      return res.status(404).json({ error: 'Product line not found' });
    }

    const { name, clientOwner, consultantIds, description, isActive } = req.body;
    await productLine.update({
      name: name || productLine.name,
      clientOwner: clientOwner !== undefined ? clientOwner : productLine.clientOwner,
      description: description !== undefined ? description : productLine.description,
      isActive: isActive !== undefined ? isActive : productLine.isActive
    });

    // Update consultants if provided
    if (consultantIds !== undefined) {
      if (Array.isArray(consultantIds)) {
        await productLine.setConsultants(consultantIds);
      } else {
        return res.status(400).json({ error: 'consultantIds must be an array' });
      }
    }

    // Reload with consultants
    await productLine.reload({
      include: [{ model: User, as: 'consultants', attributes: ['id', 'username', 'realName', 'role'] }]
    });

    res.json({
      message: 'Product line updated successfully',
      productLine
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const productLine = await ProductLine.findByPk(req.params.id);

    if (!productLine) {
      return res.status(404).json({ error: 'Product line not found' });
    }

    // Check if product line is associated with any candidates
    const { CandidateProductLine } = require('../models');
    const candidateAssociations = await CandidateProductLine.count({
      where: { productLineId: req.params.id }
    });

    if (candidateAssociations > 0) {
      // If associated with candidates, deactivate
      await productLine.update({ isActive: false });
      res.json({ message: 'Product line deactivated successfully', deactivated: true });
    } else {
      // If no associations, delete permanently
      await productLine.destroy();
      res.json({ message: 'Product line deleted successfully', deleted: true });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
