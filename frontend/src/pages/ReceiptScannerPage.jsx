/**
 * pages/ReceiptScannerPage.jsx — OCR Receipt Scanner Interface
 * Pocket C.A. Frontend
 *
 * Allows users to upload receipt images (drag-and-drop or file browser), process them
 * through Tesseract OCR and heuristic parsing, preview/edit extracted data, and confirm
 * to create an authenticated transaction.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  ScanLine,
  FileText,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  DollarSign,
  Calendar,
  CreditCard,
  Tag,
  Store,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { scanReceipt } from '../services/ocrService';
import { createTransaction } from '../services/transactionService';
import ROUTES from '../constants/routes';

const CATEGORY_OPTIONS = [
  { value: 'food', label: '🍔 Food & Dining' },
  { value: 'shopping', label: '🛍️ Shopping & Retail' },
  { value: 'transport', label: '🚗 Transport & Travel' },
  { value: 'utilities', label: '⚡ Utilities & Bills' },
  { value: 'healthcare', label: '🏥 Healthcare & Pharma' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'rent', label: '🏠 Rent & Housing' },
  { value: 'emi', label: '🏦 Loan / EMI' },
  { value: 'education', label: '📚 Education' },
  { value: 'insurance', label: '🛡️ Insurance' },
  { value: 'others', label: '📦 Others / Office Supplies' },
];

const PAYMENT_OPTIONS = [
  { value: 'card', label: '💳 Credit / Debit Card' },
  { value: 'upi', label: '📱 UPI (GPay / PhonePe / Paytm)' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer / NEFT' },
  { value: 'other', label: '🔄 Other Payment' },
];

const ReceiptScannerPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Form State for Editing Extracted Data
  const [formData, setFormData] = useState({
    type: 'Expense',
    merchantName: '',
    totalAmount: '',
    taxAmount: '',
    transactionDate: new Date().toISOString().split('T')[0],
    category: 'others',
    paymentMethod: 'card',
    receiptNumber: '',
    description: '',
  });

  // Handle File Validation & Upload
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    // Validate size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Receipt image exceeds the maximum allowed file size of 5MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Unsupported file type. Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Start OCR scanning process
    await startOcrScan(selectedFile);
  };

  const startOcrScan = async (fileToScan) => {
    setIsScanning(true);
    setUploadProgress(0);
    setScanStep('Uploading image to OCR engine...');
    setExtractedData(null);

    try {
      const res = await scanReceipt(fileToScan, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
          if (percent >= 100) {
            setScanStep('Running Tesseract Optical Character Recognition...');
          }
        }
      });

      if (res && res.success && res.data) {
        setScanStep('Parsing financial line items...');
        setTimeout(() => {
          const ext = res.data.extracted;
          setExtractedData(res.data);
          setFormData({
            type: 'Expense',
            merchantName: ext.merchantName || 'Retail Store',
            totalAmount: ext.totalAmount || '',
            taxAmount: ext.taxAmount || '',
            transactionDate: ext.transactionDate || new Date().toISOString().split('T')[0],
            category: ext.suggestedCategory || 'others',
            paymentMethod: ext.paymentMethod || 'card',
            receiptNumber: ext.receiptNumber || '',
            description: `Receipt: ${ext.merchantName || 'Retail Store'}${ext.receiptNumber ? ` [${ext.receiptNumber}]` : ''}`,
          });
          setIsScanning(false);
          toast.success('Receipt scanned and extracted successfully!');
        }, 500);
      } else {
        throw new Error('Invalid response from OCR server');
      }
    } catch (err) {
      console.error('[OCR Scan Error]', err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'OCR scanning failed. Please try a clearer receipt photo.';
      toast.error(errMsg);
      setIsScanning(false);
      resetScanner();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const resetScanner = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setExtractedData(null);
    setShowRawText(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'merchantName' && {
        description: `Receipt: ${value}${prev.receiptNumber ? ` [${prev.receiptNumber}]` : ''}`,
      }),
      ...(name === 'receiptNumber' && {
        description: `Receipt: ${prev.merchantName}${value ? ` [${value}]` : ''}`,
      }),
    }));
  };

  // Confirm and Save Transaction
  const handleConfirmSave = async (e) => {
    e.preventDefault();
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      toast.error('Please enter a valid positive total amount.');
      return;
    }
    if (!formData.merchantName.trim()) {
      toast.error('Please enter the merchant or store name.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        type: formData.type,
        category: formData.category,
        amount: Number(formData.totalAmount),
        description: formData.description || `Receipt: ${formData.merchantName}`,
        transactionDate: formData.transactionDate,
        paymentMethod: formData.paymentMethod,
        tags: ['OCR', 'Verified'],
      };

      await createTransaction(payload);
      toast.success('Transaction saved to your ledger successfully!');
      resetScanner();
      navigate(ROUTES.TRANSACTIONS);
    } catch (err) {
      console.error('[Save Transaction Error]', err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to save transaction. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            OCR Receipt Scanner <Sparkles size={22} style={{ color: 'var(--color-primary)' }} />
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Upload receipt photos to extract merchant, amount, date, and category using intelligent Tesseract OCR
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm" style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--color-primary)' }}>
          <ScanLine size={15} className="animate-pulse" />
          Powered by Tesseract OCR Engine
        </div>
      </div>

      {/* Main Scanner Container */}
      {!extractedData && !isScanning ? (
        /* ── Step 1: Drag & Drop Upload Zone ─────────────────────────────────── */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-card p-12 text-center rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden border-2 border-dashed flex flex-col items-center justify-center min-h-[420px] ${
            isDragOver ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]' : 'border-white/15 hover:border-indigo-400/50 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 bg-indigo-500" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10 bg-purple-500" />

          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
              border: '1px solid rgba(99,102,241,0.35)',
            }}
          >
            <UploadCloud size={38} style={{ color: 'var(--color-primary)' }} />
          </div>

          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {isDragOver ? 'Drop receipt image to scan now!' : 'Drag & drop receipt image here'}
          </h2>
          <p className="text-sm max-w-md mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Or click anywhere in this zone to browse your computer. We automatically extract merchant names, line items, tax, and totals in seconds.
          </p>

          <button
            type="button"
            className="px-6 py-3 rounded-2xl text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-95 hover:scale-[1.02] flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
          >
            <FileText size={16} />
            Browse Receipt File
          </button>

          <div className="mt-8 flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            <span>✔️ Supports JPG, PNG, WEBP</span>
            <span>●</span>
            <span>✔️ Max File Size: 5 MB</span>
            <span>●</span>
            <span>✔️ 100% Private Processing</span>
          </div>
        </div>
      ) : isScanning ? (
        /* ── Step 2: Processing & OCR Laser Animation ────────────────────────── */
        <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-8 min-h-[420px] relative overflow-hidden">
          {/* Left: Image Thumbnail with Scanning Laser */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-h-[360px] max-w-full bg-slate-900/80">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Receipt scanning preview"
                  className="w-full h-auto max-h-[340px] object-contain opacity-75 filter contrast-125"
                />
              )}
              {/* Laser Scanning Line Animation */}
              <div
                className="absolute inset-x-0 h-1 shadow-[0_0_15px_3px_rgba(34,211,238,0.8)] bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-10 animate-pulse"
                style={{
                  top: `${Math.max(10, Math.min(90, (Date.now() / 30) % 100))}%`, // animated vertical sweep fallback
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
            </div>
            {file && (
              <p className="text-xs mt-2 truncate max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Right: Progress Steps */}
          <div className="w-full md:w-1/2 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 mb-3">
                <RefreshCw size={14} className="animate-spin" />
                OCR Engine Active
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Analyzing Receipt Data...
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {scanStep || 'Extracting optical characters and parsing financial totals...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                <span>Processing Status</span>
                <span>{uploadProgress < 100 ? `${uploadProgress}% (Uploading)` : 'Scanning & Extracting...'}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: uploadProgress < 100 ? `${uploadProgress}%` : '100%',
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary), #22d3ee)',
                  }}
                />
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 size={16} />
                <span>Image uploaded and verified (5MB check passed)</span>
              </div>
              <div className={`flex items-center gap-2.5 ${uploadProgress >= 100 ? 'text-indigo-300 font-medium' : 'text-slate-500'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${uploadProgress >= 100 ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>2</div>
                <span>Running Tesseract OCR optical character recognition</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-500">
                <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">3</div>
                <span>Extracting merchant name, tax, date, and category</span>
              </div>
            </div>

            <button
              onClick={resetScanner}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-white/10 hover:bg-white/5 text-slate-400"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      ) : (
        /* ── Step 3: Extracted Data Preview & Review Form ────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Image Preview & Raw OCR Text (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                  Original Receipt Image
                </h3>
                {extractedData.extracted.receiptNumber && (
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    #{extractedData.extracted.receiptNumber}
                  </span>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 max-h-[400px] flex items-center justify-center p-2">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Scanned receipt"
                    className="max-h-[380px] w-auto object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Toggle Raw OCR Text Accordion */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl transition-colors hover:bg-white/5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span className="flex items-center gap-1.5">
                    {showRawText ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showRawText ? 'Hide Raw OCR Text' : 'Inspect Raw Extracted OCR Text'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Tesseract Output
                  </span>
                </button>

                {showRawText && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-white/10 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {extractedData.rawText || 'No raw text extracted.'}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={resetScanner}
              disabled={isSaving}
              className="w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/10 hover:bg-white/5 text-slate-300 shadow-sm"
            >
              <RefreshCw size={15} />
              Scan Another Receipt
            </button>
          </div>

          {/* Right Column: Extracted Values Review Form (7 Cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleConfirmSave} className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--color-bg-border)' }}>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                    Verify Extracted Transaction
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Review and adjust the OCR extracted values below before adding to your ledger
                  </p>
                </div>

                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs font-semibold">
                  {['Expense', 'Income'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: t }))}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        formData.type === t
                          ? t === 'Expense' ? 'bg-rose-500 text-white shadow-md' : 'bg-emerald-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merchant Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Store size={14} className="text-indigo-400" /> Merchant / Store Name *
                  </label>
                  <input
                    type="text"
                    name="merchantName"
                    value={formData.merchantName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Starbucks, Uber, Amazon"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm outline-none focus:border-indigo-500 transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                </div>

                {/* Total Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <DollarSign size={14} className="text-emerald-400" /> Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-base font-bold text-emerald-400 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Tax Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Tag size={14} className="text-purple-400" /> Tax / GST Included (₹)
                  </label>
                  <input
                    type="number"
                    name="taxAmount"
                    value={formData.taxAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm outline-none focus:border-indigo-500 transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                </div>

                {/* Suggested Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Tag size={14} className="text-indigo-400" /> Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-sm outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <CreditCard size={14} className="text-cyan-400" /> Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-sm outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {PAYMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Calendar size={14} className="text-amber-400" /> Transaction Date *
                  </label>
                  <input
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm outline-none focus:border-indigo-500 transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                </div>

                {/* Receipt Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Hash size={14} className="text-slate-400" /> Receipt / Bill Number
                  </label>
                  <input
                    type="text"
                    name="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={handleChange}
                    placeholder="Optional invoice #"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm font-mono outline-none focus:border-indigo-500 transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              {/* Description Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  📝 Ledger Note / Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm outline-none focus:border-indigo-500 transition-colors"
                  style={{ color: 'var(--color-text-primary)' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-end gap-3" style={{ borderColor: 'var(--color-bg-border)' }}>
                <button
                  type="button"
                  onClick={resetScanner}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 transition-all text-slate-300"
                >
                  Cancel / Discard
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all duration-200 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isSaving ? 'Saving to Ledger...' : 'Confirm & Save Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptScannerPage;
