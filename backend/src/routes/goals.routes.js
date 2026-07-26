/**
 * routes/goals.routes.js — Savings Goals Routes
 * Pocket C.A. Backend
 *
 * Protected by JWT authentication:
 * - POST   /api/goals      — Create new savings goal
 * - GET    /api/goals      — List user savings goals
 * - PUT    /api/goals/:id  — Update goal / add contribution
 * - DELETE /api/goals/:id  — Delete goal
 */

const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goals.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/', goalsController.createGoal);
router.get('/', goalsController.getGoals);
router.put('/:id', goalsController.updateGoal);
router.delete('/:id', goalsController.deleteGoal);

module.exports = router;
