const { readData } = require('./src/services/dataStore');

function generateContext(userId) {
  const db = readData();
  const userTxs = db.transactions ? db.transactions.filter(t => t.user === userId) : [];
  const userBudgets = db.budgets ? db.budgets.filter(b => b.user === userId) : [];
  const userGoals = db.goals ? db.goals.filter(g => g.user === userId) : [];

  let totalIncome = 0;
  let totalExpense = 0;
  const categorySpending = {};

  userTxs.forEach(t => {
    const amt = Number(t.amount);
    if (t.type === 'Income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      categorySpending[t.category] = (categorySpending[t.category] || 0) + amt;
    }
  });

  const budgetsContext = userBudgets.map(b => {
    const spent = categorySpending[b.category] || 0;
    const limit = Number(b.monthlyLimit || b.limitAmount) || 0;
    return `- ${b.category}: Limit ₹${limit}, Spent ₹${spent}, Remaining ₹${limit - spent}`;
  }).join('\n');

  const goalsContext = userGoals.map(g => {
    return `- ${g.name || g.title}: Target ₹${g.targetAmount}, Saved ₹${g.currentAmount || 0}`;
  }).join('\n');

  const recentTxs = userTxs.slice(0, 15).map(t => {
    const date = t.transactionDate ? t.transactionDate.split('T')[0] : t.createdAt.split('T')[0];
    return `- ${date} | ${t.type} | ${t.category} | ₹${t.amount} | ${t.description || 'No desc'}`;
  }).join('\n');

  console.log("=== CONTEXT PREVIEW ===");
  console.log("Budgets:\n" + budgetsContext);
  console.log("Goals:\n" + goalsContext);
  console.log("Recent Txs:\n" + recentTxs);
  console.log("=======================");
}

generateContext('mock_user_123');
