import React, { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, Users, Heart, Video, AlertCircle, Info, Download, ExternalLink, MessageCircle, Share2, Calendar, MapPin, Hash, Clock, Swords, Trash2, Activity, Star, Zap, Euro, Check, CheckCircle, X, AlertTriangle, Award, Eye, Lightbulb, PenTool, Megaphone, PlaySquare, RefreshCw, Sparkles, Printer } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult } from './types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { analyzeTikTokProfile } from './services/tiktokService';
import { getAIRecommendations, generateAIContentIdeas } from './services/aiService';
import PrintReport from './components/PrintReport';
import PrintMediaKit from './components/PrintMediaKit';

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  cardClass,
  labelClass,
  valueClass,
  iconClass,
  helpText
}: { 
  icon: any, 
  label: string, 
  value: string, 
  cardClass: string,
  labelClass: string,
  valueClass: string,
  iconClass: string,
  helpText?: React.ReactNode
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 rounded-[32px] relative flex flex-col justify-between ${cardClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest truncate ${labelClass}`}>{label}</p>
          {helpText && (
             <button 
               type="button"
               onClick={() => setShowTooltip(!showTooltip)}
               onBlur={() => setShowTooltip(false)}
               onMouseEnter={() => setShowTooltip(true)}
               onMouseLeave={() => setShowTooltip(false)}
               className="relative shrink-0 focus:outline-none"
             >
               <Info size={16} className={`text-[#25F4EE] cursor-help transition-all ${showTooltip ? 'opacity-100' : 'opacity-80'}`} />
               
               <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-slate-900 shadow-2xl text-white text-[11px] rounded-2xl transition-all pointer-events-none z-[100] origin-bottom leading-relaxed border border-white/10 normal-case font-medium ${showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                 <div className="bg-white/5 p-2 rounded-lg mb-2 w-fit">
                    <TrendingUp size={14} className="text-[#25F4EE]" />
                 </div>
                 {helpText}
                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-white/10"></div>
               </div>
             </button>
           )}
        </div>
        <div className={`p-2 rounded-xl shrink-0 ${iconClass}`}>
          <Icon size={20} />
        </div>
      </div>
      <h2 className={`text-4xl font-black ${valueClass}`}>{value}</h2>
    </motion.div>
  );
}

