import React, { useEffect } from 'react';
import { AnalysisResult } from '../types';
import { formatNumber } from '../App';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Activity, Users, Heart, TrendingUp, Zap, Clock, CalendarDays, Award, MessageCircle, Share2, PlaySquare } from 'lucide-react';

interface PrintReportProps {
  result: AnalysisResult;
  onClose: () => void;
}

export default function PrintReport({ result, onClose }: PrintReportProps) {
  useEffect(() => {
    // Petit délai pour laisser le graphique et autres éléments se charger avant de proposer l'impression
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const d = result.data;

  return (
    <div className="min-h-screen bg-white">
      {/* Barre d'outils (cachée à l'impression) */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between items-center z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors"
          >
            ← Retour
          </button>
          <p className="text-sm font-medium">Aperçu avant impression</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-[#FE2C55] hover:bg-red-600 rounded-lg text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimer ce rapport
        </button>
      </div>

      <div className="print:hidden h-20"></div>

      {/* Rendu de la page à imprimer */}
      <div className="print-content max-w-[210mm] mx-auto bg-white p-[15mm] print:p-0">
        
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FE2C55] to-[#25F4EE] p-[2px]">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-white">
                <img src={d.profile.avatar} alt={d.profile.nickname} className="w-full h-full object-cover" crossOrigin="anonymous" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{d.profile.nickname}</h1>
              <p className="text-lg font-bold text-slate-500">@{d.username}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
              <Zap size={20} className="text-[#FE2C55]" />
              <span className="font-black text-xl tracking-tighter">Viral<span className="text-[#FE2C55]">Scope</span></span>
            </div>
            <p className="text-xs font-bold text-slate-400">Rapport généré le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8 italic">
          "{d.profile.bio}"
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#FE2C55]/5 border border-[#FE2C55]/20 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-[#FE2C55] tracking-widest mb-1">Abonnés</p>
            <p className="text-2xl font-black text-slate-900">{formatNumber(d.stats.followers)}</p>
          </div>
          <div className="bg-[#25F4EE]/10 border border-[#25F4EE]/30 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-[#0ebfb9] tracking-widest mb-1">Engagement</p>
            <p className="text-2xl font-black text-slate-900">{d.stats.engagementRate}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">J'aime</p>
            <p className="text-2xl font-black text-slate-900">{formatNumber(d.stats.likes)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Score Viralité</p>
            <p className="text-2xl font-black text-emerald-900">{d.viralityScore}/100</p>
          </div>
        </div>

        {/* Stats Content */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Statistiques de Contenu</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 border-dashed">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Clock size={16}/> Durée moy.</span>
                <span className="font-black text-slate-900">{d.averageDuration}s</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 border-dashed">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><CalendarDays size={16}/> Rythme</span>
                <span className="font-black text-slate-900">{d.postFrequency}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 border-dashed">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Award size={16}/> Meilleur moment</span>
                <span className="font-black text-slate-900">{d.bestPostTime}</span>
              </div>
            </div>
          </div>
          <div>
             <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Revenus Estimés (Mensuel)</h2>
             <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-6 text-center h-[calc(100%-2.5rem)] flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">Fonds Créateur (Beta)</p>
                <div className="text-4xl font-black text-emerald-900 mb-2">~{formatNumber(d.estimatedRevenue)}€</div>
                <p className="text-xs font-bold text-emerald-700/60 max-w-[200px] mx-auto">Basé uniquement sur les vues éligibles (vidéos &gt; 1min)</p>
             </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-8 page-break-inside-avoid">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Évolution des 10 dernières vidéos</h2>
          <div className="h-48 w-full">
            {d.chartData && d.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} dy={10} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#25F4EE', fontWeight: 900 }} tickFormatter={formatNumber} width={40} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#FE2C55', fontWeight: 900 }} tickFormatter={formatNumber} width={40} />
                  <Area yAxisId="left" type="monotone" dataKey="views" stroke="#25F4EE" strokeWidth={3} fillOpacity={0.2} fill="#25F4EE" isAnimationActive={false} />
                  <Area yAxisId="right" type="monotone" dataKey="likes" stroke="#FE2C55" strokeWidth={3} fillOpacity={0.2} fill="#FE2C55" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 rounded-xl">Aucune donnée</div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#25F4EE]"></div><span className="text-[10px] font-black uppercase">Vues</span></div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FE2C55]"></div><span className="text-[10px] font-black uppercase">Likes</span></div>
          </div>
        </div>

        {/* AI Insights & Recommendations */}
        {d.aiInsights && (
          <div className="page-break-inside-avoid mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-2 mb-4">Audit & Recommandations de l'IA</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Forces</h3>
                <ul className="space-y-2">
                  {d.aiInsights.strengths.map((f: string, i: number) => (
                    <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Axes d'Amélioration</h3>
                <ul className="space-y-2">
                  {d.aiInsights.weaknesses.map((f: string, i: number) => (
                    <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span> <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Plan d'Action Recommandé</h3>
               <div className="space-y-3">
                  {d.aiInsights.growthPlan.slice(0, 3).map((r: string, i: number) => (
                    <div key={i} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                       <h4 className="font-bold text-sm text-indigo-900 mb-1">Étape {i + 1}</h4>
                       <p className="text-xs font-medium text-slate-600 leading-snug">{r}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

      </div>
      
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
