'use client';

import { useState } from 'react';
import { Sparkles, Brain, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

interface AnalysisResult {
  summary?: string;
  unstatedAssumptions?: string[];
  hiddenTradeOffs?: string[];
  criticalQuestions?: string[];
  error?: string;
}

export default function Home() {
  const [decision, setDecision] = useState('');
  const [details, setDetails] = useState('');
  const [priorities, setPriorities] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, details, priorities }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        alert(`API Error: ${data.error || 'Failed to fetch analysis'}`);
        return;
      }
      
      setResult(data);
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>POWERED BY GOOGLE GEMINI 2.5</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mt-2 text-white">
            Decision Blind Spot Analyzer
          </h1>
          <p className="text-slate-400 mt-1">
            Identify unstated assumptions, trade-offs, and critical Socratic questions before committing to a decision.
          </p>
        </header>

        <form onSubmit={handleAnalyze} className="space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div>
            <label className="block text-sm font-medium mb-1">What decision are you considering?</label>
            <input
              type="text"
              required
              placeholder="e.g., Accepting a 6-month internship during final year college"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Key Context & Details</label>
            <textarea
              rows={3}
              placeholder="e.g., $1,200/mo stipend, 15-min commute, 40 hrs/week. 3 days/week mandatory lectures."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Main Reasons / Priorities</label>
            <input
              type="text"
              placeholder="e.g., High stipend, close to home, resume value"
              value={priorities}
              onChange={(e) => setPriorities(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Analyze Blind Spots</span>}
          </button>
        </form>

        {result && (
          <div className="space-y-6">
            {result.summary && (
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-lg">
                <p className="text-slate-300 italic">"{result.summary}"</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center space-x-2 text-amber-400 font-bold mb-3">
                  <Brain className="w-5 h-5" />
                  <h3>Unstated Assumptions</h3>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                  {(result.unstatedAssumptions || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center space-x-2 text-rose-400 font-bold mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <h3>Hidden Trade-offs</h3>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                  {(result.hiddenTradeOffs || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-slate-900 border border-indigo-900/50 rounded-xl p-6">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-3">
                <HelpCircle className="w-5 h-5" />
                <h3>Socratic Questions to Consider</h3>
              </div>
              <ul className="space-y-3">
                {(result.criticalQuestions || []).map((q, idx) => (
                  <li key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-200 text-sm">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}