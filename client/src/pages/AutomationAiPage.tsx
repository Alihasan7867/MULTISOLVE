import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileScan,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Brain,
  CheckCircle2,
  Send,
  Copy,
} from 'lucide-react';
import { apiRequest } from '../services/api';

export const AutomationAiPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'ocr' | 'categorize' | 'duplicates' | 'cashflow'>('assistant');

  // 1. Natural Language Assistant
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your MULTISOLVE Financial Intelligence Assistant. Ask me anything about your revenue, profit margins, inventory levels, or accounts receivable!',
    },
  ]);
  const [queryLoading, setQueryLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setChatLog((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setQueryLoading(true);

    try {
      const res = await apiRequest<{ reply: string }>('/automation/query-assistant', {
        method: 'POST',
        body: JSON.stringify({ query: userText }),
      });
      setChatLog((prev) => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err: any) {
      setChatLog((prev) => [...prev, { sender: 'ai', text: 'Error querying records: ' + err.message }]);
    } finally {
      setQueryLoading(false);
    }
  };

  // 2. Invoice OCR Scanner
  const [ocrText, setOcrText] = useState(
    'TAX INVOICE\nInvoice No: INV-2026-9901\nDate: 22/11/2026\nGSTIN: 27AABCT1234A1Z5\nBilled To: TechCorp Solutions Ltd\nProduct: Apple MacBook Pro 16\nTotal Amount: ₹2,49,900.00'
  );
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleRunOcr = async () => {
    setOcrLoading(true);
    try {
      const res = await apiRequest<{ extracted: any }>('/automation/ocr-invoice', {
        method: 'POST',
        body: JSON.stringify({ rawText: ocrText }),
      });
      setOcrResult(res.extracted);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // 3. Smart Expense Categorization
  const [expTitle, setExpTitle] = useState('Uber ride to client office at Bandra BKC');
  const [catSuggestion, setCatSuggestion] = useState<any>(null);

  const handleCategorize = async () => {
    try {
      const res = await apiRequest<any>('/automation/categorize-expense', {
        method: 'POST',
        body: JSON.stringify({ title: expTitle }),
      });
      setCatSuggestion(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 4. Duplicate Detector
  const [dupInvoice, setDupInvoice] = useState('INV-2026-00001');
  const [dupResult, setDupResult] = useState<any>(null);

  const handleCheckDuplicates = async () => {
    try {
      const res = await apiRequest<any>('/automation/detect-duplicates', {
        method: 'POST',
        body: JSON.stringify({ invoiceNumber: dupInvoice }),
      });
      setDupResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5. Cash Flow Forecasting
  const [forecast, setForecast] = useState<any[]>([]);

  useEffect(() => {
    async function loadForecast() {
      try {
        const res = await apiRequest<{ forecast: any[] }>('/automation/cashflow-forecast');
        setForecast(res.forecast);
      } catch (err: any) {
        console.error(err);
      }
    }
    loadForecast();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">AI & Automation Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8DE] text-[#174D40] flex items-center gap-1">
              <Sparkles size={12} /> Ready & Active
            </span>
          </div>
          <p className="text-xs text-[#929292] mt-1">
            Machine intelligence for natural language finance questions, OCR invoice ingestion, and duplicate fraud prevention.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-[#EAEAEA]">
        {[
          { id: 'assistant', label: 'Financial Assistant (NLP)', icon: MessageSquare },
          { id: 'ocr', label: 'Invoice OCR Parser', icon: FileScan },
          { id: 'categorize', label: 'Smart Categorizer', icon: Brain },
          { id: 'duplicates', label: 'Duplicate Detection', icon: AlertTriangle },
          { id: 'cashflow', label: 'Cash Flow Forecast', icon: TrendingUp },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-[#174D40] text-white shadow-xs'
                  : 'text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]'
              }`}
            >
              <Icon size={14} className={activeTab === t.id ? 'text-[#98E66B]' : ''} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Natural Language Assistant */}
      {activeTab === 'assistant' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft flex flex-col h-[520px]">
          <div className="pb-3 border-b border-[#EAEAEA]">
            <h3 className="font-extrabold text-base text-[#171717]">Natural Language Business Query</h3>
            <p className="text-xs text-[#929292]">Ask in plain English about your revenue, stocks, debts, or earnings</p>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs max-w-xl ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    msg.sender === 'user' ? 'bg-[#174D40] text-white' : 'bg-[#E8F8DE] text-[#174D40]'
                  }`}
                >
                  {msg.sender === 'user' ? 'You' : <Sparkles size={14} />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-[#174D40] text-white'
                      : 'bg-[#F5F5F5] text-[#171717] border border-[#EAEAEA]'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {queryLoading && (
              <div className="flex gap-2 text-xs text-[#929292] items-center">
                <Sparkles size={14} className="text-[#174D40] animate-spin" />
                <span>MULTISOLVE AI is analyzing ledger records...</span>
              </div>
            )}
          </div>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-2 py-2">
            {[
              'How much did my business earn this month?',
              'Which products are low on stock?',
              'How much money do customers owe us?',
              'What are our total expenses?',
            ].map((suggest, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(suggest)}
                className="px-2.5 py-1 rounded-lg bg-[#F5F5F5] hover:bg-[#E8F8DE] text-[11px] text-[#171717] font-semibold transition-colors"
              >
                {suggest}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleAsk} className="flex gap-2 pt-2 border-t border-[#EAEAEA]">
            <input
              type="text"
              placeholder="Ask a question about your business data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-[#F5F5F5] text-xs text-[#171717] px-4 py-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={queryLoading}
              className="px-5 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      )}

      {/* 2. Invoice OCR */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Document / Scanned Invoice Content</h3>
              <p className="text-xs text-[#929292]">Simulate receipt optical character scanning</p>
            </div>
            <textarea
              rows={9}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-2xl p-3 text-xs font-mono text-[#171717] focus:outline-none"
            ></textarea>
            <button
              onClick={handleRunOcr}
              disabled={ocrLoading}
              className="px-5 py-2.5 bg-[#174D40] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs"
            >
              <FileScan size={15} className="text-[#98E66B]" />
              {ocrLoading ? 'Parsing Document...' : 'Extract Fields via OCR'}
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
            <h3 className="font-extrabold text-base text-[#171717]">Extracted Structured Metadata</h3>
            {ocrResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#E8F8DE] rounded-xl flex items-center gap-2 text-[#174D40] font-bold">
                  <CheckCircle2 size={16} /> Confidence Score: 94%
                </div>
                <div className="space-y-2 p-4 bg-[#F5F5F5] rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-[#929292]">Detected Invoice #:</span>
                    <span className="font-bold text-[#171717]">{ocrResult.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929292]">Document Date:</span>
                    <span className="font-bold text-[#171717]">{ocrResult.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929292]">Extracted GSTIN:</span>
                    <span className="font-mono font-bold text-[#174D40]">{ocrResult.gstin || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929292]">Suggested Total:</span>
                    <span className="font-black text-sm text-[#171717]">
                      ₹{ocrResult.suggestedTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#929292] py-8 text-center">
                Click &quot;Extract Fields via OCR&quot; to parse invoice parameters.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. Smart Categorization */}
      {activeTab === 'categorize' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft max-w-xl space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">Smart Expense Categorizer</h3>
            <p className="text-xs text-[#929292]">Natural language classification of expenditure items</p>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-[#171717]">Expense Narration / Description</label>
            <input
              type="text"
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
            />
          </div>

          <button
            onClick={handleCategorize}
            className="px-5 py-2.5 bg-[#174D40] text-white text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <Brain size={15} className="text-[#98E66B]" /> Predict Category
          </button>

          {catSuggestion && (
            <div className="p-4 bg-[#E8F8DE] rounded-2xl text-xs space-y-1">
              <span className="text-[11px] font-bold text-[#174D40] uppercase">Suggested Ledger Category</span>
              <div className="text-lg font-black text-[#174D40]">{catSuggestion.suggestedCategory}</div>
              <div className="text-[11px] text-[#174D40]/80">
                Confidence rating: {(catSuggestion.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Duplicate Detection */}
      {activeTab === 'duplicates' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft max-w-xl space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">Duplicate Invoice Prevention</h3>
            <p className="text-xs text-[#929292]">Real-time detection of accidental duplicate bill entry</p>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-[#171717]">Check Document Number</label>
            <input
              type="text"
              value={dupInvoice}
              onChange={(e) => setDupInvoice(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
            />
          </div>

          <button
            onClick={handleCheckDuplicates}
            className="px-5 py-2.5 bg-[#174D40] text-white text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <AlertTriangle size={15} className="text-[#98E66B]" /> Run Duplicate Check
          </button>

          {dupResult && (
            <div
              className={`p-4 rounded-2xl text-xs space-y-1 border ${
                dupResult.isDuplicateLikely
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-[#E8F8DE] border-[#98E66B]/40 text-[#174D40]'
              }`}
            >
              <div className="font-bold">
                {dupResult.isDuplicateLikely ? 'Duplicate Warning Detected' : 'Unique Document Number'}
              </div>
              <div className="text-[11px]">
                {dupResult.isDuplicateLikely
                  ? dupResult.warnings.join(' ')
                  : 'No existing sales or purchase invoices match this document number.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Cash Flow Forecast */}
      {activeTab === 'cashflow' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">Forward Cash Flow Projections</h3>
            <p className="text-xs text-[#929292]">
              Modeled using active customer receivable due dates and vendor credit cycles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forecast.map((fc, i) => (
              <div key={i} className="p-5 bg-[#F5F5F5] rounded-3xl border border-[#EAEAEA] space-y-3">
                <span className="font-bold text-sm text-[#171717]">{fc.period}</span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#929292]">Projected Cash Inflow (Receivables):</span>
                    <span className="font-bold text-[#174D40]">₹{fc.projectedInflow.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929292]">Projected Outflow (Payables & Exp):</span>
                    <span className="font-bold text-[#F87171]">₹{fc.projectedOutflow.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#EAEAEA] font-black text-sm">
                    <span className="text-[#171717]">Net Projected Cash:</span>
                    <span className={fc.netProjectedCash >= 0 ? 'text-[#174D40]' : 'text-[#F87171]'}>
                      ₹{fc.netProjectedCash.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
