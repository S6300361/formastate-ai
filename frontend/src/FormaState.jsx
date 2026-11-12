import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Server,
  RefreshCw,
  DollarSign,
  FileCheck2,
  Scale,
  Code2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const STATE_NAMES = {
  DE: 'Delaware',
  WY: 'Wyoming',
  TX: 'Texas',
  FL: 'Florida',
  CA: 'California',
  NY: 'New York',
  NM: 'New Mexico'
};

export default function FormaStateApp() {
  const [apiUrl] = useState('http://127.0.0.1:8080');
  const [simulationMode, setSimulationMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const [formData, setFormData] = useState({
    business_name: 'FormaTech Solutions LLC',
    industry: 'AI Software',
    residency: 'Foreign_Non_Resident',
    physical_us_presence: false,
    home_state: '',
    target_budget_usd: 561,
    seeking_investment: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (simulationMode) {
      setTimeout(() => {
        setResult({
          client_name: formData.business_name,
          recommendation: {
            recommended_state: formData.seeking_investment ? 'DE' : 'WY',
            state_filing_fee: formData.seeking_investment ? 110 : 100,
            annual_fee: formData.seeking_investment ? 300 : 60,
            reasoning: [
              formData.seeking_investment
                ? 'Delaware preferred by venture capital firms due to established Chancery Court precedent.'
                : 'Wyoming offers strong asset protection, owner anonymity, and low $60 annual maintenance.'
            ],
            compliance_notes: [
              'Must maintain a US Registered Agent with physical address.',
              'FinCEN Beneficial Ownership Information (BOI) Report must be filed within designated statutory deadline.'
            ]
          },
          name_availability: {
            name: formData.business_name,
            state: formData.seeking_investment ? 'DE' : 'WY',
            is_available: true,
            suggestions: []
          },
          compliance_notices: [
            'IRS EIN application requires Form SS-4 submitted via Fax or Mail (No SSN required online).\nMust submit Form 5472 + Form 1120 annually for foreign-owned single-member LLCs even if $0 US tax is owed.\nStrict compliance with FinCEN CTA rules: Identify ultimate beneficial owners owning >= 25% direct/indirect control.'
          ]
        });
        setLoading(false);
      }, 900);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/v1/llc-advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to FastAPI backend. Ensure Uvicorn is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to cleanly split newline-delimited compliance notices into individual items
  const parseComplianceItems = (res) => {
    if (!res) return [];
    const rawList = [
      ...(res.recommendation?.compliance_notes || []),
      ...(res.compliance_notices || [])
    ];
    return rawList
      .flatMap((item) => item.split('\n'))
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const stateCode = result?.recommendation?.recommended_state || '';
  const stateDisplay = STATE_NAMES[stateCode] ? `${STATE_NAMES[stateCode]} (${stateCode})` : stateCode || 'Analysis Complete';
  const filingFee = result?.recommendation?.state_filing_fee ?? 0;
  const annualFee = result?.recommendation?.annual_fee ?? 0;
  const complianceItems = parseComplianceItems(result);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FormaState AI</h1>
              <p className="text-xs text-slate-400">Multi-Agent U.S. LLC Formation & Compliance Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                simulationMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${simulationMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              {simulationMode ? 'Simulation Mode' : 'Cloud API Connected'}
            </div>
            <button
              type="button"
              onClick={() => setSimulationMode(!simulationMode)}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
            >
              Toggle
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Intake Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Client Profile Intake
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Proposed Business Name</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Industry / Sector</label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Founder Residency Status</label>
              <select
                value={formData.residency}
                onChange={(e) => setFormData({ ...formData, residency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Foreign_Non_Resident">Foreign Non-Resident</option>
                <option value="US_Citizen">U.S. Citizen</option>
                <option value="US_Resident">U.S. Resident</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Formation Budget (USD)</label>
              <input
                type="number"
                required
                value={formData.target_budget_usd}
                onChange={(e) => setFormData({ ...formData, target_budget_usd: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.physical_us_presence}
                  onChange={(e) => setFormData({ ...formData, physical_us_presence: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600"
                />
                Physical U.S. Office / Nexus
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.seeking_investment}
                  onChange={(e) => setFormData({ ...formData, seeking_investment: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600"
                />
                Seeking VC Funding
              </label>
            </div>

            {formData.physical_us_presence && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Home State (e.g., TX, NY, CA)</label>
                <input
                  type="text"
                  value={formData.home_state}
                  onChange={(e) => setFormData({ ...formData, home_state: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Executing Agent Graph...' : 'Execute Multi-Agent System'}
            </button>
          </form>
        </div>

        {/* Agent Output Panel */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Backend Connection Error</p>
                <p className="text-red-200/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="bg-slate-900/50 border border-slate-800/80 border-dashed rounded-2xl p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-300">Ready for Multi-Agent Execution</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Submit the client intake profile on the left to trigger FormaAdvisor, SOS-Verify, and FormaGuard compliance checks.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* 1. Primary Recommendation Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                      Recommended Jurisdiction for {result.client_name || formData.business_name}
                    </span>
                    <h3 className="text-2xl font-bold mt-1 text-white">{stateDisplay}</h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Strategy Verified
                  </span>
                </div>

                {/* Strategic Reasoning */}
                {result.recommendation?.reasoning?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-indigo-400" />
                      Advisory Rationale
                    </p>
                    <ul className="space-y-2">
                      {result.recommendation.reasoning.map((reason, idx) => (
                        <li key={idx} className="text-sm text-slate-200 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cost Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                      State Filing Fee
                    </span>
                    <p className="text-xl font-bold text-white mt-1">${filingFee}</p>
                    <span className="text-[11px] text-slate-500">One-time registration</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      Annual State Tax / Fee
                    </span>
                    <p className="text-xl font-bold text-white mt-1">${annualFee}/yr</p>
                    <span className="text-[11px] text-slate-500">Recurring state obligation</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Your Budget Fit</span>
                    <p className={`text-xl font-bold mt-1 ${formData.target_budget_usd >= filingFee ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formData.target_budget_usd >= filingFee ? 'Within Budget' : 'Over Budget'}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      ${Math.max(0, formData.target_budget_usd - filingFee)} remaining for Agent/EIN
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Secretary of State Name Availability Card */}
              {result.name_availability && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {result.name_availability.is_available ? (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 mt-0.5">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 mt-0.5">
                        <XCircle className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Secretary of State Registry Check ({result.name_availability.state})
                      </span>
                      <h4 className="text-base font-semibold text-white mt-0.5">
                        {result.name_availability.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {result.name_availability.is_available
                          ? 'Entity name is distinguishable and available for immediate registration.'
                          : 'Name conflict detected in state registry. Consider an alternative suffix.'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      result.name_availability.is_available
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {result.name_availability.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              )}

              {/* 3. Federal & State Compliance Action Checklist */}
              {complianceItems.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-base font-semibold text-white">
                      Mandatory Compliance & IRS Action Plan
                    </h4>
                  </div>

                  <ul className="space-y-3">
                    {complianceItems.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 text-sm text-slate-200"
                      >
                        <span className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Collapsible Raw JSON Developer Inspector */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    Developer Payload Inspector (Raw JSON)
                  </span>
                  {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showRawJson && (
                  <pre className="p-4 bg-slate-950 border-t border-slate-800 overflow-x-auto text-xs text-slate-400 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}