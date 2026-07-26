/**
 * services/reports.service.js — Financial Reports & Export Service
 * Pocket C.A. Backend
 *
 * Generates comprehensive financial summaries and professional export streams
 * (PDF using PDFKit and Excel spreadsheets using ExcelJS).
 * Enforces strict user ownership isolation.
 */

const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction.model');
const ApiError = require('../utils/ApiError');

// ─── 1. Get Financial Report Summary ──────────────────────────────────────────
const getReportSummary = async (userId, { startDate, endDate } = {}) => {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
  };

  if (startDate || endDate) {
    matchStage.transactionDate = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) matchStage.transactionDate.$gte = start;
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999Z`);
      if (!isNaN(end.getTime())) matchStage.transactionDate.$lte = end;
    }
  }

  // Fetch matching transactions sorted by date descending
  const transactions = await Transaction.find(matchStage)
    .sort({ transactionDate: -1, createdAt: -1 })
    .lean();

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = {};
  const monthlyMap = {};

  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  let currentMonthIncome = 0;
  let currentMonthExpense = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    const dateStr = new Date(tx.transactionDate).toISOString();
    const monthKey = dateStr.slice(0, 7); // YYYY-MM

    // Initialize month in map
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, income: 0, expense: 0 };
    }

    if (tx.type === 'Income') {
      totalIncome += amount;
      monthlyMap[monthKey].income += amount;
      if (monthKey === currentMonthKey) currentMonthIncome += amount;
    } else if (tx.type === 'Expense') {
      totalExpense += amount;
      monthlyMap[monthKey].expense += amount;
      if (monthKey === currentMonthKey) currentMonthExpense += amount;

      // Group by category
      const cat = tx.category || 'others';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, totalAmount: 0, count: 0 };
      }
      categoryMap[cat].totalAmount += amount;
      categoryMap[cat].count += 1;
    }
  }

  const totalBalance = totalIncome - totalExpense;
  const savings = totalIncome - totalExpense; // Net cash flow / savings

  // Format top expense categories (sorted descending by amount)
  const topExpenseCategories = Object.values(categoryMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((item) => ({
      ...item,
      totalAmount: Math.round(item.totalAmount * 100) / 100,
      percentage: totalExpense > 0 ? Math.round((item.totalAmount / totalExpense) * 1000) / 10 : 0,
    }))
    .slice(0, 5);

  // Format monthly trend (sorted chronologically ascending)
  const monthlyTrend = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      month: item.month,
      income: Math.round(item.income * 100) / 100,
      expense: Math.round(item.expense * 100) / 100,
      netFlow: Math.round((item.income - item.expense) * 100) / 100,
    }));

  return {
    summary: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      currentBalance: Math.round(totalBalance * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      totalTransactions: transactions.length,
      monthlyIncome: Math.round(currentMonthIncome * 100) / 100,
      monthlyExpense: Math.round(currentMonthExpense * 100) / 100,
    },
    topExpenseCategories,
    monthlyTrend,
    recentTransactions: transactions.slice(0, 5),
    allTransactions: transactions, // included for export streaming
  };
};

// ─── 2. Generate Professional PDF Report ──────────────────────────────────────
const generatePdfReport = async (user, reportData, { startDate, endDate }, res) => {
  const { summary, topExpenseCategories, monthlyTrend, allTransactions } = reportData;

  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true, // enables two-pass page numbering
  });

  // Set HTTP headers for direct PDF stream download
  const dateTag = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Pocket_CA_Report_${dateTag}.pdf"`);
  doc.pipe(res);

  // Styling Constants
  const PRIMARY_COLOR = '#6366F1'; // Indigo
  const TEXT_DARK = '#1E293B';
  const TEXT_MUTED = '#64748B';
  const LINE_COLOR = '#E2E8F0';
  const BG_LIGHT = '#F8FAFC';

  // ── Header & Title ────────────────────────────────────────────────────────
  doc.fillColor(PRIMARY_COLOR).fontSize(20).font('Helvetica-Bold').text('POCKET C.A.', 50, 50);
  doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica').text('AI-Powered Financial Assistant & Ledger', 50, 72);

  doc.fillColor(TEXT_DARK).fontSize(14).font('Helvetica-Bold').text('EXECUTIVE FINANCIAL REPORT', 300, 50, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_MUTED).text(`Generated: ${new Date().toLocaleDateString()}`, 300, 68, { align: 'right' });

  const rangeStr = startDate && endDate ? `${startDate} to ${endDate}` : startDate ? `From ${startDate}` : endDate ? `Until ${endDate}` : 'All Time Ledger';
  doc.text(`Period: ${rangeStr}`, 300, 82, { align: 'right' });
  doc.text(`Account: ${user.name} (${user.email})`, 300, 96, { align: 'right' });

  // Horizontal Rule
  doc.moveTo(50, 120).lineTo(545, 120).strokeColor(LINE_COLOR).lineWidth(1).stroke();

  // ── Section 1: Financial Summary Box ──────────────────────────────────────
  let y = 140;
  doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold').text('1. Financial Summary Overview', 50, y);
  y += 25;

  const boxes = [
    { label: 'Total Income', val: `Rs. ${summary.totalIncome.toLocaleString()}`, col: '#10B981' },
    { label: 'Total Expense', val: `Rs. ${summary.totalExpense.toLocaleString()}`, col: '#F43F5E' },
    { label: 'Net Balance', val: `Rs. ${summary.currentBalance.toLocaleString()}`, col: PRIMARY_COLOR },
    { label: 'Total Records', val: `${summary.totalTransactions} items`, col: TEXT_DARK },
  ];

  const boxWidth = 115;
  boxes.forEach((b, idx) => {
    const x = 50 + idx * (boxWidth + 11);
    doc.roundedRect(x, y, boxWidth, 55, 6).fill(BG_LIGHT);
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text(b.label, x + 10, y + 10, { width: boxWidth - 20, align: 'center' });
    doc.fillColor(b.col).fontSize(11).font('Helvetica-Bold').text(b.val, x + 5, y + 28, { width: boxWidth - 10, align: 'center' });
  });

  y += 75;

  // ── Section 2: Top Expense Categories Table ────────────────────────────────
  doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold').text('2. Expense Category Breakdown', 50, y);
  y += 20;

  // Table Header
  doc.rect(50, y, 495, 20).fill('#EEF2FF');
  doc.fillColor(PRIMARY_COLOR).fontSize(9).font('Helvetica-Bold');
  doc.text('Category Name', 60, y + 6);
  doc.text('Transactions', 230, y + 6);
  doc.text('Total Spent (Rs.)', 350, y + 6, { align: 'right', width: 80 });
  doc.text('Share (%)', 450, y + 6, { align: 'right', width: 80 });
  y += 20;

  if (topExpenseCategories.length === 0) {
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Oblique').text('No expense records found in this period.', 60, y + 8);
    y += 25;
  } else {
    topExpenseCategories.forEach((cat, idx) => {
      if (idx % 2 === 1) doc.rect(50, y, 495, 20).fill(BG_LIGHT);
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica');
      doc.text(cat.category.toUpperCase(), 60, y + 6);
      doc.text(`${cat.count} txns`, 230, y + 6);
      doc.text(cat.totalAmount.toLocaleString(), 350, y + 6, { align: 'right', width: 80 });
      doc.text(`${cat.percentage}%`, 450, y + 6, { align: 'right', width: 80 });
      y += 20;
    });
  }

  y += 25;

  // ── Section 3: Monthly Analytics Table ─────────────────────────────────────
  if (y > 650) { doc.addPage(); y = 50; }
  doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold').text('3. Monthly Financial Trend', 50, y);
  y += 20;

  doc.rect(50, y, 495, 20).fill('#EEF2FF');
  doc.fillColor(PRIMARY_COLOR).fontSize(9).font('Helvetica-Bold');
  doc.text('Month / Period', 60, y + 6);
  doc.text('Income (Rs.)', 200, y + 6, { align: 'right', width: 100 });
  doc.text('Expense (Rs.)', 320, y + 6, { align: 'right', width: 100 });
  doc.text('Net Cash Flow', 440, y + 6, { align: 'right', width: 90 });
  y += 20;

  if (monthlyTrend.length === 0) {
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Oblique').text('No monthly activity logged.', 60, y + 8);
    y += 25;
  } else {
    monthlyTrend.forEach((m, idx) => {
      if (y > 750) { doc.addPage(); y = 50; }
      if (idx % 2 === 1) doc.rect(50, y, 495, 20).fill(BG_LIGHT);
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(m.month, 60, y + 6);
      doc.fillColor('#10B981').text(m.income.toLocaleString(), 200, y + 6, { align: 'right', width: 100 });
      doc.fillColor('#F43F5E').text(m.expense.toLocaleString(), 320, y + 6, { align: 'right', width: 100 });
      doc.fillColor(m.netFlow >= 0 ? PRIMARY_COLOR : '#F43F5E').font('Helvetica-Bold').text(m.netFlow.toLocaleString(), 440, y + 6, { align: 'right', width: 90 });
      y += 20;
    });
  }

  y += 25;

  // ── Section 4: Transaction Ledger (Up to 25 items for PDF brevity) ─────────
  if (y > 600) { doc.addPage(); y = 50; }
  doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold').text('4. Detailed Transaction Ledger (Latest 25)', 50, y);
  y += 20;

  doc.rect(50, y, 495, 20).fill('#EEF2FF');
  doc.fillColor(PRIMARY_COLOR).fontSize(9).font('Helvetica-Bold');
  doc.text('Date', 60, y + 6);
  doc.text('Description / Note', 130, y + 6, { width: 180 });
  doc.text('Category', 320, y + 6);
  doc.text('Type', 410, y + 6);
  doc.text('Amount (Rs.)', 450, y + 6, { align: 'right', width: 85 });
  y += 20;

  const displayTx = allTransactions.slice(0, 25);
  if (displayTx.length === 0) {
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Oblique').text('No transactions found.', 60, y + 8);
  } else {
    displayTx.forEach((tx, idx) => {
      if (y > 760) { doc.addPage(); y = 50; }
      if (idx % 2 === 1) doc.rect(50, y, 495, 20).fill(BG_LIGHT);
      const dStr = new Date(tx.transactionDate).toISOString().split('T')[0];
      doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(dStr, 60, y + 6);
      doc.text(tx.description || '—', 130, y + 6, { width: 180, lineBreak: false });
      doc.text((tx.category || 'others').toUpperCase(), 320, y + 6);
      doc.fillColor(tx.type === 'Income' ? '#10B981' : '#F43F5E').font('Helvetica-Bold').text(tx.type, 410, y + 6);
      doc.text(Number(tx.amount).toLocaleString(), 450, y + 6, { align: 'right', width: 85 });
      y += 20;
    });
  }

  // ── Page Numbers & Footer (Two-Pass) ───────────────────────────────────────
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.moveTo(50, 780).lineTo(545, 780).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
    doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica')
      .text('Pocket C.A. — Confidential Financial Statement', 50, 790);
    doc.text(`Page ${i + 1} of ${pageCount}`, 400, 790, { align: 'right', width: 145 });
  }

  doc.end();
};

