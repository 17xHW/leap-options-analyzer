import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Search, Clock, Activity, Percent, SlidersHorizontal, BarChart2 } from 'lucide-react';
import { bsCallMetrics } from './utils/blackScholes';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [price, setPrice] = useState(150);
  const [expiryDays, setExpiryDays] = useState(365);
  const [riskFreeRate, setRiskFreeRate] = useState(5.0);
  const [volatility, setVolatility] = useState(30.0);
  
  const [priceTarget, setPriceTarget] = useState(200);
  const [priceTarget2, setPriceTarget2] = useState(220);
  const [priceTarget3, setPriceTarget3] = useState(180);
  const [targetDays, setTargetDays] = useState(30);
  
  const [showGreeks, setShowGreeks] = useState(false);

  // New state controls for dynamic strikes
  const [strikeMinPct, setStrikeMinPct] = useState(80);
  const [strikeMaxPct, setStrikeMaxPct] = useState(130);
  const [numStrikes, setNumStrikes] = useState(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrice = async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8001/api/price?ticker=${ticker}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.price) {
        setPrice(data.price);
        setPriceTarget(+(data.price * 1.2).toFixed(2));
        setPriceTarget2(+(data.price * 1.3).toFixed(2));
        setPriceTarget3(+(data.price * 1.1).toFixed(2));
      }
    } catch (e) {
      setError("Failed to fetch price. Is the backend running?");
    }
    setLoading(false);
  };

  const handleFetch = (e) => {
    e.preventDefault();
    fetchPrice();
  };

  const calculateStrikes = () => {
    if (price <= 0 || numStrikes <= 1) return [];
    
    let rawStrikes = [];
    const minMult = strikeMinPct / 100.0;
    const maxMult = strikeMaxPct / 100.0;
    const step = (maxMult - minMult) / (numStrikes - 1);

    for (let i = 0; i < numStrikes; i++) {
      let m = minMult + (i * step);
      let strike = price * m;
      
      if (price > 100) {
        strike = Math.round(strike);
      } else if (price > 10) {
        strike = +(Math.round(strike * 2) / 2).toFixed(1); // round to 0.5
      } else {
        strike = +(strike.toFixed(2));
      }
      
      if (!rawStrikes.includes(strike)) {
        rawStrikes.push(strike);
      }
    }
    
    // Sort ascending
    rawStrikes.sort((a, b) => a - b);

    return rawStrikes.map(strike => {
      const currentT = expiryDays / 365.0;
      const r = riskFreeRate / 100.0;
      const v = volatility / 100.0;
      const currentMetrics = bsCallMetrics(price, strike, currentT, r, v);

      const targetT = targetDays / 365.0;
      const targetMetrics = bsCallMetrics(priceTarget, strike, targetT, r, v);
      const targetMetrics2 = bsCallMetrics(priceTarget2, strike, targetT, r, v);
      const targetMetrics3 = bsCallMetrics(priceTarget3, strike, targetT, r, v);

      let moic = 0, moic2 = 0, moic3 = 0;
      if (currentMetrics.price > 0) {
        moic = targetMetrics.price / currentMetrics.price;
        moic2 = targetMetrics2.price / currentMetrics.price;
        moic3 = targetMetrics3.price / currentMetrics.price;
      }

      return {
        strike,
        currentPremium: currentMetrics.price,
        intrinsic: currentMetrics.intrinsic,
        extrinsic: currentMetrics.extrinsic,
        greeks: currentMetrics.greeks,
        targetPremium: targetMetrics.price,
        targetPremium2: targetMetrics2.price,
        targetPremium3: targetMetrics3.price,
        moic,
        moic2,
        moic3
      };
    });
  };

  const results = calculateStrikes();

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-400">
            LEAP Options Analyzer
          </h1>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          <div className="col-span-1 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-500" /> Asset Base
              </h2>
              <form onSubmit={handleFetch} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide font-medium text-slate-400 mb-1">Ticker Symbol</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={ticker} 
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. AAPL"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer text-white">
                      {loading ? '...' : 'Fetch'}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide font-medium text-slate-400 mb-1">Current Price ($)</label>
                  <input 
                    type="number" step="0.01" 
                    value={price} 
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </form>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Global Parameters
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Expiry (Days)</label>
                  <input 
                    type="number" 
                    value={expiryDays} 
                    onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Vol (%)</label>
                  <input 
                    type="number" step="0.1" 
                    value={volatility} 
                    onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Risk-Free Rate (%)</label>
                  <input 
                    type="number" step="0.1" 
                    value={riskFreeRate} 
                    onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-4 border-l-2 border-l-emerald-500">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Scenario Targets
              </h2>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-emerald-400 mb-1">Target 1</label>
                  <input 
                    type="number" step="0.1" 
                    value={priceTarget} 
                    onChange={(e) => setPriceTarget(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 font-bold border border-emerald-500/50 rounded-lg px-2 py-2 w-full focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-blue-400 mb-1">Target 2</label>
                  <input 
                    type="number" step="0.1" 
                    value={priceTarget2} 
                    onChange={(e) => setPriceTarget2(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-blue-500/50 rounded-lg px-2 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-purple-400 mb-1">Target 3</label>
                  <input 
                    type="number" step="0.1" 
                    value={priceTarget3} 
                    onChange={(e) => setPriceTarget3(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-purple-500/50 rounded-lg px-2 py-2 w-full focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>
                <div className="col-span-3 mt-2">
                  <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Days left at Target</label>
                  <input 
                    type="number" 
                    value={targetDays} 
                    onChange={(e) => setTargetDays(parseInt(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-purple-400" /> Strike Generator
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Min (%)</label>
                  <input 
                    type="number" 
                    value={strikeMinPct} 
                    onChange={(e) => setStrikeMinPct(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Max (%)</label>
                  <input 
                    type="number" 
                    value={strikeMaxPct} 
                    onChange={(e) => setStrikeMaxPct(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Number of Strikes</label>
                  <input 
                    type="number" step="1" 
                    value={numStrikes} 
                    onChange={(e) => setNumStrikes(parseInt(e.target.value) || 0)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="col-span-3 flex flex-col gap-6">
            
            {/* Visual Analytics Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-500" /> Expected MOIC Curve
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="strike" stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(v) => `$${v}`} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(v) => `${v}x`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(value, name) => [`${value.toFixed(2)}x`, name]}
                          labelFormatter={(label) => `Strike: $${label}`}
                        />
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        <Line type="monotone" name="Target 1 MOIC" dataKey="moic" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
                        <Line type="monotone" name="Target 2 MOIC" dataKey="moic2" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 6}} />
                        <Line type="monotone" name="Target 3 MOIC" dataKey="moic3" stroke="#a855f7" strokeWidth={3} dot={{r: 4, fill: '#a855f7', strokeWidth: 0}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" /> Premium Shift
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="strike" stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(v) => `$${v}`} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(v) => `$${v}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          labelFormatter={(label) => `Strike: $${label}`}
                          formatter={(value) => [`$${value.toFixed(2)}`]}
                        />
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        <Line type="monotone" name="Initial Premium" dataKey="currentPremium" stroke="#3b82f6" strokeWidth={2} dot={{r: 2}} />
                        <Line type="monotone" name="Target Payout" dataKey="targetPremium" stroke="#a855f7" strokeWidth={3} dot={{r: 3}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="glass-panel rounded-2xl p-8 flex-1">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Call Option Strategy Matrix</h2>
                  <p className="text-slate-400 text-sm mt-1">Numerical analysis for target price {priceTarget}</p>
                </div>
                <div className="text-right flex flex-wrap items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-300">
                    <input type="checkbox" checked={showGreeks} onChange={e => setShowGreeks(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-500 bg-slate-900 border-slate-600 rounded" />
                    Display Greeks & Variables
                  </label>
                  <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Stock Move</div>
                    <div className="text-lg font-bold text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4"/> 
                      { price > 0 ? (((priceTarget - price) / price) * 100).toFixed(1) : 0 }%
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="pb-2 px-2 font-medium uppercase tracking-wide text-xs">Strike</th>
                      <th className="pb-2 px-2 font-medium uppercase tracking-wide text-xs">Premium</th>
                      {showGreeks && (
                        <>
                          <th className="pb-2 px-2 font-medium text-amber-500/80 uppercase tracking-wide text-[11px]">Int</th>
                          <th className="pb-2 px-2 font-medium text-amber-500/80 uppercase tracking-wide text-[11px]">Ext</th>
                          <th className="pb-2 px-2 font-medium uppercase tracking-wide text-[11px]">Δ Delta</th>
                          <th className="pb-2 px-2 font-medium uppercase tracking-wide text-[11px]">Γ Gamma</th>
                          <th className="pb-2 px-2 font-medium uppercase tracking-wide text-[11px]">Θ Theta</th>
                          <th className="pb-2 px-2 font-medium uppercase tracking-wide text-[11px]">ν Vega</th>
                          <th className="pb-2 px-2 font-medium uppercase tracking-wide text-[11px]">ρ Rho</th>
                        </>
                      )}
                      <th className="pb-2 px-1 font-medium uppercase tracking-wide text-[10px] text-emerald-400/80">T1 Val</th>
                      <th className="pb-2 px-1 font-medium text-right uppercase tracking-wide text-[10px] text-emerald-400/80">MOIC 1</th>
                      <th className="pb-2 px-1 font-medium uppercase tracking-wide text-[10px] text-blue-400/80">T2 Val</th>
                      <th className="pb-2 px-1 font-medium text-right uppercase tracking-wide text-[10px] text-blue-400/80">MOIC 2</th>
                      <th className="pb-2 px-1 font-medium uppercase tracking-wide text-[10px] text-purple-400/80">T3 Val</th>
                      <th className="pb-2 px-1 font-medium text-right uppercase tracking-wide text-[10px] text-purple-400/80">MOIC 3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results.map((res, i) => {
                      const isAtm = Math.abs(res.strike - price) <= (price * 0.015);
                      const isItm = price > res.strike && !isAtm;
                      const isOtm = price < res.strike && !isAtm;
                      
                      const rowClass = showGreeks ? 'py-1.5' : 'py-3';
                      
                      return (
                        <tr key={i} className={`hover:bg-slate-800/30 transition-colors ${isAtm ? 'bg-blue-500/5' : ''}`}>
                          <td className={`${rowClass} px-2 font-medium flex items-center gap-1.5`}>
                            ${res.strike.toFixed(2)}
                            {isAtm && <span className="text-[9px] font-bold bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded">ATM</span>}
                            {isItm && <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded">ITM</span>}
                            {isOtm && <span className="text-[9px] font-bold bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded">OTM</span>}
                          </td>
                          <td className={`${rowClass} px-2 text-slate-300 font-medium`}>
                            ${res.currentPremium.toFixed(2)}
                          </td>
                          {showGreeks && (
                            <>
                              <td className={`${rowClass} px-2 text-[11px] text-amber-500/80`}>${res.intrinsic.toFixed(2)}</td>
                              <td className={`${rowClass} px-2 text-[11px] text-amber-500/80`}>${res.extrinsic.toFixed(2)}</td>
                              <td className={`${rowClass} px-2 text-[11px] text-slate-400`}>{res.greeks.delta.toFixed(3)}</td>
                              <td className={`${rowClass} px-2 text-[11px] text-slate-400`}>{res.greeks.gamma.toFixed(4)}</td>
                              <td className={`${rowClass} px-2 text-[11px] text-slate-400`}>{res.greeks.theta.toFixed(3)}</td>
                              <td className={`${rowClass} px-2 text-[11px] text-slate-400`}>{res.greeks.vega.toFixed(3)}</td>
                              <td className={`${rowClass} px-2 text-[11px] text-slate-400`}>{res.greeks.rho.toFixed(3)}</td>
                            </>
                          )}
                          <td className={`${rowClass} px-1 text-[11px] text-slate-300`}>
                            ${res.targetPremium.toFixed(2)}
                          </td>
                          <td className={`${rowClass} px-1 text-[11px] text-right`}>
                            <span className={`inline-flex items-center gap-1 font-bold ${res.moic >= 1 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {res.moic.toFixed(2)}x
                            </span>
                          </td>
                          <td className={`${rowClass} px-1 text-[11px] text-slate-300`}>
                            ${res.targetPremium2.toFixed(2)}
                          </td>
                          <td className={`${rowClass} px-1 text-[11px] text-right`}>
                            <span className={`inline-flex items-center gap-1 font-bold ${res.moic2 >= 1 ? 'text-blue-500' : 'text-blue-500/50'}`}>
                              {res.moic2.toFixed(2)}x
                            </span>
                          </td>
                          <td className={`${rowClass} px-1 text-[11px] text-slate-300`}>
                            ${res.targetPremium3.toFixed(2)}
                          </td>
                          <td className={`${rowClass} px-1 text-[11px] text-right`}>
                            <span className={`inline-flex items-center gap-1 font-bold ${res.moic3 >= 1 ? 'text-purple-400' : 'text-purple-400/50'}`}>
                              {res.moic3.toFixed(2)}x
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {results.length > 0 && results[0].moic <= 0 && (
                <div className="mt-8 text-center text-slate-500 text-sm">
                  The option value is projected to be effectively zero. Options expire worthless.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
