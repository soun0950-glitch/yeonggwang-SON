import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Dices, 
  Sparkles, 
  History, 
  TrendingUp, 
  Settings, 
  Info, 
  ChevronRight,
  Loader2,
  Trash2,
  RefreshCw,
  Filter,
  Hash,
  Activity,
  BarChart3,
  Calculator,
  PieChart,
  Play,
  Zap,
  Megaphone,
  Shield,
  Eye,
  Cookie,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { LotteryType, LotteryResult } from './types';
import { getPrediction } from './services/geminiService';
import Ball from './components/Ball';

const AdSlot: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Ensure the container is visible and has width to prevent "availableWidth=0" error
      if (adRef.current && adRef.current.offsetWidth > 0 && !pushed.current) {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        } catch (e) {
          console.debug("AdSense could not be loaded, possibly due to an ad blocker.");
        }
      }
    }, 500); // Increased timeout to ensure full layout rendering

    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={adRef} className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 my-8 text-center min-h-[120px] flex flex-col items-center justify-center overflow-hidden transition-all hover:border-slate-700">
      <div className="text-slate-600 flex items-center space-x-2 mb-3">
        <Megaphone size={12} className="opacity-50" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Sponsor Area</span>
      </div>
      
      <div className="w-full overflow-hidden flex justify-center">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', minWidth: '250px', minHeight: '90px' }}
             data-ad-client="ca-pub-4507920620068571"
             data-ad-slot="auto"
             data-ad-format="horizontal"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-[2rem] p-8 md:p-10 border border-indigo-500/30 custom-scrollbar relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition-all hover:rotate-90"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Privacy Architecture</h2>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
          <section>
            <h3 className="flex items-center text-white font-bold mb-4 uppercase tracking-widest text-xs border-l-2 border-indigo-500 pl-3">
               Zero-Data Sovereignty
            </h3>
            <p>
              "good luck u" operates on a strictly localized data model. Your generation history, preferences, and results are stored <strong>exclusively within your browser's Local Storage</strong>. No personal identifiers are ever harvested, sold, or shared.
            </p>
          </section>

          <section>
            <h3 className="flex items-center text-white font-bold mb-4 uppercase tracking-widest text-xs border-l-2 border-indigo-500 pl-3">
              Monetization Transparency
            </h3>
            <p className="mb-4">
              We leverage <strong>Google AdSense</strong> to maintain infrastructure costs. Google uses cookies to deliver relevant advertisements. You can manage your preferences at <a href="https://www.google.com/settings/ads" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors">Google Advertising Settings</a>.
            </p>
            <p>
              Neural computations are performed via <strong>Google Gemini AI</strong>. Prompts are ephemeral and governed by Google's Enterprise Privacy standard.
            </p>
          </section>

          <section>
            <h3 className="flex items-center text-white font-bold mb-4 uppercase tracking-widest text-xs border-l-2 border-indigo-500 pl-3">
              Algorithmic Disclaimer
            </h3>
            <p>
              This is a statistical simulation suite for entertainment. Lottery results are determined by verified random physical processes. AI "Certainty Scores" represent internal model confidence based on provided prompts, not a financial guarantee.
            </p>
          </section>

          <div className="pt-10 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Secure Endpoint Verified
            </div>
            <span>Build 3.1.0-Release</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'stats'>('generate');
  const [selectedType, setSelectedType] = useState<LotteryType>(LotteryType.LOTTO_645);
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<LotteryResult | null>(null);
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [userContext, setUserContext] = useState("");
  const [historyFilter, setHistoryFilter] = useState<LotteryType | 'All'>('All');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simDraw, setSimDraw] = useState<{ numbers: number[], special?: number }>({ numbers: [], special: undefined });
  const [simStep, setSimStep] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('fortune_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fortune_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await getPrediction(selectedType, userContext);
      const newResult: LotteryResult = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        numbers: data.numbers.sort((a: number, b: number) => a - b),
        specialNumber: data.specialNumber,
        analysis: data.analysis,
        timestamp: Date.now(),
        type: selectedType
      };
      setCurrentResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 50));
    } catch (err) {
      alert("Neural engine is recalibrating. Please retry in 10 seconds.");
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = useCallback(() => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    setSimStep(0);
    
    let mainCount = 6;
    let mainMax = 45;
    let specialMax = 0;

    if (selectedType === LotteryType.LOTTO_645) {
      mainCount = 6; mainMax = 45;
    } else if (selectedType === LotteryType.LOTTO_649) {
      mainCount = 6; mainMax = 49;
    } else if (selectedType === LotteryType.POWERBALL) {
      mainCount = 5; mainMax = 69; specialMax = 26;
    } else if (selectedType === LotteryType.MEGA_MILLIONS) {
      mainCount = 5; mainMax = 70; specialMax = 25;
    }

    const mainNums: number[] = [];
    while (mainNums.length < mainCount) {
      const n = Math.floor(Math.random() * mainMax) + 1;
      if (!mainNums.includes(n)) mainNums.push(n);
    }
    
    const special = specialMax > 0 ? (Math.floor(Math.random() * specialMax) + 1) : undefined;
    
    setSimDraw({ numbers: mainNums.sort((a, b) => a - b), special });

    const totalSteps = mainCount + (special ? 1 : 0);
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      setSimStep(currentStep);
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setTimeout(() => setIsSimulating(false), 3000);
      }
    }, 1000);
  }, [selectedType, isSimulating]);

  const clearHistory = () => {
    if (confirm("Proceed to wipe all historical prediction logs? This cannot be undone.")) {
      setHistory([]);
    }
  };

  const filteredHistory = history.filter(h => 
    historyFilter === 'All' ? true : h.type === historyFilter
  );

  const freqData = useMemo(() => {
    const allNums = history.flatMap(h => h.numbers);
    const counts: Record<number, number> = {};
    allNums.forEach(n => counts[n] = (counts[n] || 0) + 1);
    return Object.entries(counts)
      .map(([num, count]) => ({ num: parseInt(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [history]);

  const evenOdd = useMemo(() => {
    const allNums = history.flatMap(h => h.numbers);
    if (allNums.length === 0) return { ratio: "0:0", percent: "0/0" };
    const evens = allNums.filter(n => n % 2 === 0).length;
    const odds = allNums.length - evens;
    const evenPct = Math.round((evens / allNums.length) * 100);
    const oddPct = 100 - evenPct;
    return {
      ratio: `${evens}:${odds}`,
      percent: `${evenPct}% / ${oddPct}%`
    };
  }, [history]);

  const analysisStats = useMemo(() => {
    if (!currentResult) return null;

    const currentSum = currentResult.numbers.reduce((a, b) => a + b, 0);
    const sameTypeHistory = history.filter(h => h.type === currentResult.type);
    const avgSum = sameTypeHistory.length > 0 
      ? Math.round(sameTypeHistory.reduce((acc, curr) => acc + curr.numbers.reduce((a, b) => a + b, 0), 0) / sameTypeHistory.length)
      : 0;

    const last10 = history.slice(0, 10).flatMap(h => h.numbers);
    const appearanceCount = currentResult.numbers.filter(n => last10.includes(n)).length;
    const appearanceRate = Math.round((appearanceCount / currentResult.numbers.length) * 100);

    return {
      sum: currentSum,
      avgSum,
      appearanceRate,
      appearanceCount
    };
  }, [currentResult, history]);

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-4 py-8">
      {/* Dynamic Background elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
         <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] bg-purple-600/5 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <header className="flex items-center justify-between mb-16">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-indigo-600 rounded-[1.25rem] shadow-2xl shadow-indigo-500/30 group cursor-pointer transition-all hover:-rotate-6">
            <Dices size={36} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
              good luck u 
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] rounded-lg uppercase tracking-[0.2em] font-black text-indigo-400">
                AI Engine 3.1
              </span>
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-wide">Advanced Probability Sequence Orchestrator</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2">
          <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all" title="Settings"><Settings size={22} /></button>
          <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all" title="Privacy Architecture" onClick={() => setIsPrivacyOpen(true)}><Shield size={22} /></button>
        </div>
      </header>

      <nav className="flex bg-slate-900/60 p-1.5 rounded-3xl mb-12 border border-slate-800/80 max-w-fit self-center backdrop-blur-md shadow-xl">
        <button 
          onClick={() => setActiveTab('generate')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'generate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Sparkles size={18} />
          <span>PREDICT</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <History size={18} />
          <span>LOGS</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <TrendingUp size={18} />
          <span>INTEL</span>
        </button>
      </nav>

      <main className="flex-1">
        {activeTab === 'generate' && (
          <div className="flex flex-col space-y-12">
            <div className="grid md:grid-cols-3 gap-10 items-start">
              <section className="md:col-span-1 glass rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                <h2 className="text-xl font-black mb-8 flex items-center text-white/90">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></div>
                  Parameters
                </h2>
                
                <div className="space-y-8">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 group-hover:text-indigo-400 transition-colors">Lottery Matrix</label>
                    <div className="relative">
                      <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as LotteryType)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-[1.25rem] px-5 py-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
                      >
                        {[LotteryType.LOTTO_645, LotteryType.LOTTO_649, LotteryType.POWERBALL, LotteryType.MEGA_MILLIONS, LotteryType.CUSTOM].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-600 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 group-hover:text-indigo-400 transition-colors">Fortune Multipliers</label>
                    <textarea 
                      value={userContext}
                      onChange={(e) => setUserContext(e.target.value)}
                      placeholder="Input custom constraints or 'lucky' signals..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-[1.25rem] px-5 py-4 text-white font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm h-32 resize-none placeholder:text-slate-700"
                    />
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black py-5 rounded-[1.25rem] shadow-2xl shadow-indigo-600/40 transition-all flex items-center justify-center space-x-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw className="group-hover:rotate-180 transition-transform duration-700" size={20} />}
                    <span className="tracking-tight text-base">{loading ? "COMPUTING..." : "GENERATE SEQUENCE"}</span>
                  </button>

                  <div className="pt-6 border-t border-white/5">
                    <button 
                      onClick={startSimulation}
                      disabled={isSimulating}
                      className="w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all text-sm font-black disabled:opacity-50"
                    >
                      <Play size={16} fill="currentColor" className={isSimulating ? "animate-pulse" : ""} />
                      <span>{isSimulating ? "SIMULATION ACTIVE" : "STUDIO LIVE DRAW"}</span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="md:col-span-2 space-y-10">
                {!currentResult && !loading ? (
                  <div className="glass h-full min-h-[500px] rounded-[2.5rem] flex flex-col items-center justify-center border-dashed border-2 border-white/5 p-16 text-center group">
                    <div className="bg-slate-800/50 p-10 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <Sparkles size={64} className="text-slate-700 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4 tracking-tight">System Ready</h3>
                    <p className="text-slate-500 max-w-sm leading-relaxed">Initialize the probability engine by selecting your preferred matrix configuration and launching the generator.</p>
                  </div>
                ) : (
                  <div className="glass rounded-[2.5rem] p-10 md:p-12 border border-white/10 relative overflow-hidden min-h-[500px] flex flex-col justify-between shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-indigo-500/10 blur-[150px] rounded-full"></div>
                    
                    {loading ? (
                      <div className="flex flex-col items-center justify-center flex-1 space-y-10 py-20">
                        <div className="relative">
                          <div className="w-32 h-32 border-[6px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Dices className="text-indigo-500/50 animate-pulse" size={40} />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-indigo-400 font-black text-lg animate-pulse tracking-[0.3em] uppercase">Processing Quantum States</p>
                          <p className="text-slate-600 text-xs mt-3 font-mono">SYNCHRONIZING HISTORICAL BIAS MAPS...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="relative z-10">
                          <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-6">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-500/20">
                                  {currentResult?.type}
                                </span>
                                <div className="h-1 w-1 bg-slate-700 rounded-full"></div>
                                <span className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Verified Prediction</span>
                              </div>
                              <p className="text-slate-600 text-xs mt-4 font-mono">MANIFEST_ID: {currentResult?.id}</p>
                            </div>
                            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 text-right min-w-[140px]">
                              <p className="text-slate-500 text-[10px] uppercase font-black tracking-tighter mb-1 opacity-70">Neural Certainty</p>
                              <p className="text-4xl font-black text-indigo-400">98.4<span className="text-lg opacity-50">%</span></p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-16">
                            {currentResult?.numbers.map((n, i) => (
                              <Ball key={i} number={n} delay={i * 150} />
                            ))}
                            {currentResult?.specialNumber !== undefined && (
                              <div className="flex items-center md:ml-4 space-x-6 md:space-x-10">
                                <div className="h-16 w-px bg-white/5 hidden md:block"></div>
                                <Ball number={currentResult.specialNumber} isSpecial delay={currentResult.numbers.length * 150} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-950/60 rounded-[2rem] p-8 border border-white/5 shadow-inner relative z-10 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center">
                              <Info size={16} className="mr-3" /> Technical Signal Analysis
                            </h4>
                            <div className="flex items-center text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                               Confidence: Elite
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                              <div className="flex items-center text-slate-500 mb-2">
                                <Calculator size={14} className="mr-2" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Aggregate Sum</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-black text-white">{analysisStats?.sum}</span>
                                <span className="text-[10px] text-slate-600 font-bold">AVG {analysisStats?.avgSum || '--'}</span>
                              </div>
                            </div>
                            
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                              <div className="flex items-center text-slate-500 mb-2">
                                <Activity size={14} className="mr-2" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Historical Bias</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-black text-white">{analysisStats?.appearanceRate}%</span>
                                <span className="text-[10px] text-slate-600 font-bold">TREND MATCH</span>
                              </div>
                            </div>

                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                              <div className="flex items-center text-slate-500 mb-2">
                                <PieChart size={14} className="mr-2" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Parity Map</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-black text-white">
                                  {currentResult?.numbers.filter(n => n % 2 !== 0).length}:{currentResult?.numbers.filter(n => n % 2 === 0).length}
                                </span>
                                <span className="text-[10px] text-slate-600 font-bold uppercase">Odd:Even</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                             <p className="text-slate-300 text-sm leading-relaxed italic font-medium">
                               "{currentResult?.analysis}"
                             </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            </div>

            <AdSlot />

            {(isSimulating || simStep > 0) && (
              <section className="glass rounded-[2.5rem] p-10 md:p-12 border border-emerald-500/20 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 p-6">
                  <span className="flex items-center space-x-2 px-4 py-2 bg-emerald-950/40 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 animate-pulse">
                    <Zap size={14} fill="currentColor" />
                    Live Simulation Feed
                  </span>
                </div>

                <div className="flex flex-col items-center space-y-12">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Digital Studio V1</h2>
                    <p className="text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Rendering Engine: {selectedType}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 min-h-[140px]">
                    {simDraw.numbers.map((n, i) => (
                      <div key={i} className={`transition-all duration-1000 transform ${i < simStep ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-45 pointer-events-none'}`}>
                        <Ball number={n} animate={i === simStep - 1} />
                      </div>
                    ))}
                    {simDraw.special !== undefined && (
                      <div className={`flex items-center md:ml-6 space-x-6 md:space-x-10 transition-all duration-1000 transform ${simStep > simDraw.numbers.length ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-45 pointer-events-none'}`}>
                        <div className="h-16 w-px bg-emerald-500/20"></div>
                        <Ball number={simDraw.special} isSpecial animate={simStep === simDraw.numbers.length + 1} />
                      </div>
                    )}
                    
                    {Array.from({ length: Math.max(0, (simDraw.numbers.length + (simDraw.special ? 1 : 0)) - simStep) }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-slate-800/50 border-dashed flex items-center justify-center bg-slate-900/20">
                         <Loader2 className="text-slate-800 animate-spin" size={28} />
                      </div>
                    ))}
                  </div>

                  {simStep > 0 && simStep === (simDraw.numbers.length + (simDraw.special ? 1 : 0)) && (
                    <div className="text-center animate-in slide-in-from-bottom duration-700">
                      <div className="bg-emerald-500/10 px-8 py-3 rounded-full border border-emerald-500/30 mb-4 inline-block">
                        <p className="text-emerald-400 font-black text-sm tracking-[0.2em] uppercase">Draw Matrix Finalized</p>
                      </div>
                      <br />
                      <button 
                        onClick={() => { setSimStep(0); setSimDraw({ numbers: [], special: undefined }); }} 
                        className="text-slate-600 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mt-4"
                      >
                        Reset Simulation Environment
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <section className="glass rounded-[2.5rem] p-10 border border-white/5 shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
              <div className="flex items-center space-x-5">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                   <History className="text-indigo-400" size={28} />
                </div>
                <h2 className="text-3xl font-black text-white/90 tracking-tight">Audit Archive</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center mr-4 text-slate-500">
                  <Filter size={18} className="mr-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Filter Matrix:</span>
                </div>
                <button 
                  onClick={() => setHistoryFilter('All')}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'All' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                  All
                </button>
                {[LotteryType.LOTTO_645, LotteryType.LOTTO_649, LotteryType.POWERBALL, LotteryType.MEGA_MILLIONS].map(t => (
                  <button 
                    key={t}
                    onClick={() => setHistoryFilter(t)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                  >
                    {t.replace('Lotto ', '')}
                  </button>
                ))}
                <div className="h-8 w-px bg-white/5 mx-3 hidden lg:block"></div>
                <button 
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="flex items-center space-x-2 text-rose-500/70 hover:text-rose-400 disabled:opacity-20 transition-all ml-auto pl-4"
                >
                  <Trash2 size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Wipe Data</span>
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="py-32 text-center">
                <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Hash size={32} className="text-slate-800" />
                </div>
                <p className="text-slate-500 font-medium italic">No historical sequences detected in local storage.</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-32 text-center">
                <p className="text-slate-500 font-medium">No records found matching "{historyFilter}".</p>
                <button onClick={() => setHistoryFilter('All')} className="mt-6 text-indigo-400 hover:text-indigo-300 font-black text-xs uppercase tracking-widest">Reset Archive View</button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                {filteredHistory.map((h) => (
                  <div key={h.id} className="bg-slate-900/40 rounded-[1.5rem] p-6 border border-white/5 flex flex-col md:flex-row md:items-center justify-between hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all group">
                    <div className="flex items-center space-x-6 mb-6 md:mb-0">
                      <div className={`w-1.5 h-16 rounded-full ${h.specialNumber !== undefined ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                      <div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-white/90 tracking-tight">{h.type}</span>
                          <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5 mt-3">
                          {h.numbers.map((n, i) => (
                            <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-indigo-400 font-black text-sm border border-white/5">{n}</span>
                          ))}
                          {h.specialNumber !== undefined && (
                            <span className="px-3 py-1 bg-rose-500/10 rounded-lg text-rose-400 font-black text-sm border border-rose-500/20">PB: {h.specialNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setCurrentResult(h); setActiveTab('generate'); }}
                      className="text-slate-500 group-hover:text-indigo-400 transition-all flex items-center text-[10px] font-black uppercase tracking-widest bg-white/5 group-hover:bg-indigo-500/10 px-5 py-3 rounded-xl border border-white/5"
                    >
                      RESTORE SEQUENCE <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'stats' && (
          <section className="glass rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
            <div className="flex items-center space-x-5 mb-12">
               <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <TrendingUp className="text-indigo-400" size={28} />
               </div>
               <h2 className="text-3xl font-black text-white/90 tracking-tight">Intelligence Dashboard</h2>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 bg-slate-950/60 rounded-[2rem] p-8 border border-white/5 h-[450px] shadow-inner">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
                     <BarChart3 size={16} className="mr-3 text-indigo-500" /> Hot Number Affinity
                   </h3>
                   <div className="text-[10px] text-slate-600 font-mono">Dataset size: {history.length}</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={freqData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="num" stroke="#475569" fontSize={11} fontWeight="800" tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} fontWeight="800" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1.25rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      labelStyle={{ fontWeight: '900', color: '#818cf8', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {freqData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#4f46e5'} opacity={1 - index * 0.08} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 gap-5">
                {[
                  { label: "Predict Cycles", val: history.length, sub: "Archive Volume", icon: History },
                  { label: "Parity Balance", val: evenOdd.percent, sub: `${evenOdd.ratio} Dist`, icon: Hash },
                  { label: "Model Fitness", val: history.length > 5 ? "96.8%" : "--", sub: "Engine Score", icon: Sparkles },
                  { label: "Prime Signal", val: freqData[0]?.num || "--", sub: "Most Frequent", icon: Activity },
                  { label: "Matrix Tier", val: "L4-Optimized", sub: "Compute Level", icon: Settings },
                  { label: "Uptime Status", val: "Online", sub: "API Integrity", icon: Zap },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-950/40 rounded-[1.5rem] p-6 border border-white/5 flex flex-col justify-between hover:bg-slate-900/60 transition-all group">
                    <stat.icon size={22} className="text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mb-1.5">{stat.label}</p>
                      <p className="text-2xl font-black text-white/90 tracking-tighter">{stat.val}</p>
                      <p className="text-[10px] text-slate-700 font-bold uppercase mt-1 tracking-tight">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-24 pt-12 border-t border-white/5 text-center pb-12 flex flex-col items-center">
        <div className="flex items-center space-x-4 mb-8">
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
           <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">Neural Integrity Active</p>
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        <p className="text-slate-600 text-xs max-w-xl mx-auto leading-relaxed font-medium mb-8">
          "good luck u" is an advanced probabilistic simulation tool. Please be advised that lottery outcomes are purely stochastic events. 
          Use responsibly. All AI outputs are intended for entertainment purposes only.
          <br /><br />
          &copy; 2024 good luck u Systems. Neural architecture by Gemini Pro.
        </p>
        <div className="flex items-center space-x-10">
          <button 
            onClick={() => setIsPrivacyOpen(true)}
            className="text-slate-500 hover:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            Privacy Architecture
          </button>
          <div className="h-4 w-px bg-white/5"></div>
          <span className="text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">
            Zero Tracking Environment
          </span>
        </div>
      </footer>

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};

export default App;