// ─── 3. Generate Multi-Sheet Excel Workbook ───────────────────────────────────
const generateExcelReport = async (user, reportData, { startDate, endDate }, res) => {
  const { summary, topExpenseCategories, monthlyTrend, allTransactions } = reportData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pocket C.A.';
  workbook.lastModifiedBy = user.name;
  workbook.created = new Date();

  // Helper for applying header formatting
  const styleHeaders = (sheet, rowIdx = 1) => {
    const row = sheet.getRow(rowIdx);
    row.font = { name: 'Calibri', family: 4, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Dark Slate Blue
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.height = 24;
  };

  // Helper for auto-fitting column widths
  const autoFitColumns = (sheet) => {
    sheet.columns.forEach((col) => {
      let maxLen = 12;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(Math.max(maxLen + 4, 15), 50);
    });
  };

  // ── Sheet 1: Financial Summary ─────────────────────────────────────────────
  const s1 = workbook.addWorksheet('Financial Summary', { views: [{ showGridLines: true }] });
  
  s1.mergeCells('A1:D1');
  const titleCell = s1.getCell('A1');
  titleCell.value = 'POCKET C.A. — FINANCIAL SUMMARY REPORT';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF6366F1' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  s1.getRow(1).height = 32;

  s1.getCell('A3').value = 'User Account:';
  s1.getCell('B3').value = `${user.name} (${user.email})`;
  s1.getCell('A4').value = 'Generated On:';
  s1.getCell('B4').value = new Date().toLocaleDateString();
  s1.getCell('A5').value = 'Period Filter:';
  s1.getCell('B5').value = startDate && endDate ? `${startDate} to ${endDate}` : 'All Time Ledger';
  ['A3', 'A4', 'A5'].forEach((c) => (s1.getCell(c).font = { bold: true }));

  s1.getCell('A7').value = 'Key Financial Metric';
  s1.getCell('B7').value = 'Amount / Value';
  styleHeaders(s1, 7);

  const summaryRows = [
    ['Total Income', summary.totalIncome],
    ['Total Expense', summary.totalExpense],
    ['Current Net Balance', summary.currentBalance],
    ['Net Savings Flow', summary.savings],
    ['Total Transactions Recorded', summary.totalTransactions],
  ];

  summaryRows.forEach((r, idx) => {
    const row = s1.addRow(r);
    if (idx < 4) row.getCell(2).numFmt = '₹#,##0.00';
  });

  s1.getCell('A15').value = 'Top Expense Categories';
  s1.getCell('B15').value = 'Total Spent (₹)';
  s1.getCell('C15').value = 'Share (%)';
  styleHeaders(s1, 15);

  topExpenseCategories.forEach((cat) => {
    const row = s1.addRow([cat.category.toUpperCase(), cat.totalAmount, cat.percentage / 100]);
    row.getCell(2).numFmt = '₹#,##0.00';
    row.getCell(3).numFmt = '0.0%';
  });

  autoFitColumns(s1);

  // ── Sheet 2: Income Transactions ───────────────────────────────────────────
  const s2 = workbook.addWorksheet('Income Transactions');
  s2.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Description / Note', key: 'desc' },
    { header: 'Category', key: 'cat' },
    { header: 'Payment Method', key: 'method' },
    { header: 'Amount (₹)', key: 'amount' },
  ];
  styleHeaders(s2, 1);

  allTransactions
    .filter((t) => t.type === 'Income')
    .forEach((t) => {
      const row = s2.addRow({
        date: new Date(t.transactionDate),
        desc: t.description || '—',
        cat: (t.category || 'others').toUpperCase(),
        method: (t.paymentMethod || 'other').toUpperCase(),
        amount: Number(t.amount),
      });
      row.getCell(1).numFmt = 'YYYY-MM-DD';
      row.getCell(5).numFmt = '₹#,##0.00';
    });
  autoFitColumns(s2);

  // ── Sheet 3: Expense Transactions ──────────────────────────────────────────
  const s3 = workbook.addWorksheet('Expense Transactions');
  s3.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Description / Note', key: 'desc' },
    { header: 'Category', key: 'cat' },
    { header: 'Payment Method', key: 'method' },
    { header: 'Amount (₹)', key: 'amount' },
  ];
  styleHeaders(s3, 1);

  allTransactions
    .filter((t) => t.type === 'Expense')
    .forEach((t) => {
      const row = s3.addRow({
        date: new Date(t.transactionDate),
        desc: t.description || '—',
        cat: (t.category || 'others').toUpperCase(),
        method: (t.paymentMethod || 'other').toUpperCase(),
        amount: Number(t.amount),
      });
      row.getCell(1).numFmt = 'YYYY-MM-DD';
      row.getCell(5).numFmt = '₹#,##0.00';
    });
  autoFitColumns(s3);

  // ── Sheet 4: Monthly Analytics ─────────────────────────────────────────────
  const s4 = workbook.addWorksheet('Monthly Analytics');
  s4.columns = [
    { header: 'Month / Period', key: 'month' },
    { header: 'Total Income (₹)', key: 'income' },
    { header: 'Total Expense (₹)', key: 'expense' },
    { header: 'Net Savings Flow (₹)', key: 'netFlow' },
  ];
  styleHeaders(s4, 1);

  monthlyTrend.forEach((m) => {
    const row = s4.addRow({
      month: m.month,
      income: m.income,
      expense: m.expense,
      netFlow: m.netFlow,
    });
    row.getCell(2).numFmt = '₹#,##0.00';
    row.getCell(3).numFmt = '₹#,##0.00';
    row.getCell(4).numFmt = '₹#,##0.00';
  });
  autoFitColumns(s4);

  // Stream workbook to response
  const dateTag = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Pocket_CA_Report_${dateTag}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  getReportSummary,
  generatePdfReport,
  generateExcelReport,
};