export default function App() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [appTab, setAppTab] = useState<'search' | 'history'>('search');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintMediaKitMode, setIsPrintMediaKitMode] = useState(false);
  const [resultTab, setResultTab] = useState<'overview' | 'audit' | 'benchmark' | 'content' | 'insights'>('overview');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'likes' | 'comments'>('recent');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [keysStatus, setKeysStatus] = useState<any[]>(() => {
    // Initialize with all keys masked
    const rawKeys = ((import.meta as any).env.VITE_RAPIDAPI_KEY) || 'b3b8244ea2msh4e2b733bb238abdp116a59jsn2bb022c66151';
    const split = rawKeys.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    return split.map(k => ({
      key: k.slice(0, 4) + '...' + k.slice(-4),
      remaining: -1,
      limit: -1,
      lastUsed: 0,
      status: 'idle'
    }));
  });
  const [showKeysStatus, setShowKeysStatus] = useState(false);

  const fetchKeysStatus = async () => {
    try {
      const res = await fetch('/api/keys-status');
      if (res.ok) {
        const data = await res.json();
        // Return structured data for the frontend mapping
        // We match it against the initialized keys if we want to show all keys
        const rawKeys = ((import.meta as any).env.VITE_RAPIDAPI_KEY) || 'b3b8244ea2msh4e2b733bb238abdp116a59jsn2bb022c66151';
        const split = rawKeys.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
        
        const frontendMap = split.map(k => {
          const masked = k.slice(0, 4) + '...' + k.slice(-4);
          const serverData = data.find((d: any) => d.key === masked);
          if (serverData) {
            return {
              key: masked,
              limit: serverData.limit,
              remaining: serverData.remaining,
              status: serverData.remaining > 0 ? 'active' : 'exhausted',
              lastUsed: serverData.lastUsed
            };
          }
          return {
            key: masked,
            limit: -1,
            remaining: -1,
            status: 'unknown',
            lastUsed: null
          };
        });
        
        setKeysStatus(frontendMap);
      }
    } catch (err) {
      console.error("Failed to fetch keys status", err);
    }
  };

  useEffect(() => {
    if (showKeysStatus) {
      fetchKeysStatus();
    }
  }, [showKeysStatus]);

  const POPULAR_ACCOUNTS = [
    'khaby.lame', 'charlidamelio', 'mrbeast', 'bellapoarch', 'addisonre', 
    'zachking', 'kimberly.loaiza', 'cznburak', 'therock', 'willsmith',
    'tiktok', 'jamescharles', 'brentrivera', 'lilhuddy', 'jasonderulo'
  ];

  const suggestions = username.trim() 
    ? POPULAR_ACCOUNTS.filter(acc => acc.includes(username.toLowerCase()) && acc !== username.toLowerCase())
    : [];

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('tiktok_audit_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
    const savedData = localStorage.getItem('tiktok_analyses_data');
    if (savedData) {
      try {
        setSavedAnalyses(JSON.parse(savedData));
      } catch (e) {
        console.error("Error parsing saved analyses", e);
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (name: string, dataObj?: AnalysisResult) => {
    if (!name) return;
    const cleanName = name.toLowerCase().replace('@', '').trim();
    
    if (dataObj) {
      setSavedAnalyses(prev => {
        const newData = { ...prev, [cleanName]: dataObj };
        // keep only the last 10 entries
        const keys = Object.keys(newData);
        if (keys.length > 10) {
          delete newData[keys[0]];
        }
        localStorage.setItem('tiktok_analyses_data', JSON.stringify(newData));
        return newData;
      });
    }

    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== cleanName);
      const newHistory = [cleanName, ...filtered].slice(0, 10);
      localStorage.setItem('tiktok_audit_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    setSavedAnalyses({});
    localStorage.removeItem('tiktok_audit_history');
    localStorage.removeItem('tiktok_analyses_data');
  };

  const exportCSV = () => {
    if (!result || !result.data || !result.data.videos) return;
    const headers = ['URL', 'Description', 'Vues', 'Likes', 'Commentaires', 'Partages', 'Duree (s)', 'Date'];
    const rows = result.data.videos.map(v => {
       const date = new Date(v.createTime).toLocaleDateString();
       const url = `https://www.tiktok.com/@${result.data.username || result.data.profile.nickname}/video/${v.id}`;
       const desc = `"${v.desc.replace(/"/g, '""')}"`;
       return [url, desc, v.views, v.likes, v.comments, v.shares, v.duration || 0, date];
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_${result.data.username || result.data.profile.nickname}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const colorToRgba = (color: string) => {
    if (!color || !color.includes('oklch')) return color;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return color;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
      return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    } catch (e) {
      return color;
    }
  };

  const normalizeOklch = (doc: Document) => {
    const elements = doc.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      const computedStyle = window.getComputedStyle(el);
      ['background-color', 'color', 'border-color', 'fill', 'stroke'].forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value.includes('oklch')) {
          const rgba = colorToRgba(value);
          el.style.setProperty(prop, rgba, 'important');
        }
      });
    }
  };

  const handleDownload = (blobUrl: string, fileName: string) => {
    // Deprecated
  };

  const exportPDF = async () => {
    // Deprecated for print mode
  };

  const sortedVideos = result?.data?.videos ? [...result.data.videos].sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'likes') return b.likes - a.likes;
    if (sortBy === 'comments') return b.comments - a.comments;
    return b.createTime - a.createTime;
  }) : [];

  const authenticityScore = React.useMemo(() => {
    if (!result?.data) return 0;
    const { followers } = result.data.stats;
    if (followers === 0) return 0;
    const avgViews = result.data.videos && result.data.videos.length > 0 
      ? result.data.videos.reduce((sum, v) => sum + v.views, 0) / result.data.videos.length 
      : 0;
    
    const ratio = avgViews / followers;
    let score = Math.min(100, Math.max(0, ratio * 1000));
    score = score * 0.7 + Math.min(30, result.data.stats.engagementRate * 2);
    return Math.round(Math.min(100, score));
  }, [result]);

  const idealPostingTime = React.useMemo(() => {
    if (!result?.data?.videos || result.data.videos.length === 0) return null;
    const hourMap: Record<number, {views: number, count: number}> = {};
    const last10 = [...result.data.videos].sort((a, b) => b.createTime - a.createTime).slice(0, 10);
    
    last10.forEach(v => {
      const date = new Date(v.createTime * 1000);
      const hour = date.getHours();
      if (!hourMap[hour]) hourMap[hour] = {views: 0, count: 0};
      hourMap[hour].views += v.views;
      hourMap[hour].count += 1;
    });
    
    let bestHour = 0;
    let maxAvgViews = -1;
    Object.keys(hourMap).forEach(h => {
      const hp = parseInt(h, 10);
      const avg = hourMap[hp].views / hourMap[hp].count;
      if (avg > maxAvgViews) {
        maxAvgViews = avg;
        bestHour = hp;
      }
    });
    
    return `${bestHour.toString().padStart(2, '0')}:00`;
  }, [result]);


  const handleRefresh = () => {
    if (result && result.data && result.data.username) {
      setUsername(result.data.username);
      handleSearch(null as any, true);
    }
  };
  
  const handleAIAnalysis = async () => {
    if (!result || !result.data) return;
    setIsGeneratingAI(true);
    try {
      const aiResult = await getAIRecommendations(result.data);
      setResult(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          data: {
            ...prev.data,
            aiInsights: {
              ...aiResult,
              isGenerated: true
            }
          }
        };
        // Save to history too
        if (prev.data.username) {
          saveToHistory(prev.data.username, updated);
        }
        return updated;
      });
      setResultTab('insights');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!result || !result.data) return;
    setIsGeneratingContent(true);
    try {
      const ideas = await generateAIContentIdeas(result.data);
      setResult(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          data: {
            ...prev.data,
            contentGenerator: {
              ideas: ideas
            }
          }
        };
        // Save to history too
        if (prev.data.username) {
          saveToHistory(prev.data.username, updated);
        }
        return updated;
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSearch = async (e: React.FormEvent, forceRefresh = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!username.trim()) return;

    const cleanName = username.toLowerCase().replace('@', '').trim();

    // If it's NOT a forced refresh AND we have it in cache, just show it
    if (!forceRefresh && savedAnalyses[cleanName]) {
      setResult(savedAnalyses[cleanName]);
      setAppTab('search');
      setResultTab('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // isDemo should be false to try real API keys. If keys fail, the service returns mock data anyway.
      const { data, quota, source } = await analyzeTikTokProfile(username, false);
      const newResult = { data, source, insights: [] } as any;
      setResult(newResult);
      if (quota && (quota as any).key) {
        setKeysStatus(prev => prev.map(k => 
          k.key === (quota as any).key 
            ? { ...k, ...quota, lastUsed: Date.now(), status: 'active' } 
            : k
        ));
      }
      saveToHistory(username, newResult);
      setAppTab('search');
      setResultTab('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isPrintMode && result) {
    return <PrintReport result={result} onClose={() => setIsPrintMode(false)} />;
  }

  if (isPrintMediaKitMode && result) {
    return <PrintMediaKit result={result} onClose={() => setIsPrintMediaKitMode(false)} />;
  }

  return (
    <div className="relative isolate min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppTab('search')}>
            <div className="bg-gradient-to-tr from-[#FE2C55] to-[#25F4EE] p-1.5 rounded-xl text-white shadow-sm shadow-red-100">
              <Zap size={20} />
            </div>
            <span className="font-black text-xl tracking-tighter">Viral<span className="text-[#FE2C55]">Scope</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative ml-2 sm:ml-4">
              <button 
                onClick={() => setShowKeysStatus(!showKeysStatus)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${keysStatus.length > 0 ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                <Activity size={12} />
                <span className="hidden xs:inline">Statut API</span>
              </button>

              <AnimatePresence>
                {showKeysStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 z-[100]"
                  >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                      Statut des Clés RapidAPI
                      <Activity size={12} className="text-indigo-500" />
                    </h3>
                    
                    <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                      {keysStatus.map((ks) => (
                        <div key={ks.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-mono font-bold text-slate-500">Clé: {ks.key}</span>
                              <div className={`w-2 h-2 rounded-full ${ks.status === 'active' ? (ks.remaining > 10 ? 'bg-emerald-500 animate-pulse' : ks.remaining > 0 ? 'bg-amber-500' : 'bg-red-500') : 'bg-slate-300'}`}></div>
                            </div>
                            <div className="flex items-end justify-between gap-1 mb-1">
                               <span className="text-lg font-black text-slate-900 leading-none">
                                 {ks.remaining === -1 ? '?' : ks.remaining}
                               </span>
                               <span className="text-[10px] font-bold text-slate-400 pb-0.5">
                                 / {ks.limit === -1 ? '?' : ks.limit}
                               </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-1000 ${ks.remaining === -1 ? 'bg-slate-300 animate-pulse' : ks.remaining > 10 ? 'bg-emerald-500' : ks.remaining > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                                 style={{ width: ks.remaining === -1 ? '100%' : `${(ks.remaining / ks.limit) * 100}%` }}
                               />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 font-medium">
                              {ks.lastUsed > 0 ? `Dernier usage: ${new Date(ks.lastUsed).toLocaleTimeString()}` : 'Pas encore utilisée'}
                            </p>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {result && !loading && (
                <>
                  <button 
                   onClick={() => setIsPrintMediaKitMode(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                  title="Media Kit"
                >
                  <Star size={14} />
                  <span className="hidden sm:inline">Media Kit</span>
                </button>
                 <button 
                   onClick={() => setIsPrintMode(true)}
                   className="flex sm:hidden p-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition-all"
                   title="Imprimer / PDF"
                 >
                   <Printer size={18} />
                 </button>
               </>
             )}
             <div className="hidden sm:flex items-center gap-3">
                {result && !loading && (
                  <button 
                    onClick={() => setIsPrintMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <Printer size={14} />
                    Imprimer / PDF
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
             </div>
           </div>
         </div>
       </div>
     </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 pb-28 sm:pb-32">
        
        {appTab === 'search' && !result && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4"
            >
              Dominez TikTok avec <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#000000]">ViralScope</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-500 font-medium mb-8"
            >
              Obtenez des statistiques détaillées, calculez votre taux d'engagement et recevez des recommandations.
            </motion.p>

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSearch} 
              className="relative max-w-lg mx-auto search-container"
            >
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-black text-lg pt-0.5">@</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="nom_utilisateur"
                  className="block w-full pl-12 pr-36 py-4 bg-white border-2 border-slate-200 rounded-[32px] text-slate-900 font-bold placeholder-slate-400 focus:ring-4 focus:ring-[#25F4EE]/20 focus:border-[#25F4EE] transition-all outline-none shadow-sm"
                />
                
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[28px] shadow-2xl z-[60] overflow-hidden p-2"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 mb-1">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Suggestions</span>
                      </div>
                      {suggestions.slice(0, 5).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setUsername(s);
                            setShowSuggestions(false);
                            setTimeout(() => {
                              document.getElementById('search-submit-btn')?.click();
                            }, 50);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors rounded-2xl group"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <Users size={14} />
                          </div>
                          <span>@{s}</span>
                          <TrendingUp size={12} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  id="search-submit-btn"
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-[#FE2C55] text-white font-bold rounded-[24px] hover:bg-[#e02048] focus:outline-none focus:ring-4 focus:ring-[#FE2C55]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-red-200"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Analyser'}
                </button>
              </div>

              <AnimatePresence>
                {searchHistory.length > 0 && !result && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-between mb-3 px-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock size={12} /> Récents
                      </span>
                      <button 
                        onClick={clearHistory}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors"
                      >
                        Effacer
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center px-2">
                      {searchHistory.map((hist) => (
                        <button
                          key={hist}
                          onClick={() => {
                            setUsername(hist);
                            const event = { preventDefault: () => {} } as React.FormEvent;
                            // Indirectly trigger search by updating username and calling a separate search function
                            // but easiest is to just set it and let user click or wrap handleSearch
                            setTimeout(() => {
                              const btn = document.getElementById('search-submit-btn');
                              if (btn) btn.click();
                            }, 50);
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 group"
                        >
                          <span className="text-slate-300 group-hover:text-indigo-300">@</span>
                          {hist}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>
          </div>
        )}

          <div className="space-y-10">
            {/* Error State */}
            <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto bg-red-50 border-2 border-red-200 text-red-600 font-bold p-5 rounded-[24px] flex items-start gap-3 mb-12 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && !loading && appTab === 'search' && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-10"
              id="analytics-dashboard"
            >
              {result.source === 'ai-estimation' && (
                <div className="bg-sky-50 border-2 border-sky-200 text-sky-800 font-medium p-5 rounded-[24px] flex items-start gap-4 max-w-3xl mx-auto shadow-sm">
                  <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">
                    <strong className="font-black text-sky-900 block overflow-hidden">Mode Démo Actif:</strong> Les statistiques affichées ci-dessous sont des estimations générées par l'IA car aucune clé d'API TikTok n'est configurée. Pour obtenir des données réelles, ajoutez une clé RapidAPI dans <code className="bg-sky-100 px-1.5 py-0.5 rounded font-mono font-bold text-sky-900">.env</code>.
                  </p>
                </div>
              )}

              {result.source === 'rate-limited' && (
                <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 font-medium p-5 rounded-[24px] flex items-start gap-4 max-w-3xl mx-auto shadow-sm">
                  <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">
                    <strong className="font-black text-amber-900 block overflow-hidden">Quota API Atteint:</strong> L'API TikTok a atteint sa limite de requêtes (Erreur 429). L'analyse ci-dessous utilise des données d'estimation temporaires. Veuillez réessayer dans quelques minutes.
                  </p>
                </div>
              )}

              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-100 rounded-[40px] p-8 max-w-4xl mx-auto shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FE2C55] via-[#25F4EE] to-[#000000] p-1">
                  <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden border-2 border-white">
                    <img 
                      src={result.data.profile.avatar} 
                      alt={result.data.profile.nickname}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                {result.source === 'live' && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div> Live
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black">@{result.data.profile.nickname}</h2>
                </div>
                {result.data.profile.bio && (
                  <p className="text-slate-500 font-medium mt-1 max-w-sm italic line-clamp-1">
                    {result.data.profile.bio}
                  </p>
                )}
              </div>
            </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 sm:mt-0 print:hidden">
                  <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-100 text-slate-800 font-bold rounded-[24px] hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    Actualiser
                  </button>
                  <button 
                    onClick={exportCSV}
                    className="px-6 py-3 bg-slate-100 text-slate-800 font-bold rounded-[24px] hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Download size={18} />
                    CSV
                  </button>
                  <button 
                    onClick={() => setIsPrintMode(true)}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-[24px] hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Printer size={18} />
                    Imprimer / PDF
                  </button>
                </div>
              </div>

              {/* Audit & Notes Section */}
              {resultTab === 'audit' && (
                <>
                  {result.data.audit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  
                  {/* Notes de Performance */}
                  <div className="bg-slate-900 rounded-[40px] p-8 shadow-lg text-white">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                       <Award size={16} className="text-amber-400" />
                       Notes de Performance
                    </h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl">
                          <div>
                            <p className="text-xs font-bold text-slate-300">Note de Viralité</p>
                            <p className="text-[10px] text-slate-500 italic">Basée sur les partages</p>
                          </div>
                          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-2xl font-black ${['S', 'A'].includes(result.data.audit.grades.virality) ? 'bg-emerald-500/20 text-emerald-400' : ['B', 'C'].includes(result.data.audit.grades.virality) ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                            {result.data.audit.grades.virality}
                          </div>
                       </div>
                       <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl">
                          <div>
                            <p className="text-xs font-bold text-slate-300">Note de Communauté</p>
                            <p className="text-[10px] text-slate-500 italic">Basée sur les commentaires</p>
                          </div>
                          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-2xl font-black ${['S', 'A'].includes(result.data.audit.grades.community) ? 'bg-emerald-500/20 text-emerald-400' : ['B', 'C'].includes(result.data.audit.grades.community) ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                            {result.data.audit.grades.community}
                          </div>
                       </div>
                       <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl">
                          <div>
                            <p className="text-xs font-bold text-slate-300">Note de Croissance</p>
                            <p className="text-[10px] text-slate-500 italic">Comparaison hebdo. des vues</p>
                          </div>
                          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-2xl font-black ${['S', 'A'].includes(result.data.audit.grades.growth) ? 'bg-emerald-500/20 text-emerald-400' : ['B', 'C'].includes(result.data.audit.grades.growth) ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                            {result.data.audit.grades.growth}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Audit de la Bio et du Profil */}
                  <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <CheckCircle size={16} className="text-indigo-500" />
                       Audit de la Bio et du Profil
                    </h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                          <div className={`p-2 rounded-xl border ${result.data.audit.hasLink ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-red-100 border-red-200 text-red-600'}`}>
                             {result.data.audit.hasLink ? <Check size={18} /> : <X size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Lien dans la bio</p>
                            <p className="text-xs text-slate-500">{result.data.audit.hasLink ? 'Présent' : 'Recommandé pour rediriger le trafic'}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                          <div className={`p-2 rounded-xl border ${result.data.audit.hasAvatar ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-red-100 border-red-200 text-red-600'}`}>
                             {result.data.audit.hasAvatar ? <Check size={18} /> : <X size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Photo de profil</p>
                            <p className="text-xs text-slate-500">{result.data.audit.hasAvatar ? 'Présente' : 'Indispensable pour l\'identité visuelle'}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                          <div className={`p-2 rounded-xl border ${result.data.audit.hasKeywords ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-amber-100 border-amber-200 text-amber-600'}`}>
                             {result.data.audit.hasKeywords ? <Check size={18} /> : <AlertTriangle size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Mots-clés clairs</p>
                            <p className="text-xs text-slate-500">{result.data.audit.hasKeywords ? 'La bio semble détaillée' : 'Ajoutez des mots-clés sur votre niche'}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Analyse de la Rétention */}
              {result.data.audit && result.data.audit.retention && (
                <div className="max-w-4xl mx-auto mt-6 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-[40px] p-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6 flex items-center gap-2">
                       <Eye size={16} />
                       Estimations de Rétention & Visionnage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-white p-5 rounded-3xl shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">% de Visionnage</p>
                          <p className="text-3xl font-black text-indigo-900">{result.data.audit.retention.estimatedWatchTime}%</p>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${result.data.audit.retention.estimatedWatchTime}%` }}></div>
                          </div>
                       </div>
                       <div className="bg-white p-5 rounded-3xl shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Moment du décrochage</p>
                          <p className="text-sm font-bold text-slate-800 leading-snug">{result.data.audit.retention.dropOffPoint}</p>
                       </div>
                       <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Comparaison Virale</p>
                          <p className="text-sm font-bold text-indigo-900 leading-snug">{result.data.audit.retention.viralComparison}</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
                </>
              )}

              {/* Benchmark Concurrent Section */}
              {resultTab === 'benchmark' && result.data.benchmark && (
                <div className="max-w-4xl mx-auto mt-6 mb-6">
                  <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                       <Swords size={16} />
                       Benchmark par rapport aux concurrents
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                          <div className="bg-slate-50 rounded-3xl p-6 mb-6">
                             <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wide">Moyennes de la niche : {result.data.benchmark.niche}</p>
                             <div className="flex flex-col gap-3">
                               <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <span className="text-sm font-medium text-slate-600">Vues / vidéo</span>
                                  <span className="text-sm font-black text-slate-900">{result.data.benchmark.competitorAverages.views >= 1000 ? (result.data.benchmark.competitorAverages.views / 1000).toFixed(1) + 'k' : result.data.benchmark.competitorAverages.views}</span>
                               </div>
                               <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <span className="text-sm font-medium text-slate-600">Taux d'engagement</span>
                                  <span className="text-sm font-black text-slate-900">{result.data.benchmark.competitorAverages.engagement}%</span>
                               </div>
                               <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <span className="text-sm font-medium text-slate-600">Fréquence de post</span>
                                  <span className="text-sm font-black text-slate-900">{result.data.benchmark.competitorAverages.postFrequency}</span>
                               </div>
                             </div>
                          </div>
                          
                          <div className="bg-indigo-50 rounded-3xl p-6">
                             <p className="text-xs font-bold text-indigo-600 mb-4 uppercase tracking-wide flex items-center gap-2"><TrendingUp size={14}/> Tendances actuelles</p>
                             <ul className="space-y-3">
                               {result.data.benchmark.nicheTrends.map((trend, i) => (
                                 <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
                                   <Zap size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                   <span className="font-medium">{trend}</span>
                                 </li>
                               ))}
                             </ul>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-6">
                          <div className="bg-emerald-50 rounded-3xl p-6 flex-1">
                             <p className="text-xs font-bold text-emerald-600 mb-4 uppercase tracking-wide flex items-center gap-2"><CheckCircle size={14}/> Vos Forces</p>
                             <ul className="space-y-3">
                               {result.data.benchmark.strengths.map((strength, i) => (
                                 <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                                   <div className="bg-emerald-200 p-1 rounded-full shrink-0 mt-0.5"><Check size={10} className="text-emerald-700" /></div>
                                   <span className="font-medium">{strength}</span>
                                 </li>
                               ))}
                             </ul>
                          </div>
                          <div className="bg-rose-50 rounded-3xl p-6 flex-1">
                             <p className="text-xs font-bold text-rose-600 mb-4 uppercase tracking-wide flex items-center gap-2"><AlertCircle size={14}/> Points d'Amélioration</p>
                             <ul className="space-y-3">
                               {result.data.benchmark.weaknesses.map((weakness, i) => (
                                 <li key={i} className="flex items-start gap-2 text-sm text-rose-900">
                                   <div className="bg-rose-200 p-1 rounded-full shrink-0 mt-0.5"><X size={10} className="text-rose-700" /></div>
                                   <span className="font-medium">{weakness}</span>
                                 </li>
                               ))}
                             </ul>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Générateur de Contenu */}
              {resultTab === 'content' && result.data.contentGenerator && (
                <div className="max-w-4xl mx-auto mt-6 mb-6">
                  <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 border border-fuchsia-100/50 rounded-[40px] p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600 flex items-center gap-2">
                         <Lightbulb size={16} />
                         Générateur de Contenu IA (SaaS)
                      </h3>
                      <button 
                        onClick={handleGenerateContent}
                        disabled={isGeneratingContent}
                        className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-fuchsia-100"
                      >
                        {isGeneratingContent ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {isGeneratingContent ? 'Génération...' : 'Générer de nouvelles idées'}
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                       {result.data.contentGenerator.ideas.map((idea, index) => (
                         <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-fuchsia-100/50 flex flex-col relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-black text-lg text-slate-900 pr-12">{idea.title}</h4>
                              <span className="text-xs font-bold px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full flex items-center gap-1 shrink-0"><PlaySquare size={12}/> {idea.format}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                               <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                                  <p className="text-[10px] font-black uppercase text-amber-600 tracking-wide mb-2 flex items-center gap-1.5"><Megaphone size={14}/> Accroche Fort (Hook)</p>
                                  <p className="text-sm font-bold text-amber-900 italic">"{idea.hook}"</p>
                               </div>
                               
                               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wide mb-2 flex items-center gap-1.5"><PenTool size={14}/> Script complet</p>
                                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{idea.script}</p>
                               </div>
                               
                               <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100/50">
                                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wide mb-2 flex items-center gap-1.5"><TrendingUp size={14}/> Call-To-Action (CTA)</p>
                                  <p className="text-sm font-bold text-indigo-900">"{idea.cta}"</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {/* IA Insights Section */}
              {resultTab === 'insights' && (
                <div className="max-w-4xl mx-auto mt-6 mb-6">
                  {result.data.aiInsights?.isGenerated ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Sparkles size={120} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                             <Sparkles size={16} />
                             Analyse Stratégique IA
                          </h3>
                          <button 
                            onClick={handleAIAnalysis}
                            disabled={isGeneratingAI}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                          >
                            {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            {isGeneratingAI ? 'Analyse...' : 'Refaire l\'analyse'}
                          </button>
                        </div>
                        <p className="text-xl font-bold leading-relaxed mb-8">{result.data.aiInsights?.summary || "Analyse en chargement..."}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                              <p className="text-[10px] font-black uppercase text-emerald-400 mb-4 tracking-widest flex items-center gap-2">
                                <CheckCircle size={14} /> Vos points forts
                              </p>
                              <ul className="space-y-3">
                                {(result.data.aiInsights?.strengths || []).map((s, i) => (
                                  <li key={i} className="text-sm font-medium flex items-start gap-2">
                                    <span className="text-emerald-400 mt-1">•</span> {s}
                                  </li>
                                ))}
                              </ul>
                           </div>
                           <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                              <p className="text-[10px] font-black uppercase text-rose-400 mb-4 tracking-widest flex items-center gap-2">
                                <AlertTriangle size={14} /> Vos points faibles
                              </p>
                              <ul className="space-y-3">
                                {(result.data.aiInsights?.weaknesses || []).map((w, i) => (
                                  <li key={i} className="text-sm font-medium flex items-start gap-2">
                                    <span className="text-rose-400 mt-1">•</span> {w}
                                  </li>
                                ))}
                              </ul>
                           </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                           <TrendingUp size={16} className="text-indigo-500" />
                           Plan de Croissance Personnalisé
                        </h3>
                        <div className="space-y-4">
                           {(result.data.aiInsights?.growthPlan || []).map((step, i) => (
                             <div key={i} className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl group hover:bg-indigo-50 transition-colors">
                                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm group-hover:border-indigo-200">
                                   {i + 1}
                                </div>
                                <p className="text-sm font-bold text-slate-800">{step}</p>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-[40px] p-8">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-6 flex items-center gap-2">
                            <Lightbulb size={16} />
                            Idées de Contenu Viral (Par l'IA)
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(result.data.aiInsights?.contentIdeas || []).map((idea, i) => (
                              <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-amber-200/50">
                                 <h4 className="font-black text-slate-900 mb-3">{idea.title}</h4>
                                 <div className="bg-amber-100/50 p-3 rounded-2xl mb-3">
                                    <p className="text-[9px] font-black uppercase text-amber-700 mb-1">Accroche (Hook)</p>
                                    <p className="text-xs font-bold text-amber-900 italic">"{idea.hook}"</p>
                                 </div>
                                 <p className="text-xs text-slate-600 leading-relaxed font-medium">{idea.description}</p>
                              </div>
                            ))}
                         </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-white border border-slate-100 rounded-[40px] p-12 text-center shadow-sm">
                       <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Sparkles size={40} className={isGeneratingAI ? 'animate-pulse' : ''} />
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 mb-2">Analyse Stratégique IA</h3>
                       <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                         Laissez notre IA analyser vos données pour créer un plan de croissance sur mesure et de nouvelles idées de vidéos.
                       </p>
                       <button 
                         onClick={handleAIAnalysis}
                         disabled={isGeneratingAI}
                         className="px-8 py-4 bg-slate-900 text-white font-bold rounded-[32px] hover:bg-indigo-600 transition-all flex items-center gap-3 mx-auto disabled:opacity-50 shadow-xl shadow-indigo-100"
                       >
                         {isGeneratingAI ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                         {isGeneratingAI ? 'Analyse en cours...' : 'Générer l\'analyse IA'}
                       </button>
                    </div>
                  )}
                </div>
              )}

              {/* Overview Wrapper */}
              {resultTab === 'overview' && (
                <>
              {/* Virality & Revenue Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                 {/* Virality Score */}
                 <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score de Viralité</h3>
                      <div className="bg-fuchsia-50 p-2 rounded-xl">
                        <Zap size={18} className="text-fuchsia-600" />
                      </div>
                    </div>
                    <div className="flex items-end gap-4 mb-4">
                      <span className="text-5xl font-black text-slate-900 leading-none">{result.data.viralityScore}</span>
                      <span className="text-xl font-bold text-slate-300 mb-1">/ 100</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${result.data.viralityScore}%` }}
                         className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-full"
                       />
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      Probabilité de percer sur le prochain post : <span className="font-black text-slate-900">
                        {result.data.viralityScore > 80 ? 'Exceptionnelle' : result.data.viralityScore > 60 ? 'Très Forte' : result.data.viralityScore > 40 ? 'Moyenne' : 'Modérée'}
                      </span>
                    </p>
                 </div>

                 {/* Detailed Revenue */}
                 <div className="bg-slate-900 rounded-[40px] p-8 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Potentiel de Gains (Mensuel)</h3>
                      <div className="bg-white/10 p-2 rounded-xl">
                        <Euro size={18} className="text-emerald-400" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-slate-400">Fonds Créateurs ✨</span>
                           <span className="text-lg font-black">{result.data.estimatedRevenue} €</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-400" style={{ width: '33.33%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-slate-400">Partenariats Marques 🤝</span>
                           <span className="text-lg font-black">{result.data.brandDealRevenue} €</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-400 w-full" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                        *Basé sur {formatNumber(result.data.stats.followers)} abonnés et {result.data.stats.engagementRate}% d'engagement.
                      </p>
                    </div>
                 </div>
              </div>

              {/* Audience Insights Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                 <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intérêts de l'Audience (IA)</h3>
                      <div className="bg-sky-50 p-2 rounded-xl">
                        <Users size={18} className="text-sky-600" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                       {result.data.audienceInterests?.map((interest, idx) => (
                         <span key={idx} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                           {interest}
                         </span>
                       ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Analysé via vos hashtags les plus performants.</p>
                 </div>

                 <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fidélité de l'Audience</h3>
                      <div className="bg-emerald-50 p-2 rounded-xl">
                        <Heart size={18} className="text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                       <span className="text-4xl font-black text-slate-900 leading-none">{result.data.audienceLoyalty}%</span>
                       <span className="text-xs font-bold text-emerald-600 uppercase mb-1 tracking-wider">High Quality</span>
                    </div>
                    <div className="space-y-3">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Engagement Score</span>
                          <span>{result.data.audienceLoyalty}/100</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${result.data.audienceLoyalty}%` }} />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Grid Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                  icon={Users} 
                  label="Abonnés" 
                  value={formatNumber(result.data.stats.followers)} 
                  cardClass="bg-[#25F4EE]/10 border-2 border-[#25F4EE]"
                  labelClass="text-[#0ca8a4]"
                  valueClass="text-slate-900"
                  iconClass="bg-[#25F4EE]/20 text-[#0ca8a4]"
                />
                <StatCard 
                  icon={Heart} 
                  label="J'aimes" 
                  value={formatNumber(result.data.stats.likes)} 
                  cardClass="bg-[#FE2C55]/10 border-2 border-[#FE2C55]"
                  labelClass="text-[#b81d3d]"
                  valueClass="text-slate-900"
                  iconClass="bg-[#FE2C55]/20 text-[#b81d3d]"
                />
                <StatCard 
                  icon={Video} 
                  label="Vidéos" 
                  value={formatNumber(result.data.stats.videos)} 
                  cardClass="bg-white border-2 border-slate-200 shadow-sm"
                  labelClass="text-slate-500"
                  valueClass="text-slate-900"
                  iconClass="bg-slate-100 text-slate-500"
                />
                <StatCard 
                  icon={TrendingUp} 
                  label="Taux d'Engagement" 
                  value={`${result.data.stats.engagementRate}%`} 
                  cardClass="bg-slate-900 border-2 border-slate-900 shadow-xl"
                  labelClass="text-slate-400"
                  valueClass="text-white italic"
                  iconClass="bg-slate-800 text-[#25F4EE]"
                  helpText={
                    <div>
                      <p className="font-black mb-1 text-indigo-300 uppercase tracking-tighter">Comment c'est calculé ?</p>
                      Le ratio des interactions (Likes + Commentaires + Partages) divisé par le nombre de vues sur les dernières vidéos.
                      <br/><br/>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Excellent:</span> <span className="text-green-400 font-bold">{">"} 5%</span></div>
                        <div className="flex justify-between"><span>Bon:</span> <span className="text-blue-400 font-bold">2-5%</span></div>
                        <div className="flex justify-between"><span>Faible:</span> <span className="text-slate-400 font-bold">{"<"} 2%</span></div>
                      </div>
                    </div>
                  }
                />
                <StatCard 
                  icon={AlertCircle} 
                  label="Authenticité" 
                  value={`${authenticityScore}/100`} 
                  cardClass={authenticityScore >= 70 ? "bg-emerald-50 border-2 border-emerald-200 shadow-sm" : authenticityScore >= 40 ? "bg-amber-50 border-2 border-amber-200 shadow-sm" : "bg-red-50 border-2 border-red-200 shadow-sm"}
                  labelClass={authenticityScore >= 70 ? "text-emerald-600" : authenticityScore >= 40 ? "text-amber-600" : "text-red-600"}
                  valueClass={authenticityScore >= 70 ? "text-emerald-900" : authenticityScore >= 40 ? "text-amber-900" : "text-red-900"}
                  iconClass={authenticityScore >= 70 ? "bg-emerald-200 text-emerald-700" : authenticityScore >= 40 ? "bg-amber-200 text-amber-700" : "bg-red-200 text-red-700"}
                  helpText={
                    <div>
                      <p className="font-black mb-1 text-indigo-300 uppercase tracking-tighter">Détecteur de faux abonnés</p>
                      Ratio entre nombre d'abonnés et vues moyennes, pondéré par le taux d'engagement.
                      <br/><br/>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Sain:</span> <span className="text-green-400 font-bold">70 - 100</span></div>
                        <div className="flex justify-between"><span>Moyen:</span> <span className="text-amber-400 font-bold">40 - 69</span></div>
                        <div className="flex justify-between"><span>Risqué:</span> <span className="text-red-400 font-bold">{"<"} 40</span></div>
                      </div>
                    </div>
                  }
                />
                <StatCard 
                  icon={Clock} 
                  label="Heure idéale (Top 10)" 
                  value={idealPostingTime || "N/A"} 
                  cardClass="bg-indigo-50 border-2 border-indigo-200 shadow-sm"
                  labelClass="text-indigo-600"
                  valueClass="text-indigo-900"
                  iconClass="bg-indigo-200 text-indigo-700"
                  helpText={
                    <div>
                      <p className="font-black mb-1 text-indigo-300 uppercase tracking-tighter">Meilleur moment</p>
                      Basé sur l'heure de publication de vos 10 dernières vidéos ayant généré le plus de vues en moyenne.
                    </div>
                  }
                />
              </div>

              {/* Tags Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 page-break-inside-avoid">
                
                {/* Watch Time / Average Duration */}
                {result.data.averageDuration !== undefined && (
                  <div className="bg-slate-900 border-2 border-slate-900 rounded-[32px] p-6 shadow-xl flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-xs font-black uppercase tracking-widest text-[#25F4EE]">Durée Moyenne</p>
                      <div className="p-2 rounded-xl bg-slate-800 text-[#25F4EE]">
                        <Clock size={20} />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white italic">{result.data.averageDuration}s</h2>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Moyenne par vidéo</p>
                    </div>
                  </div>
                )}

                {/* Additional Stats */}
                <div className="bg-white border border-slate-100 rounded-[32px] p-5 shadow-sm flex flex-col justify-center space-y-3">
                   <div className="flex flex-col bg-slate-50 p-3 rounded-2xl relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Share2 size={14}/> Partages</span>
                        <span className="text-lg font-black text-slate-900">{result.data.shareRate}%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Le ratio global des partages par rapport aux vues</p>
                   </div>
                   <div className="flex flex-col bg-slate-50 p-3 rounded-2xl relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><MessageCircle size={14}/> Comms</span>
                        <span className="text-lg font-black text-slate-900">{result.data.commentRate}%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Le ratio global des commentaires par rapport aux vues</p>
                   </div>
                   <div className="flex flex-col bg-slate-50 p-3 rounded-2xl relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Calendar size={14}/> Fréquence</span>
                        <span className="text-lg font-black text-slate-900">{result.data.postFrequency}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Calcul basé sur l'écart de temps des publications</p>
                   </div>
                </div>

                {/* Top Hashtags */}
                <div className="bg-white border text-left border-slate-100 rounded-[32px] p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Top Hashtags</p>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                      <Hash size={20} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    {result.data.topHashtags && result.data.topHashtags.length > 0 ? (
                      result.data.topHashtags.map((tag, i) => (
                        <div key={i} className="flex flex-col bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                               <span className="text-[#25F4EE] font-black">#</span>
                               <span className="font-extrabold text-slate-800 text-sm">{tag.tag}</span>
                               <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-md font-bold">{tag.count}x</span>
                            </div>
                            {tag.avgViews ? (
                               <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">~{formatNumber(tag.avgViews)} vues/vid</span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-400 font-medium italic">Aucun hashtag...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Audit Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 page-break-inside-avoid">
                
                {/* Estimated Revenue */}
                <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[28px] p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Revenus</p>
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                      <span className="font-extrabold text-sm leading-none">€</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-emerald-900">{result.data.estimatedRevenue !== undefined ? `~${formatNumber(result.data.estimatedRevenue)}€` : "N/A"}</h2>
                    <p className="text-[9px] text-emerald-600/80 mt-1.5 font-bold leading-tight">Basé sur vidéos {'>'} 1m</p>
                  </div>
                </div>

                {/* Virality Score */}
                <div className="bg-fuchsia-50 border-2 border-fuchsia-100 rounded-[28px] p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600">Viralité</p>
                    <div className="p-1.5 rounded-lg bg-fuchsia-100 text-fuchsia-600">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-end gap-1.5">
                       <h2 className="text-3xl font-black text-fuchsia-900 leading-none">{result.data.viralityScore || 0}</h2>
                       <span className="text-xs font-black text-fuchsia-400 mb-0.5">/ 100</span>
                    </div>
                    <div className="w-full bg-fuchsia-200/50 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 h-1.5 rounded-full" style={{ width: `${result.data.viralityScore || 0}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Best Post Time */}
                <div className="bg-amber-50 border-2 border-amber-100 rounded-[28px] p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Horaire</p>
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                      <Clock size={16} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-amber-900 leading-tight">{result.data.bestPostTime || "N/A"}</h2>
                    <p className="text-[9px] text-amber-600/80 mt-1 font-bold leading-tight uppercase">Pic d'audience</p>
                  </div>
                </div>

                {/* Dominant Keywords */}
                <div className="bg-white border text-left border-slate-100 rounded-[28px] p-5 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mots-clés</p>
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                      <Search size={16} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.data.dominantKeywords && result.data.dominantKeywords.length > 0 ? (
                      result.data.dominantKeywords.slice(0, 3).map((kw: any, i: number) => (
                        <div key={i} className="bg-slate-900 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          {kw.tag}
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-slate-400 font-medium italic mt-1">
                         Aucun mot-clé...
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Chart and engagement summary */}
              <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-xl font-black">Croissance et Vues</h3>
                    <p className="text-sm text-slate-500 font-medium">Évolution sur les dernières vidéos</p>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-sm font-bold text-slate-400">Vues réelles</span>
                  </div>
                </div>
                
                {/* Recharts area chart with dual axes */}
                <div className="h-64 sm:h-80 w-full">
                  {result.data.chartData && result.data.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={result.data.chartData} 
                        margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#25F4EE" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#25F4EE" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FE2C55" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#FE2C55" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} 
                          dy={10}
                          interval="preserveStartEnd"
                          minTickGap={20}
                        />
                        <YAxis 
                          yAxisId="left"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#25F4EE', fontWeight: 900 }} 
                          tickFormatter={formatNumber}
                          width={50}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#FE2C55', fontWeight: 900 }} 
                          tickFormatter={formatNumber}
                          width={50}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid #f1f5f9', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                            fontWeight: 'bold',
                            padding: '12px'
                          }} 
                          labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                          itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                          formatter={(value: any) => [new Intl.NumberFormat('fr-FR').format(value), ""]}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          iconType="circle"
                          wrapperStyle={{ 
                            fontSize: '10px', 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            paddingBottom: '20px'
                          }}
                        />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="views" 
                          name="Vues" 
                          stroke="#25F4EE" 
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          activeDot={{ r: 6, strokeWidth: 0 }} 
                        />
                        <Area 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="likes" 
                          name="Likes" 
                          stroke="#FE2C55" 
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorLikes)"
                          activeDot={{ r: 6, strokeWidth: 0 }} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 rounded-2xl">
                      Aucune donnée d'évolution disponible
                    </div>
                  )}
                </div>
              </div>
                </>
              )}

              {/* Latest Videos Area */}
              {resultTab === 'content' && result.data.videos && result.data.videos.length > 0 && (
                <div className="mt-8 page-break-before">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-2xl font-black">Dernières Vidéos</h3>
                    
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-xl pl-4 pr-10 py-2 outline-none focus:ring-4 focus:ring-slate-300/20 transition-all cursor-pointer appearance-none shrink-0"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                    >
                       <option value="recent">Plus récentes</option>
                       <option value="views">Plus de vues</option>
                       <option value="likes">Plus de likes</option>
                       <option value="comments">D'engagement</option>
                    </select>
                  </div>

                  {/* Best Video Highlight */}
                  {result.data.bestVideo && (
                    <div className="mb-8 bg-slate-100 p-0.5 rounded-[24px]">
                      <div className="bg-white rounded-[22px] p-3 flex flex-row gap-4 items-center">
                        <div className="w-[100px] aspect-[3/4] bg-slate-50 relative rounded-[14px] overflow-hidden shrink-0 shadow-sm transition-transform hover:scale-105">
                           {result.data.bestVideo.cover ? (
                              <img src={result.data.bestVideo.cover} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-8 h-8 text-slate-200" />
                              </div>
                           )}
                           <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-yellow-900 font-black text-[8px] px-1.5 py-0.5 rounded-full shadow-sm uppercase">
                             Top
                           </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-900 mb-2 truncate">
                            {result.data.bestVideo.desc}
                          </h4>
                          <div className="flex gap-4">
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Vues</p>
                               <p className="text-lg font-black text-[#FE2C55] leading-none">{formatNumber(result.data.bestVideo.views)}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Likes</p>
                               <p className="text-lg font-black text-[#25F4EE] leading-none">{formatNumber(result.data.bestVideo.likes)}</p>
                            </div>
                            <div className="hidden sm:block border-l border-slate-100 pl-4">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Estimation Revenus</p>
                               <p className="text-sm font-black text-emerald-600 leading-none">
                                 {result.data.bestVideo.views > 1000 ? `~${(result.data.bestVideo.views / 1000 * 0.5).toFixed(0)} - ${(result.data.bestVideo.views / 1000 * 1).toFixed(0)}€` : "< 1€"}
                               </p>
                            </div>
                            {result.data.bestVideo.music && (
                              <div className="hidden sm:block border-l border-slate-100 pl-4 max-w-[150px]">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Audio</p>
                                <p className="text-[10px] font-bold text-slate-500 truncate">{result.data.bestVideo.music.title}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedVideos.slice(0, 6).map((video) => (
                      <div key={video.id} className="bg-white border flex flex-row items-center gap-3 sm:gap-4 text-left border-slate-100 rounded-[24px] p-2.5 sm:p-3 overflow-hidden shadow-sm hover:shadow-md transition-all group relative">
                        <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-[16px] bg-slate-100 relative overflow-hidden shrink-0 shadow-inner group-hover:scale-95 transition-transform duration-300">
                          {video.cover ? (
                            <img src={video.cover} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                          
                          <div className="absolute bottom-1 w-full text-center text-white text-[9px] sm:text-[10px] font-black tracking-wider">
                            {formatNumber(video.views)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-800 line-clamp-2 mb-2 sm:mb-3 leading-tight">
                            {video.desc}
                          </p>
                          <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 font-bold mb-2">
                            <span className="flex items-center gap-1"><Heart size={12} fill="currentColor" stroke="none" className="text-[#FE2C55]"/> {formatNumber(video.likes)}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={12} fill="currentColor" stroke="none" className="text-[#25F4EE]"/> {formatNumber(video.comments)}</span>
                            <span className="flex items-center gap-1"><Share2 size={12} className="text-slate-400"/> {formatNumber(video.shares)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 w-fit rounded-lg">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Activity size={10} /> 
                              {video.views > 1000 ? `~${(video.views / 1000 * 0.5).toFixed(0)} - ${(video.views / 1000 * 1).toFixed(0)}€` : "< 1€"}
                            </span>
                          </div>
                        </div>
                        <a 
                          href={`https://www.tiktok.com/@${result.data.username || result.data.profile.nickname}/video/${video.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="absolute top-2 right-2 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-700 transition-colors sm:opacity-0 sm:-translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Kit Template (Hidden for Screen) */}
        {result && (
          <div className="fixed -left-[2000px] top-0 pointer-events-none" aria-hidden="true">
            <div id="media-kit-container" className="w-[800px] bg-white p-12 overflow-hidden font-sans border-0">
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                   <img src={result.data.profile.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" alt="" referrerPolicy="no-referrer" />
                   <div>
                     <h1 className="text-4xl font-black text-slate-900 mb-1">@{result.data.username || result.data.profile.nickname}</h1>
                     <p className="text-slate-500 font-bold">{result.data.profile.nickname}</p>
                   </div>
                </div>
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest">Media Kit Artist</span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex gap-8 mb-12">
                <div className="flex-1 bg-slate-50 p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Abonnés</p>
                  <p className="text-3xl font-black text-slate-900">{formatNumber(result.data.stats.followers)}</p>
                </div>
                <div className="flex-1 bg-slate-50 p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Engagement</p>
                  <p className="text-3xl font-black text-slate-900">{result.data.stats.engagementRate}%</p>
                </div>
                <div className="flex-1 bg-slate-50 p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Likes</p>
                  <p className="text-3xl font-black text-slate-900">{formatNumber(result.data.stats.likes)}</p>
                </div>
              </div>

              {/* Performances & Audience */}
              <div className="flex gap-8 mb-12">
                 <div className="w-1/2 p-8 border border-slate-100 rounded-3xl shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Performances Moyennes</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                          <span className="text-sm font-bold text-slate-600">Partages</span>
                          <span className="text-sm font-black">{result.data.shareRate}%</span>
                       </div>
                       <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                          <span className="text-sm font-bold text-slate-600">Commentaires</span>
                          <span className="text-sm font-black">{result.data.commentRate}%</span>
                       </div>
                       <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                          <span className="text-sm font-bold text-slate-600">Post Frequency</span>
                          <span className="text-sm font-black">{result.data.postFrequency}</span>
                       </div>
                       <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-2xl">
                          <span className="text-sm font-bold text-emerald-700">Fidélité Audience</span>
                          <span className="text-sm font-black text-emerald-800">{result.data.audienceLoyalty}%</span>
                       </div>
                    </div>
                 </div>
                 <div className="w-1/2 p-8 border border-slate-100 rounded-3xl bg-indigo-50/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6">Tendances & Audience</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                       {result.data.topHashtags?.slice(0, 5).map((t: any) => (
                         <span key={t.tag} className="px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 shadow-sm">
                           #{t.tag}
                         </span>
                       ))}
                    </div>
                    <div className="mb-8">
                       <p className="text-[9px] font-black text-indigo-400 uppercase mb-2">Piliers de l'Audience</p>
                       <div className="flex gap-2">
                         {result.data.audienceInterests?.slice(0, 3).map((interest, i) => (
                           <span key={i} className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100">
                             {interest}
                           </span>
                         ))}
                       </div>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-indigo-400 uppercase mb-2">Score de Viralité</p>
                       <div className="text-3xl font-black text-indigo-900">{result.data.viralityScore || 0} / 100</div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-3xl text-white">
                <div className="flex justify-between items-center mb-6">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Derniers Contenus</p>
                </div>
                <div className="flex gap-3">
                   {result.data.videos?.slice(0, 5).map((v: any) => (
                     <div key={v.id} className="flex-1 aspect-[9/16] rounded-xl overflow-hidden relative border border-white/5">
                       {v.cover && <img src={v.cover} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                         <span className="text-[10px] font-black text-white">{formatNumber(v.views)}</span>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
                 <p className="text-[9px] font-bold text-slate-400 italic">Généré automatiquement par TikTokAudit Pro 2024</p>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black text-slate-900 uppercase">Verified Data</span>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>


        {appTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Clock className="text-indigo-500" /> Historique des Audits
              </h2>
              {Object.keys(savedAnalyses).length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Effacer
                </button>
              )}
            </div>

            {Object.keys(savedAnalyses).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                 <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock size={32} className="text-slate-300" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun historique</h3>
                 <p className="text-slate-500 font-medium">Vous n'avez pas encore effectué d'audit.</p>
                 <button 
                   onClick={() => setAppTab('search')}
                   className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors"
                 >
                   Faire un audit
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(savedAnalyses).reverse().map((analysis: AnalysisResult, index: number) => {
                  if (!analysis || !analysis.data) return null;
                  
                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                      onClick={() => {
                        setResult(analysis);
                        setAppTab('search');
                        setResultTab('overview');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={analysis.data.profile.avatar || `https://ui-avatars.com/api/?name=${analysis.data.username}&background=random`} 
                            alt={analysis.data.username} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
                            crossOrigin="anonymous"
                          />
                          <div>
                            <h3 className="font-black text-lg text-slate-900">@{analysis.data.username}</h3>
                            <p className="text-sm font-medium text-slate-500">{analysis.data.profile.nickname}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 text-xs font-bold rounded-full ${(analysis.data.viralityScore || 0) > 70 ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-slate-100 text-slate-600'}`}>
                           {analysis.data.viralityScore || 0}/100 Virality
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-auto">
                        <div className="bg-slate-50 p-3 rounded-2xl text-center">
                           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Abonnés</p>
                           <p className="text-sm font-black text-slate-900">{formatNumber(analysis.data.stats.followers)}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center">
                           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Engagement</p>
                           <p className="text-sm font-black text-slate-900">{analysis.data.stats.engagementRate}%</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center">
                           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Rev / mois</p>
                           <p className="text-sm font-black text-slate-900">{formatNumber(analysis.data.estimatedRevenue || 0)}€</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation */}
      <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <div className={`bg-slate-900/95 backdrop-blur-xl border border-white/10 p-1 rounded-[32px] shadow-2xl flex items-center font-sans pointer-events-auto transition-all duration-500 ease-out ${result ? 'max-w-[min(640px,calc(100vw-32px))] w-full justify-evenly' : 'w-fit justify-center gap-2'}`}>
           <button 
             onClick={() => { setAppTab('search'); setResult(null); }} 
             className={`flex flex-col items-center gap-0.5 min-w-[44px] px-0.5 py-1.5 rounded-[24px] transition-all ${appTab === 'search' && !result ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
           >
             <Search size={20} className={appTab === 'search' && !result ? 'stroke-[2.5px]' : ''} />
             <span className="text-[9px] font-bold">Nouveau</span>
           </button>
           
           {result && appTab === 'search' && (
             <>
               <div className="w-px h-6 bg-white/10 mx-0.5"></div>
               
               <button 
                 onClick={() => setResultTab('overview')} 
                 className={`flex flex-col items-center gap-0.5 min-w-[44px] px-0.5 py-1.5 rounded-[24px] transition-all ${resultTab === 'overview' ? 'bg-[#25F4EE]/20 text-[#25F4EE]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 <Activity size={20} className={resultTab === 'overview' ? 'stroke-[2.5px]' : ''} />
                 <span className="text-[9px] font-bold">Global</span>
               </button>
               
               <button 
                 onClick={() => setResultTab('audit')} 
                 className={`flex flex-col items-center gap-0.5 min-w-[44px] px-0.5 py-1.5 rounded-[24px] transition-all ${resultTab === 'audit' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 <Eye size={20} className={resultTab === 'audit' ? 'stroke-[2.5px]' : ''} />
                 <span className="text-[9px] font-bold">Audit</span>
               </button>
               
               <button 
                 onClick={() => setResultTab('benchmark')} 
                 className={`flex flex-col items-center gap-0.5 min-w-[44px] px-0.5 py-1.5 rounded-[24px] transition-all ${resultTab === 'benchmark' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 <Swords size={20} className={resultTab === 'benchmark' ? 'stroke-[2.5px]' : ''} />
                 <span className="text-[9px] font-bold">Rivaux</span>
               </button>
               
               <button 
                 onClick={() => setResultTab('content')} 
                 className={`flex flex-col items-center gap-0.5 min-w-[44px] px-0.5 py-1.5 rounded-[24px] transition-all ${resultTab === 'content' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 <Lightbulb size={20} className={resultTab === 'content' ? 'stroke-[2.5px]' : ''} />
                 <span className="text-[9px] font-bold">Idées</span>
               </button>

               <button 
                 onClick={() => setResultTab('insights')} 
                 className={`flex flex-col items-center gap-0.5 min-w-[44px] px-0.5 py-1.5 rounded-[24px] transition-all ${resultTab === 'insights' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 <Sparkles size={20} className={resultTab === 'insights' ? 'stroke-[2.5px]' : ''} />
                 <span className="text-[9px] font-bold">IA</span>
               </button>
             </>
           )}

           <div className="w-px h-6 bg-white/10 mx-0.5"></div>

           <button 
             onClick={() => { setAppTab('history'); setResult(null); }} 
             className={`flex flex-col items-center gap-0.5 min-w-[44px] px-0.5 py-1.5 rounded-[24px] transition-all ${appTab === 'history' && !result ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
           >
             <Clock size={20} className={appTab === 'history' && !result ? 'stroke-[2.5px]' : ''} />
             <span className="text-[9px] font-bold">Historique</span>
           </button>
        </div>
      </div>
    </div>
  );
}

