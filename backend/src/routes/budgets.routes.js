/**
 * routes/budgets.routes.js — Budget Routes
 * Pocket C.A. Backend
 *
 * Protected by JWT authentication:
 * - POST   /api/budgets      — Create new monthly category budget
 * - GET    /api/budgets      — Get budgets for month/year
 * - PUT    /api/budgets/:id  — Update budget limit/category
 * - DELETE /api/budgets/:id  — Delete budget
 */

const express = require('express');
const router = express.Router();
const budgetsController = require('../controllers/budgets.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/', budgetsController.createBudget);
router.get('/', budgetsController.getBudgets);
router.put('/:id', budgetsController.updateBudget);
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router;
