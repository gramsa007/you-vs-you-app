// src/components/CustomLogModal.tsx
import React, { useState } from 'react';
import { PenTool } from 'lucide-react';

export const CustomLogModal = ({ isOpen, onClose, onSave }: any) => {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title) return alert("Bitte gib einen Titel ein.");
    onSave(title, duration, note);
    setTitle("");
    setDuration("");
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <PenTool size={20} className="text-blue-600"/> Freies Training
        </h2>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500 uppercase">Aktivität</label><input type="text" placeholder="z.B. Laufen, Radfahren, Yoga" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 font-bold text-gray-900 focus:border-blue-500 outline-none"/></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Dauer (Minuten)</label><input type="text" placeholder="z.B. 40" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 font-bold text-gray-900 focus:border-blue-500 outline-none"/></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Details / Distanz</label><textarea placeholder="z.B. 8 km, lockeres Tempo" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-700 focus:border-blue-500 outline-none h-24 resize-none"/></div>
          <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">Speichern</button>
          <button onClick={onClose} className="w-full text-gray-400 font-bold py-2 text-sm hover:text-gray-600">Abbrechen</button>
        </div>
      </div>
    </div>
  );
};