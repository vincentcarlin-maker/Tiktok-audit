import React, { useEffect } from 'react';
import { AnalysisResult } from '../types';
import { formatNumber } from '../App';
import { Zap } from 'lucide-react';

interface PrintMediaKitProps {
  result: AnalysisResult;
  onClose: () => void;
}

export default function PrintMediaKit({ result, onClose }: PrintMediaKitProps) {
  useEffect(() => {
    // Petit délai pour laisser les images se charger avant de proposer l'impression
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const d = result.data;

  // Render the Media Kit exactly like the previous hidden template
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-10 print:py-0 print:bg-white">
      {/* Barre d'outils (cachée à l'impression) */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between items-center z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors"
          >
            ← Retour
          </button>
          <p className="text-sm font-medium">Aperçu du Media Kit avant impression</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-[#FE2C55] hover:bg-red-600 rounded-lg text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimer ce Media Kit
        </button>
      </div>

      <div className="print:hidden h-16"></div>

      {/* Rendu de la page à imprimer */}
      <div className="print-content w-[800px] h-fit bg-white p-12 overflow-hidden font-sans border-0 shadow-2xl print:shadow-none mx-auto origin-top" style={{ transform: "scale(min(1, calc(100vw / 850)))", transformOrigin: "top center" }}>
        
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-6">
            <img src={d.profile.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" alt="" crossOrigin="anonymous" />
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-1">@{d.username || d.profile.nickname}</h1>
              <p className="text-slate-500 font-bold">{d.profile.nickname}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-2 justify-end text-slate-800 mb-2">
              <Zap size={20} className="text-[#FE2C55]" />
              <span className="font-black text-xl tracking-tighter">Viral<span className="text-[#FE2C55]">Scope</span></span>
             </div>
            <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl inline-block mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Media Kit Artist</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-8 mb-12">
          <div className="flex-1 bg-slate-50 p-6 rounded-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Abonnés</p>
            <p className="text-3xl font-black text-slate-900">{formatNumber(d.stats.followers)}</p>
          </div>
          <div className="flex-1 bg-slate-50 p-6 rounded-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Engagement</p>
            <p className="text-3xl font-black text-slate-900">{d.stats.engagementRate}%</p>
          </div>
          <div className="flex-1 bg-slate-50 p-6 rounded-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Likes</p>
            <p className="text-3xl font-black text-slate-900">{formatNumber(d.stats.likes)}</p>
          </div>
        </div>

        {/* Performances & Audience */}
        <div className="flex gap-8 mb-12">
           <div className="w-1/2 p-8 border border-slate-100 rounded-3xl shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Performances Moyennes</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                    <span className="text-sm font-bold text-slate-600">Partages</span>
                    <span className="text-sm font-black">{d.shareRate}%</span>
                 </div>
                 <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                    <span className="text-sm font-bold text-slate-600">Commentaires</span>
                    <span className="text-sm font-black">{d.commentRate}%</span>
                 </div>
                 <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                    <span className="text-sm font-bold text-slate-600">Post Frequency</span>
                    <span className="text-sm font-black">{d.postFrequency}</span>
                 </div>
                 <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-2xl">
                    <span className="text-sm font-bold text-emerald-700">Fidélité Audience</span>
                    <span className="text-sm font-black text-emerald-800">{d.audienceLoyalty}%</span>
                 </div>
              </div>
           </div>
           <div className="w-1/2 p-8 border border-slate-100 rounded-3xl bg-indigo-50/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-12 translate-x-12"></div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6">Tendances & Audience</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                 {d.topHashtags?.slice(0, 5).map((t: any) => (
                   <span key={t.tag} className="px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 shadow-sm">
                     #{t.tag}
                   </span>
                 ))}
              </div>
              <div className="mb-8">
                 <p className="text-[9px] font-black text-indigo-400 uppercase mb-2">Piliers de l'Audience</p>
                 <div className="flex gap-2">
                   {d.audienceInterests?.slice(0, 3).map((interest, i) => (
                     <span key={i} className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100">
                       {interest}
                     </span>
                   ))}
                 </div>
              </div>
              <div>
                 <p className="text-[9px] font-black text-indigo-400 uppercase mb-2">Score de Viralité</p>
                 <div className="text-3xl font-black text-indigo-900">{d.viralityScore || 0} / 100</div>
              </div>
           </div>
        </div>

        <div className="p-8 bg-slate-900 rounded-3xl text-white page-break-inside-avoid shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
          <div className="flex justify-between items-center mb-6 relative">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Derniers Contenus Performants</p>
          </div>
          <div className="flex gap-3 relative">
             {d.videos?.slice(0, 5).map((v: any) => (
               <div key={v.id} className="flex-1 aspect-[9/16] rounded-xl overflow-hidden relative border border-white/10 shadow-lg">
                 {v.cover && <img src={v.cover} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                   <div className="w-full">
                     <span className="text-[10px] font-black text-white block truncate mb-1">{v.desc}</span>
                     <span className="text-xs font-black text-[#25F4EE] bg-slate-900/50 backdrop-blur-sm px-2 py-1 rounded-md inline-block">{formatNumber(v.views)} vues</span>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400">
           <p className="text-[9px] font-bold italic">Généré par ViralScope</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-black uppercase">Verified Data</span>
           </div>
        </div>
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
          .print\\:py-0 {
             padding-top: 0 !important;
             padding-bottom: 0 !important;
          }
          .print\\:shadow-none {
             box-shadow: none !important;
          }
          .print\\:bg-white {
             background-color: white !important;
          }
          .print-content {
             transform: scale(1) !important;
             width: 100% !important;
             max-width: 800px !important;
             margin: 0 auto !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
