// src/components/ExerciseAnalysisModal.tsx
import React from 'react';
import { X, BarChart3, History, Calendar } from 'lucide-react';

export const ExerciseAnalysisModal = ({ isOpen, onClose, exerciseName, history }: any) => {
  if (!isOpen || !exerciseName) return null;

  const dataPoints = history.map((h: any) => {
      if (!h.snapshot || !h.snapshot.exercises) return null;
      const ex = h.snapshot.exercises.find((e: any) => e.name === exerciseName);
      if (!ex) return null;
      
      const bestWeight = ex.logs.reduce((max: number, log: any) => {
          const w = parseFloat(log.weight) || 0;
          return w > max && log.completed ? w : max;
      }, 0);

      if (bestWeight === 0) return null;

      return {
          date: new Date(h.date),
          dateLabel: new Date(h.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
          weight: bestWeight
      };
  }).filter(Boolean).reverse(); 

  const hasData = dataPoints.length > 0;
  const maxWeight = hasData ? Math.max(...dataPoints.map((d: any) => d.weight)) : 0;
  const minWeight = hasData ? Math.min(...dataPoints.map((d: any) => d.weight)) : 0;
  
  const chartHeight = 150;
  const chartWidth = 300; 
  const padding = 20;

  const getY = (weight: number) => {
      if (maxWeight === minWeight) return chartHeight / 2;
      return chartHeight - padding - ((weight - minWeight) / (maxWeight - minWeight)) * (chartHeight - (padding * 2));
  };

  const getPoints = () => {
      if (dataPoints.length === 1) return `0,${getY(dataPoints[0].weight)} ${chartWidth},${getY(dataPoints[0].weight)}`;
      return dataPoints.map((d: any, i: number) => {
          const x = (i / (dataPoints.length - 1)) * chartWidth;
          const y = getY(d.weight);
          return `${x},${y}`;
      }).join(" ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center shrink-0">
            <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Fortschritts-Analyse</p>
                <h2 className="text-xl font-black leading-none">{exerciseName}</h2>
            </div>
            <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-5 overflow-y-auto">
            {!hasData ? (
                <div className="text-center text-gray-400 py-10">
                    <BarChart3 className="mx-auto mb-2 opacity-50" size={48}/>
                    <p>Noch keine Daten für diese Übung.</p>
                </div>
            ) : (
                <>
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 shadow-inner relative">
                        <div className="flex justify-between text-xs text-gray-400 font-bold mb-2">
                            <span>{minWeight} kg</span>
                            <span>MAX: {maxWeight} kg</span>
                        </div>
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32 overflow-visible">
                            <line x1="0" y1={padding} x2={chartWidth} y2={padding} stroke="#e5e7eb" strokeDasharray="4"/>
                            <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="#e5e7eb" strokeDasharray="4"/>
                            <line x1="0" y1={chartHeight-padding} x2={chartWidth} y2={chartHeight-padding} stroke="#e5e7eb" strokeDasharray="4"/>
                            <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={getPoints()} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"/>
                            {dataPoints.map((d: any, i: number) => (
                                <circle key={i} cx={(i / (dataPoints.length - 1 || 1)) * chartWidth} cy={getY(d.weight)} r="4" className="fill-white stroke-blue-600 stroke-2"/>
                            ))}
                        </svg>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider">
                            <span>{dataPoints[0].dateLabel}</span>
                            <span>{dataPoints[dataPoints.length - 1].dateLabel}</span>
                        </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm"><History size={16} className="text-blue-600"/> Historie (Best Sets)</h3>
                    <div className="space-y-2">
                        {[...dataPoints].reverse().map((d: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Calendar size={14}/></div>
                                    <span className="text-sm font-bold text-gray-700">{d.dateLabel}</span>
                                </div>
                                <span className="text-lg font-black text-gray-900">{d.weight} <span className="text-xs font-normal text-gray-400">kg</span></span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};