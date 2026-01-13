// src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, ArrowLeft, Save, Flame, Download, Upload, UserCircle, Trash2, History,
  CheckCircle2, CheckSquare, CalendarDays, Cloud, Database, Clock, ChevronRight,
  FileText, Zap, Wind, Sparkles, ClipboardCheck, Package, Volume2, Trophy, AlertTriangle,
  Eye, X, BarChart3, FileSpreadsheet, PlusCircle, PenTool, Youtube, TrendingUp, Calendar, Copy,
  Edit, Plus, Palette, Bookmark, LayoutTemplate
} from 'lucide-react';

// Imports utils
import { playBeep } from './utils/audio';
import { prepareData, formatTime, formatDate } from './utils/helpers';
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_WARMUP_PROMPT,
  DEFAULT_PLAN_PROMPT,
  DEFAULT_EQUIPMENT,
  rawWorkouts
} from './utils/constants';

// --- NEUER STANDARD TEXT FÜR COOL DOWN ---
const DEFAULT_COOLDOWN_PLAN = `❄️ MEIN COOL DOWN

1. HÜFTE & RÜCKEN
• Deep Squat Hold (30sek)
• Child's Pose (30sek)

2. BEINE
• Couch Stretch (je Seite 45sek)
• Forward Fold (30sek)

3. ENTSPANNUNG
• 1 Min tiefes Atmen (Box Breathing)`;


// --- COMPONENTS ---

const WorkoutTimer = ({ transparent = false, initialTime = 0, onTick }: { transparent?: boolean, initialTime?: number, onTick?: (s: number) => void }) => {
  const [displayTime, setDisplayTime] = useState(initialTime);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now() - (initialTime * 1000);
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const secondsPassed = Math.floor((now - startTimeRef.current) / 1000);
        setDisplayTime(secondsPassed);
        if (onTick) onTick(secondsPassed);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${transparent ? 'bg-white/10 text-white' : 'bg-white text-gray-800 border border-gray-200'} px-3 py-1.5 rounded-full shadow-sm`}>
      <Clock size={14} className="animate-pulse text-orange-500" />
      <span className="font-mono font-bold text-sm tracking-widest">{formatTime(displayTime)}</span>
    </div>
  );
};

const WarmupScreen = ({ prompt, onComplete, onBack }: any) => {
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
       const now = Date.now();
       setSeconds(Math.floor((now - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 text-white flex flex-col">
      <div className="p-4 flex justify-between items-center bg-white/10 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><ArrowLeft size={20} /></button>
        <div className="font-mono font-bold text-xl flex items-center gap-2"><Flame className="animate-pulse" /> {formatTime(seconds)}</div>
        <div className="w-10"></div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">Warm Up</h1>
        <p className="text-white/80 text-sm mb-6 font-medium">Mach dich bereit für Höchstleistung.</p>
        <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20 shadow-xl">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{prompt}</pre>
        </div>
      </div>
      <div className="p-4 bg-white/10 backdrop-blur-md sticky bottom-0">
        <button onClick={() => onComplete(seconds)} className="w-full bg-white text-orange-600 font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-lg"><Dumbbell size={24} /> Training Starten</button>
      </div>
    </div>
  );
};

const CooldownScreen = ({ prompt, onComplete, initialTime, onTick }: any) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex flex-col">
      <div className="p-4 flex justify-between items-center bg-white/10 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 opacity-80"><Wind size={20} /> <span className="font-bold tracking-widest uppercase text-xs">Recovery</span></div>
        <WorkoutTimer transparent={true} initialTime={initialTime} onTick={onTick} />
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <h1 className="text-4xl font-black mb-6 tracking-tighter">Cool Down</h1>
        <div className="bg-white/10 rounded-3xl p-6 backdrop-blur-sm border border-white/20 shadow-2xl">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{prompt}</pre>
        </div>
      </div>
      <div className="p-6 bg-white/10 backdrop-blur-md">
        <button onClick={onComplete} className="w-full bg-white text-teal-600 font-black py-4 rounded-2xl shadow-xl hover:bg-teal-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"><CheckCircle2 size={24} /> Workout Speichern</button>
      </div>
    </div>
  );
};

const PromptModal = ({ onClose, title, icon: Icon, colorClass, currentPrompt, onSave, appendEquipment, equipment, appendHistory, history, description }: any) => {
  const [text, setText] = useState(currentPrompt);

  useEffect(() => {
    let generatedText = currentPrompt;
    if (appendEquipment && equipment) {
      let eqText = "";
      if (Array.isArray(equipment) && equipment.length > 0) {
        if (typeof equipment[0] === 'string') {
          eqText = equipment.join(', ');
        } else if (typeof equipment[0] === 'object') {
          eqText = equipment.map((cat: any) => `${cat.category}: ${cat.items.join(', ')}`).join('\n');
        }
      }
      generatedText += `\n\nVerfügbares Equipment:\n` + eqText;
    }
    if (appendHistory && history) {
      const recentHistory = history.slice(0, 10).map((h: any) =>
        `${new Date(h.date).toLocaleDateString()}: ${h.workoutTitle} (${h.type})`
      ).join('\n');
      generatedText += `\n\nTrainingshistorie (letzte Einheiten):\n` + recentHistory;
    }
    setText(generatedText);
  }, [currentPrompt, appendEquipment, equipment, appendHistory, history]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert("In Zwischenablage kopiert!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        <div className={`${colorClass} p-4 text-white flex justify-between items-center rounded-t-3xl shrink-0`}>
          <div className="flex items-center gap-2"><Icon size={20} /><h2 className="font-bold text-lg">{title}</h2></div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" title="Kopieren"><Copy size={18} /></button>
            <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><X size={18} /></button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-xs text-gray-500 mb-2 font-medium">
            {description || (appendHistory ? "Dieser Text enthält deine Daten & Equipment. Kopiere ihn in ChatGPT:" : "Bearbeite hier den Text:")}
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-64 p-3 border border-gray-200 rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:border-blue-500 outline-none resize-none shadow-inner" spellCheck={false} />
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0">
          {!appendHistory ? (
            <button onClick={() => { onSave(text); onClose(); }} className={`${colorClass} w-full py-3 rounded-xl text-white font-bold shadow-md active:scale-95 transition-transform`}>Speichern</button>
          ) : (
            <button onClick={onClose} className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-bold active:scale-95 transition-transform">Schließen</button>
          )}
        </div>
      </div>
    </div>
  );
};

const EquipmentModal = ({ onClose, equipment, onSave }: any) => {
  const [localEquipment, setLocalEquipment] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newItems, setNewItems] = useState<Record<number, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (equipment) {
      if (Array.isArray(equipment) && equipment.length > 0 && typeof equipment[0] === 'string') {
        setLocalEquipment([{ category: "Allgemein", items: [...equipment] }]);
      } else {
        setLocalEquipment(JSON.parse(JSON.stringify(equipment)));
      }
    } else {
      setLocalEquipment([]);
    }
  }, [equipment]);

  const handleDeleteItem = (catIndex: number, itemIndex: number) => {
    const updated = localEquipment.map((cat, cIdx) => {
      if (cIdx !== catIndex) return cat;
      return { ...cat, items: cat.items.filter((_: any, iIdx: number) => iIdx !== itemIndex) };
    });
    setLocalEquipment(updated);
  };

  const handleAddItem = (catIndex: number) => {
    const text = newItems[catIndex];
    if (!text || text.trim() === "") return;
    const updated = localEquipment.map((cat, cIdx) => {
      if (cIdx !== catIndex) return cat;
      if (cat.items.includes(text.trim())) return cat;
      return { ...cat, items: [...cat.items, text.trim()] };
    });
    setLocalEquipment(updated);
    setNewItems({ ...newItems, [catIndex]: "" });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setLocalEquipment([...localEquipment, { category: newCategoryName.trim(), items: [] }]);
    setNewCategoryName("");
  }

  const handleDeleteCategory = (catIndex: number) => {
    if (window.confirm("Kategorie löschen?")) {
      setLocalEquipment(localEquipment.filter((_, idx) => idx !== catIndex));
    }
  }

  const handleSave = () => {
    onSave(localEquipment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 relative overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 flex justify-between items-center text-white shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2"><Package size={20} /> Mein Equipment</h3>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white" title="Bearbeiten"><Edit size={20} /></button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-4">
          {localEquipment.map((section, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> {section.category}</h4>
                {isEditing && (
                  <button onClick={() => handleDeleteCategory(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {section.items.map((item: string, i: number) => (
                  <span key={`${item}-${i}`} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${isEditing ? 'bg-red-50 text-red-700 pr-1' : 'bg-blue-50 text-blue-700'}`}>
                    {item}
                    {isEditing && (<button onClick={() => handleDeleteItem(idx, i)} className="p-0.5 hover:bg-red-200 rounded-full ml-1"><X size={12} /></button>)}
                  </span>
                ))}
                {section.items.length === 0 && !isEditing && <span className="text-xs text-gray-400 italic">Keine Items</span>}
              </div>
              {isEditing && (
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
                  <input type="text" placeholder="Neues Item..." className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400" value={newItems[idx] || ""} onChange={(e) => setNewItems({ ...newItems, [idx]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleAddItem(idx)} />
                  <button onClick={() => handleAddItem(idx)} className="bg-blue-600 text-white p-1 rounded-lg hover:bg-blue-700"><Plus size={18} /></button>
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 flex gap-2 items-center">
              <input type="text" placeholder="Neue Kategorie..." className="flex-1 text-sm bg-transparent outline-none font-bold text-gray-600" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
              <button onClick={handleAddCategory} className="text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">+ KATEGORIE</button>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setLocalEquipment(JSON.parse(JSON.stringify(equipment || []))); }} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Abbrechen</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"><Save size={18} /> Speichern</button>
            </>
          ) : (
            <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">Schließen</button>
          )}
        </div>
      </div>
    </div>
  );
};

const PastePlanModal = ({ onClose, onImport }: any) => {
  const [text, setText] = useState("");
  const handleImport = () => { try { const json = JSON.parse(text); onImport(json); onClose(); setText(""); } catch (e) { alert("Ungültiges JSON Format!"); } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><ClipboardCheck /> Plan importieren</h2><button onClick={onClose}><X /></button></div>
        <div className="p-4"><p className="text-xs text-gray-500 mb-2">Füge hier den JSON-Code von ChatGPT ein:</p><textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-40 p-3 border border-gray-200 rounded-xl text-xs font-mono bg-gray-50 outline-none resize-none" placeholder='[ { "id": 1, "title": "Push A", ... } ]'></textarea><button onClick={handleImport} className="w-full mt-4 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md">Plan laden</button></div>
      </div>
    </div>
  );
};

// --- UPDATE: WORKOUT BUILDER MIT VORLAGEN ---
const WorkoutBuilderModal = ({ onClose, onSave, templates, onSaveTemplate, onDeleteTemplate, initialData }: any) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [week, setWeek] = useState(initialData?.week || 1);
  const [focus, setFocus] = useState(initialData?.focus || "");
  const [exercises, setExercises] = useState<any[]>(initialData?.exercises || [
    { name: "", sets: 3, reps: "10" } 
  ]);

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: "10" }]);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const newEx = [...exercises];
    newEx[index][field] = value;
    setExercises(newEx);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleLoadTemplate = (e: any) => {
     const templateId = e.target.value;
     if(!templateId) return;
     const t = templates.find((t:any) => t.id === Number(templateId));
     if(t) {
         setTitle(t.title);
         setFocus(t.focus);
         setExercises(JSON.parse(JSON.stringify(t.exercises)));
     }
  }

  const handleSaveCurrentAsTemplate = () => {
      if(!title) return alert("Bitte gib dem Workout einen Namen, um es als Vorlage zu speichern.");
      onSaveTemplate({ title, focus, exercises });
  }

  const handleSave = () => {
    if (!title) return alert("Bitte Titel eingeben");
    
    // Konvertierung in das App-Datenformat
    const newWorkout = {
      id: Date.now(),
      title: title,
      focus: focus || "Custom Plan",
      duration: "Flexibel",
      week: Number(week),
      color: "border-l-indigo-500",
      type: "Hypertrophy",
      exercises: exercises.map(ex => ({
        name: ex.name || "Übung",
        sets: Number(ex.sets),
        reps: ex.reps,
        rpe: 8,
        note: "",
        logs: Array.from({ length: Number(ex.sets) }).map(() => ({ weight: '', reps: '', completed: false }))
      }))
    };
    
    onSave(newWorkout);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex justify-between items-center rounded-t-3xl shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2"><Edit size={20}/> Plan erstellen</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* TEMPLATE SECTION */}
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1"><LayoutTemplate size={10}/> Vorlage laden</label>
              <div className="flex gap-2">
                <select onChange={handleLoadTemplate} className="flex-1 text-sm border border-indigo-200 rounded-lg p-2 outline-none bg-white text-indigo-900">
                    <option value="">-- Wähle eine Vorlage --</option>
                    {templates.map((t:any) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
                <button onClick={handleSaveCurrentAsTemplate} className="bg-white border border-indigo-200 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100" title="Aktuelles als Vorlage speichern"><Save size={18}/></button>
              </div>
              {templates.length > 0 && <p className="text-[10px] text-indigo-400">Tipp: Wähle eine Vorlage, um Felder automatisch zu füllen.</p>}
          </div>

          <hr className="border-gray-100"/>

          {/* Basis Daten */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Workout Name</label>
              <input type="text" placeholder="z.B. Brust & Trizeps" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2 font-bold text-gray-900 outline-none focus:border-indigo-500"/>
            </div>
             <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Fokus / Muskelgruppe</label>
              <input type="text" placeholder="z.B. Oberkörper" value={focus} onChange={e => setFocus(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2 font-bold text-gray-900 outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Woche</label>
              <select value={week} onChange={e => setWeek(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl p-2 font-bold bg-white outline-none">
                {[1,2,3,4].map(w => <option key={w} value={w}>Woche {w}</option>)}
              </select>
            </div>
          </div>

          <hr className="border-gray-100"/>

          {/* Übungsliste */}
          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-200 relative">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Übung {i+1}</span>
                  {exercises.length > 1 && <button onClick={() => removeExercise(i)} className="text-red-400"><X size={14}/></button>}
                </div>
                <input type="text" placeholder="Name (z.B. Liegestütze)" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} className="w-full mb-2 bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none"/>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-400 uppercase">Sätze</span>
                    <input type="number" inputMode="decimal" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none"/>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-400 uppercase">Wdh.</span>
                    <input type="text" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={addExercise} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
            <PlusCircle size={18}/> Weitere Übung
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform">
            Plan Speichern
          </button>
        </div>
      </div>
    </div>
  );
};


const ExitDialog = ({ isOpen, onSave, onDiscard, onCancel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6 animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center mb-6"><div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-3"><AlertTriangle size={24} /></div><h3 className="text-lg font-black text-gray-900">Training verlassen?</h3><p className="text-sm text-gray-500 mt-1">Dein Fortschritt wird lokal gespeichert.</p></div>
        <div className="space-y-2"><button onClick={onSave} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Speichern & Beenden</button><button onClick={onDiscard} className="w-full bg-white border border-gray-200 text-red-500 font-bold py-3 rounded-xl hover:bg-red-50">Verwerfen</button><button onClick={onCancel} className="w-full text-gray-400 font-bold py-2 text-sm">Abbrechen</button></div>
      </div>
    </div>
  );
};

const CustomLogModal = ({ onClose, onSave }: any) => {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");

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
        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><PenTool size={20} className="text-blue-600" /> Freies Training</h2>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500 uppercase">Aktivität</label><input type="text" placeholder="z.B. Laufen, Radfahren, Yoga" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 font-bold text-gray-900 focus:border-blue-500 outline-none" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Dauer (Minuten)</label><input type="number" inputMode="decimal" placeholder="z.B. 40" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 font-bold text-gray-900 focus:border-blue-500 outline-none" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Details / Distanz</label><textarea placeholder="z.B. 8 km, lockeres Tempo" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-700 focus:border-blue-500 outline-none h-24 resize-none" /></div>
          <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">Speichern</button>
          <button onClick={onClose} className="w-full text-gray-400 font-bold py-2 text-sm hover:text-gray-600">Abbrechen</button>
        </div>
      </div>
    </div>
  );
};

const ExerciseAnalysisModal = ({ onClose, exerciseName, history }: any) => {
  const dataPoints = history.map((h: any) => {
    if (!h.snapshot || !h.snapshot.exercises) return null;
    const ex = h.snapshot.exercises.find((e: any) => e.name === exerciseName);
    if (!ex) return null;
    const bestWeight = ex.logs.reduce((max: number, log: any) => {
      const w = parseFloat(log.weight) || 0;
      return w > max && log.completed ? w : max;
    }, 0);
    if (bestWeight === 0) return null;
    return { date: new Date(h.date), dateLabel: new Date(h.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }), weight: bestWeight };
  }).filter(Boolean).reverse();

  const hasData = dataPoints.length > 0;
  const maxWeight = hasData ? Math.max(...dataPoints.map((d: any) => d.weight)) : 0;
  const minWeight = hasData ? Math.min(...dataPoints.map((d: any) => d.weight)) : 0;
  const chartHeight = 150; const chartWidth = 300; const padding = 20;
  
  const getY = (weight: number) => { 
    if (maxWeight === minWeight) return chartHeight / 2; 
    return chartHeight - padding - ((weight - minWeight) / (maxWeight - minWeight)) * (chartHeight - (padding * 2)); 
  };
  
  const getPoints = () => { 
    if (dataPoints.length === 1) return `0,${getY(dataPoints[0].weight)} ${chartWidth},${getY(dataPoints[0].weight)}`; 
    // Fix: Division durch 0 vermeiden, wenn length 1 ist (auch wenn oben abgefangen, sicherer)
    const divisor = dataPoints.length > 1 ? dataPoints.length - 1 : 1;
    return dataPoints.map((d: any, i: number) => { 
      const x = (i / divisor) * chartWidth; 
      const y = getY(d.weight); 
      return `${x},${y}`; 
    }).join(" "); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center shrink-0"><div><p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Fortschritts-Analyse</p><h2 className="text-xl font-black leading-none">{exerciseName}</h2></div><button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button></div>
        <div className="p-5 overflow-y-auto">{!hasData ? (<div className="text-center text-gray-400 py-10"><BarChart3 className="mx-auto mb-2 opacity-50" size={48} /><p>Noch keine Daten für diese Übung.</p></div>) : (<><div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 shadow-inner relative"><div className="flex justify-between text-xs text-gray-400 font-bold mb-2"><span>{minWeight} kg</span><span>MAX: {maxWeight} kg</span></div><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32 overflow-visible"><line x1="0" y1={padding} x2={chartWidth} y2={padding} stroke="#e5e7eb" strokeDasharray="4" /><line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#e5e7eb" strokeDasharray="4" /><line x1="0" y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="#e5e7eb" strokeDasharray="4" /><polyline fill="none" stroke="#2563eb" strokeWidth="3" points={getPoints()} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />{dataPoints.map((d: any, i: number) => {
            const divisor = dataPoints.length > 1 ? dataPoints.length - 1 : 1;
            return (
                <circle key={i} cx={(i / divisor) * chartWidth} cy={getY(d.weight)} r="4" className="fill-white stroke-blue-600 stroke-2" />
            )
        })}</svg><div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider"><span>{dataPoints[0].dateLabel}</span><span>{dataPoints[dataPoints.length - 1].dateLabel}</span></div></div><h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm"><History size={16} className="text-blue-600" /> Historie (Best Sets)</h3><div className="space-y-2">{[...dataPoints].reverse().map((d: any, i: number) => (<div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm"><div className="flex items-center gap-3"><div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Calendar size={14} /></div><span className="text-sm font-bold text-gray-700">{d.dateLabel}</span></div><span className="text-lg font-black text-gray-900">{d.weight} <span className="text-xs font-normal text-gray-400">kg</span></span></div>))}</div></>)}</div>
      </div>
    </div>
  );
};

// --- HELPER FUNCTIONS ---
const getStaticWarmup = (focus: string) => {
  const focusLower = focus?.toLowerCase() || "";
  if (focusLower.includes("leg") || focusLower.includes("bein") || focusLower.includes("unterkörper")) return `🔥 BEIN-FOKUS WARM-UP (RAMP)\n\n1. PULS (2 Min)\n• 1 Min Joggen\n• 1 Min Jumping Jacks\n\n2. MOBILISIERUNG\n• Leg Swings\n• Tiefe Hocke\n\n3. AKTIVIERUNG\n• Glute Bridges\n• Lunges`;
  if (focusLower.includes("push") || focusLower.includes("pull") || focusLower.includes("upper") || focusLower.includes("oberkörper")) return `🔥 OBERKÖRPER WARM-UP (RAMP)\n\n1. PULS (2 Min)\n• Seilspringen\n• Armkreisen\n\n2. MOBILISIERUNG\n• Wall Slides\n• Cat-Cow\n• Thoracic Rotation\n\n3. AKTIVIERUNG\n• Band Pull-Aparts\n• Scapular Push Ups`;
  return `🔥 GENERAL WARM-UP (RAMP)\n\n1. RAISE (2 Min)\n• High Knees\n• Hampelmann\n\n2. MOBILIZE\n• World's Greatest Stretch\n• Walkouts\n\n3. ACTIVATE\n• Air Squats\n• Plank`;
};

// --- MAIN APP ---

function App() {
  const [activeTab, setActiveTab] = useState('training');
  const [activeWeek, setActiveWeek] = useState(1);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<any>(null);

  const [currentWarmupRoutine, setCurrentWarmupRoutine] = useState("");
  const [currentCooldownRoutine, setCurrentCooldownRoutine] = useState("");

  const [showCustomLogModal, setShowCustomLogModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showPastePlanModal, setShowPastePlanModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [builderInitialData, setBuilderInitialData] = useState<any>(null); // Für "Kopieren" Funktion
  
  const [showExitDialog, setShowExitDialog] = useState(false);

  const [activePromptModal, setActivePromptModal] = useState<string | null>(null);
  const [analysisExercise, setAnalysisExercise] = useState<string | null>(null);

  // NEUER STATE FÜR DIE GESAMTZEIT
  const [totalSeconds, setTotalSeconds] = useState(0);

  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('coachAndyData');
    if (savedData) return JSON.parse(savedData);
    return prepareData(rawWorkouts);
  });

  const [templates, setTemplates] = useState<any[]>(() => {
      const savedTemplates = localStorage.getItem('coachAndyTemplates');
      if (savedTemplates) return JSON.parse(savedTemplates);
      return [];
  });

  const handleSaveTemplate = (templateData: any) => {
      const newTemplate = { id: Date.now(), ...templateData };
      const newTemplates = [...templates, newTemplate];
      setTemplates(newTemplates);
      localStorage.setItem('coachAndyTemplates', JSON.stringify(newTemplates));
      alert("Vorlage gespeichert!");
  }

  const handleDeleteTemplate = (id: number) => {
      const newTemplates = templates.filter(t => t.id !== id);
      setTemplates(newTemplates);
      localStorage.setItem('coachAndyTemplates', JSON.stringify(newTemplates));
  }

  const visibleWorkouts = data.filter((workout: any) => workout.week === activeWeek);

  const [history, setHistory] = useState<any[]>(() => {
    const savedHistory = localStorage.getItem('coachAndyHistory');
    if (savedHistory) return JSON.parse(savedHistory);
    return [];
  });

  const isWorkoutCompleted = (workoutId: number) => {
    return history.some((entry: any) => entry.workoutId === workoutId);
  };

  const getLastLogForExercise = (exerciseName: string) => {
    const relevantEntries = history.filter(h =>
      h.snapshot && h.snapshot.exercises && h.snapshot.exercises.some((ex: any) => ex.name === exerciseName)
    );
    if (relevantEntries.length === 0) return null;
    const lastEntry = relevantEntries[0];
    const exerciseData = lastEntry.snapshot.exercises.find((ex: any) => ex.name === exerciseName);
    return exerciseData ? exerciseData.logs : null;
  };

  const getStreakStats = () => {
    if (history.length === 0) return { currentStreak: 0, bestStreak: 0 };
    const uniqueDays = Array.from(new Set(history.map(h => new Date(h.date).toDateString()))).map(d => new Date(d).getTime()).sort((a, b) => b - a);
    let current = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 86400000;
    if (uniqueDays.length > 0) {
      if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
        current = 1;
        for (let i = 0; i < uniqueDays.length - 1; i++) {
          if (uniqueDays[i] - uniqueDays[i + 1] <= 86400000 + 10000) {
            current++;
          } else {
            break;
          }
        }
      }
    }
    return { currentStreak: current };
  };

  const getStats = () => {
    const total = history.length;
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const thisWeek = history.filter((h: any) => new Date(h.date) >= monday).length;
    return { total, thisWeek };
  };

  const [systemPrompt, setSystemPrompt] = useState(() => {
    const saved = localStorage.getItem('coachAndyPrompt');
    return saved || DEFAULT_SYSTEM_PROMPT;
  });

  const [warmupPrompt, setWarmupPrompt] = useState(() => {
    const saved = localStorage.getItem('coachAndyWarmupPrompt');
    return saved || DEFAULT_WARMUP_PROMPT;
  });

  const [cooldownPrompt, setCooldownPrompt] = useState(() => {
    const saved = localStorage.getItem('coachAndyCooldownPrompt');
    // HIER WIRD JETZT DER STANDARD-PLAN GELADEN STATT PROMPT
    return saved || DEFAULT_COOLDOWN_PLAN;
  });

  const [planPrompt, setPlanPrompt] = useState(() => {
    const saved = localStorage.getItem('coachAndyPlanPrompt');
    return saved || DEFAULT_PLAN_PROMPT;
  });

  const [equipment, setEquipment] = useState(() => {
    const savedEq = localStorage.getItem('coachAndyEquipment');
    return savedEq ? JSON.parse(savedEq) : DEFAULT_EQUIPMENT;
  });

  const handleSaveSystemPrompt = (newText: string) => { setSystemPrompt(newText); localStorage.setItem('coachAndyPrompt', newText); };
  const handleSaveWarmupPrompt = (newText: string) => { setWarmupPrompt(newText); localStorage.setItem('coachAndyWarmupPrompt', newText); };
  const handleSaveCooldownPrompt = (newText: string) => { setCooldownPrompt(newText); localStorage.setItem('coachAndyCooldownPrompt', newText); };
  const handleSavePlanPrompt = (newText: string) => { setPlanPrompt(newText); localStorage.setItem('coachAndyPlanPrompt', newText); };
  const handleSaveEquipment = (newEquipment: any[]) => { setEquipment(newEquipment); localStorage.setItem('coachAndyEquipment', JSON.stringify(newEquipment)); };

  const handleSaveCustomLog = (title: string, duration: string, note: string) => {
    const newEntry = {
      id: Date.now(),
      workoutId: -1,
      workoutTitle: title,
      date: new Date().toISOString(),
      week: activeWeek,
      type: "Custom",
      totalDuration: duration ? duration + " Min" : "",
      snapshot: {
        title: title,
        focus: "Freies Training",
        exercises: [
          {
            name: "Details / Notizen",
            logs: [{ weight: note, reps: duration + " Min", completed: true }]
          }
        ]
      }
    };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));
  };

  // --- HANDLER FÜR MANUELLE WORKOUTS ---
  const handleSaveManualWorkout = (newWorkout: any) => {
      const newData = [...data, newWorkout];
      setData(newData);
      localStorage.setItem('coachAndyData', JSON.stringify(newData));
      alert(`Workout "${newWorkout.title}" erfolgreich für Woche ${newWorkout.week} erstellt!`);
      // Optional: Direkt zur entsprechenden Woche wechseln
      if(activeWeek !== newWorkout.week) setActiveWeek(newWorkout.week);
  };

  const handleEditWorkout = (workout: any) => {
      setBuilderInitialData(workout);
      setShowBuilderModal(true);
  }

  const [activeWorkoutData, setActiveWorkoutData] = useState<any>(null);

  const [isWarmupActive, setIsWarmupActive] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);

  const [restSeconds, setRestSeconds] = useState(0);
  const [isRestActive, setIsRestActive] = useState(false);
  const [activeRestContext, setActiveRestContext] = useState({ exerciseIndex: -1, setIndex: -1 });
  const restStartTimeRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedActiveState = localStorage.getItem('coachAndyActiveState');
    if (savedActiveState && !activeWorkoutData) {
      try {
        const parsedState = JSON.parse(savedActiveState);
        if (confirm("Ein abgebrochenes Workout wurde gefunden. Möchtest du es fortsetzen?")) {
          setActiveWorkoutData(parsedState);
          setSelectedWorkoutId(parsedState.id);

          const specificWarmup = getStaticWarmup(parsedState.focus);
          setCurrentWarmupRoutine(specificWarmup);
          
          // Hier laden wir jetzt immer den gespeicherten Cooldown-Plan, keine Logik mehr
          setCurrentCooldownRoutine(cooldownPrompt);

          setIsWarmupActive(false);
        } else {
          localStorage.removeItem('coachAndyActiveState');
        }
      } catch (e) {
        console.error("Fehler beim Laden des Active States", e);
      }
    }
  }, [cooldownPrompt]); // Dependency hinzugefügt

  useEffect(() => {
    if (activeWorkoutData) {
      localStorage.setItem('coachAndyActiveState', JSON.stringify(activeWorkoutData));
    } else {
      localStorage.removeItem('coachAndyActiveState');
    }
  }, [activeWorkoutData]);

  useEffect(() => {
    let interval: any = null;
    if (isRestActive) {
      // Wenn der Timer gerade erst aktiviert wurde, setzen wir den Startzeitpunkt
      if (restStartTimeRef.current === null) {
          restStartTimeRef.current = Date.now();
      }
      
      interval = setInterval(() => {
        const now = Date.now();
        const secondsPassed = Math.floor((now - (restStartTimeRef.current || now)) / 1000);
        setRestSeconds(secondsPassed);
        
        // Sound abspielen (Beep alle 30s)
        if (secondsPassed > 0 && secondsPassed % 30 === 0) {
          playBeep(600, 'sine', 0.1, 0.05);
        }
      }, 1000);
    } else {
        restStartTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isRestActive]);

  const handleCSVExport = () => {
    if (history.length === 0) {
      alert("Keine Daten zum Exportieren.");
      return;
    }
    // Verbesserter CSV Export mit Quotes für Textfelder
    let csvContent = "Datum,Dauer,Woche,Workout Name,Typ,Uebung,Satz,Gewicht (kg),Wiederholungen\n";
    history.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      const duration = entry.totalDuration || "";
      const workoutName = `"${(entry.workoutTitle || "").replace(/"/g, '""')}"`;
      if (entry.snapshot && entry.snapshot.exercises) {
        entry.snapshot.exercises.forEach((ex: any) => {
          const exName = `"${(ex.name || "").replace(/"/g, '""')}"`;
          ex.logs.forEach((log: any, index: number) => {
            if (log.weight && log.reps) {
              // Quote strings to avoid comma issues
              const weight = `"${String(log.weight).replace(/"/g, '""')}"`;
              const reps = `"${String(log.reps).replace(/"/g, '""')}"`;
              csvContent += `${date},${duration},${entry.week},${workoutName},${entry.type},${exName},${index + 1},${weight},${reps}\n`;
            }
          });
        });
      }
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coach-andy-full-backup-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateVolume = (snapshot: any) => {
    if (!snapshot || !snapshot.exercises) return 0;
    let vol = 0;
    snapshot.exercises.forEach((ex: any) => {
      ex.logs.forEach((log: any) => {
        const w = parseFloat(log.weight) || 0;
        const r = parseFloat(log.reps) || 0;
        if (log.completed) vol += w * r;
      });
    });
    return vol;
  };

  const getLastWorkoutsVolume = () => {
    const last5 = history.slice(0, 5).reverse();
    if (last5.length === 0) return [];
    const volumes = last5.map(h => ({
      date: new Date(h.date).toLocaleDateString(undefined, { weekday: 'short' }),
      volume: calculateVolume(h.snapshot),
      id: h.id
    }));
    const maxVol = Math.max(...volumes.map(v => v.volume));
    return volumes.map(v => ({ ...v, height: maxVol > 0 ? (v.volume / maxVol) * 100 : 0 }));
  };

  const chartData = getLastWorkoutsVolume();

  const startWorkout = (id: number) => {
    setPreviewWorkout(null);
    const originalWorkout = data.find((w: any) => w.id === id);
    if (originalWorkout) {
      setActiveWorkoutData(JSON.parse(JSON.stringify(originalWorkout)));
      setSelectedWorkoutId(id);

      const specificWarmup = getStaticWarmup(originalWorkout.focus);
      setCurrentWarmupRoutine(specificWarmup);
      
      // Hier laden wir jetzt immer den gespeicherten Cooldown-Plan, keine Logik mehr
      setCurrentCooldownRoutine(cooldownPrompt);

      setIsWarmupActive(true);
      setIsCooldownActive(false);
      setTotalSeconds(0);
      setIsRestActive(false);
      playBeep(0, 'sine', 0.001, 0); // Audio Context Init
    }
  };

  const handleInputChange = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    if (!activeWorkoutData) return;
    const newWorkoutData = { ...activeWorkoutData };
    newWorkoutData.exercises[exerciseIndex].logs[setIndex][field] = value;
    setActiveWorkoutData(newWorkoutData);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkoutData) return;
    const newWorkoutData = { ...activeWorkoutData };
    const currentStatus = newWorkoutData.exercises[exerciseIndex].logs[setIndex].completed;
    const newStatus = !currentStatus;
    newWorkoutData.exercises[exerciseIndex].logs[setIndex].completed = newStatus;
    setActiveWorkoutData(newWorkoutData);
    
    if (newStatus === true) {
      setRestSeconds(0);
      restStartTimeRef.current = Date.now(); // Startzeit für Pause setzen
      setIsRestActive(true);
      setActiveRestContext({ exerciseIndex, setIndex });
    } else {
        // Wenn man den Haken entfernt, stoppen wir den Timer nicht zwingend, 
        // aber es macht Sinn, ihn auszublenden, wenn man den Satz noch bearbeitet.
        // Hier lassen wir ihn laufen, da man vielleicht nur kurz was korrigiert.
    }
  };

  const handleFinishWorkout = () => {
    if (!activeWorkoutData) return;
    setIsRestActive(false);
    setIsCooldownActive(true);
  };

  const handleFinalizeWorkout = () => {
    if (!activeWorkoutData) return;
    saveToGlobalState(activeWorkoutData);
    const newHistoryEntry = {
      id: Date.now(),
      workoutId: activeWorkoutData.id,
      workoutTitle: activeWorkoutData.title,
      date: new Date().toISOString(),
      week: activeWorkoutData.week,
      type: activeWorkoutData.type,
      totalDuration: formatTime(totalSeconds),
      snapshot: activeWorkoutData
    };
    const newHistory = [newHistoryEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));
    localStorage.removeItem('coachAndyActiveState');
    setIsCooldownActive(false);
    setSelectedWorkoutId(null);
    setActiveWorkoutData(null);
    setActiveTab('training');
  }

  const handleBackRequest = () => setShowExitDialog(true);
  const handleExitSave = () => { if (activeWorkoutData) saveToGlobalState(activeWorkoutData); setShowExitDialog(false); setSelectedWorkoutId(null); setActiveWorkoutData(null); setIsRestActive(false); setIsWarmupActive(false); setIsCooldownActive(false); localStorage.removeItem('coachAndyActiveState'); };
  const handleExitDiscard = () => { setShowExitDialog(false); setSelectedWorkoutId(null); setActiveWorkoutData(null); setIsRestActive(false); setIsWarmupActive(false); setIsCooldownActive(false); localStorage.removeItem('coachAndyActiveState'); };
  const handleExitCancel = () => setShowExitDialog(false);

  const saveToGlobalState = (workoutData: any) => {
    const newData = data.map((w: any) => w.id === workoutData.id ? workoutData : w);
    setData(newData);
    localStorage.setItem('coachAndyData', JSON.stringify(newData));
    return newData;
  };

  const handleDeleteHistoryEntry = (e: React.MouseEvent, entryId: number) => {
    // Stoppt das Bubbling, damit der Klick nicht den Parent (die Detailansicht) triggert
    e.stopPropagation();

    if (window.confirm("Diesen Eintrag wirklich löschen? Der Status im Trainingsplan wird zurückgesetzt.")) {
      
      // 1. Eintrag im Verlauf finden
      const entryToDelete = history.find((entry: any) => entry.id === entryId);
      
      // 2. Verlauf filtern (Löschen)
      const newHistory = history.filter((entry: any) => entry.id !== entryId);
      setHistory(newHistory);
      localStorage.setItem('coachAndyHistory', JSON.stringify(newHistory));

      // 3. Trainingsplan (Data) zurücksetzen, falls es kein "Freies Training" war
      if (entryToDelete && entryToDelete.workoutId !== -1) {
         const workoutId = entryToDelete.workoutId;
         
         const newData = data.map((w: any) => {
            // Nur das betroffene Workout zurücksetzen
            if (w.id === workoutId) {
               return {
                   ...w,
                   exercises: w.exercises.map((ex: any) => ({
                       ...ex,
                       // Alle Sets leeren und auf "nicht fertig" setzen
                       logs: Array.from({ length: ex.sets }).map(() => ({ 
                           weight: '', 
                           reps: '', 
                           completed: false 
                       }))
                   }))
               };
            }
            return w;
         });
         
         setData(newData);
         localStorage.setItem('coachAndyData', JSON.stringify(newData));
      }

      // 4. Detailansicht schließen, falls genau dieser Eintrag offen war
      if (selectedHistoryEntry && selectedHistoryEntry.id === entryId) {
          setSelectedHistoryEntry(null);
      }
    }
  };

  const handleExport = () => {
    const exportObject = { data, history, systemPrompt, warmupPrompt, cooldownPrompt, planPrompt, equipment };
    const dataStr = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coach-andy-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const importedJson = JSON.parse(result);
        if (importedJson.data && importedJson.history) {
          setData(importedJson.data);
          setHistory(importedJson.history);
          if (importedJson.systemPrompt) setSystemPrompt(importedJson.systemPrompt);
          if (importedJson.warmupPrompt) setWarmupPrompt(importedJson.warmupPrompt);
          if (importedJson.cooldownPrompt) setCooldownPrompt(importedJson.cooldownPrompt);
          if (importedJson.planPrompt) setPlanPrompt(importedJson.planPrompt);
          if (importedJson.equipment) setEquipment(importedJson.equipment);
          localStorage.setItem('coachAndyData', JSON.stringify(importedJson.data));
          localStorage.setItem('coachAndyHistory', JSON.stringify(importedJson.history));
          if (importedJson.systemPrompt) localStorage.setItem('coachAndyPrompt', importedJson.systemPrompt);
          if (importedJson.warmupPrompt) localStorage.setItem('coachAndyWarmupPrompt', importedJson.warmupPrompt);
          if (importedJson.cooldownPrompt) localStorage.setItem('coachAndyCooldownPrompt', importedJson.cooldownPrompt);
          if (importedJson.planPrompt) localStorage.setItem('coachAndyPlanPrompt', importedJson.planPrompt);
          if (importedJson.equipment) localStorage.setItem('coachAndyEquipment', JSON.stringify(importedJson.equipment));
        } else if (Array.isArray(importedJson)) {
          setData(prepareData(importedJson));
          localStorage.setItem('coachAndyData', JSON.stringify(importedJson));
        }
        alert("Backup erfolgreich geladen!");
      } catch (error) {
        alert("Fehler beim Laden der Datei.");
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = (importedData: any) => {
    const prepared = prepareData(importedData);
    setData(prepared);
    localStorage.setItem('coachAndyData', JSON.stringify(prepared));
    alert("Neuer Plan erfolgreich geladen!");
  };

  const handleReset = () => {
    if (confirm("Alles zurücksetzen? Alle Daten und der Verlauf werden gelöscht.")) {
      setData(prepareData(rawWorkouts));
      setHistory([]);
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setWarmupPrompt(DEFAULT_WARMUP_PROMPT);
      setCooldownPrompt(DEFAULT_COOLDOWN_PLAN); // Reset auf neuen Standard
      setPlanPrompt(DEFAULT_PLAN_PROMPT);
      setEquipment(DEFAULT_EQUIPMENT);
      localStorage.clear();
    }
  };

  const handleClearPlan = () => {
    if (confirm("Nur den aktuellen Plan löschen? Dein Verlauf bleibt erhalten.")) {
      setData([]);
      localStorage.removeItem('coachAndyData');
      alert("Plan gelöscht. Erstelle oder importiere einen neuen.");
    }
  }

  const ExitDialogComponent = (
    <ExitDialog
      isOpen={showExitDialog}
      onSave={handleExitSave}
      onDiscard={handleExitDiscard}
      onCancel={handleExitCancel}
    />
  );

  // --- VIEWS ---
  if (selectedWorkoutId && activeWorkoutData && isWarmupActive) {
    return (
      <>
        {ExitDialogComponent}
        <WarmupScreen
          prompt={currentWarmupRoutine}
          onComplete={(elapsed: number) => { setTotalSeconds(elapsed); setIsWarmupActive(false); }}
          onBack={handleBackRequest}
        />
      </>
    )
  }

  if (selectedWorkoutId && activeWorkoutData && isCooldownActive) {
    return (
      <>
        {ExitDialogComponent}
        {/* Hier wird der Timer an den CoolDown übergeben */}
        <CooldownScreen prompt={currentCooldownRoutine} onComplete={handleFinalizeWorkout} initialTime={totalSeconds} onTick={setTotalSeconds} />
      </>
    )
  }

  if (selectedWorkoutId && activeWorkoutData) {
    return (
      <div className="min-h-screen bg-neutral-900 flex justify-center font-sans">
        <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">
          {ExitDialogComponent}

          {analysisExercise && <ExerciseAnalysisModal onClose={() => setAnalysisExercise(null)} exerciseName={analysisExercise} history={history} />}

          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-4 sticky top-0 z-10 shadow-lg">
            <div className="flex justify-between items-center">
              <button onClick={handleBackRequest} className="flex items-center gap-1 text-orange-200 hover:text-white transition-colors">
                <ArrowLeft size={18} /><span className="text-xs font-medium">Zurück</span>
              </button>
              {/* Hier wird der Timer im Haupttraining angezeigt */}
              <WorkoutTimer transparent={true} initialTime={totalSeconds} onTick={setTotalSeconds} />
            </div>
            <div className="mt-1"><h1 className="text-lg font-bold leading-tight">{activeWorkoutData.title}</h1><p className="text-orange-200 text-[10px] flex items-center gap-1"><Flame size={10} /> {activeWorkoutData.focus}</p></div>
          </div>
          <div className="p-4 space-y-3 max-w-md mx-auto">
            {activeWorkoutData.exercises.map((ex: any, exerciseIndex: number) => {
              const lastLogs = getLastLogForExercise(ex.name);
              return (
                <div key={exerciseIndex} className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100">
                  <div className="mb-2 border-b border-gray-100 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <h3 onClick={() => setAnalysisExercise(ex.name)} className="font-bold text-base text-blue-700 cursor-pointer hover:underline decoration-blue-300 leading-tight flex items-center gap-1">
                          {ex.name} <TrendingUp size={14} className="text-blue-300" />
                        </h3>
                        <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise tutorial')}`, '_blank'); }} className="text-red-500 hover:text-red-700 transition-colors bg-red-50 p-1 rounded-full"><Youtube size={16} /></button>
                      </div>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">RPE {ex.rpe}</span>
                    </div>
                    {ex.note && (<p className="text-[10px] text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded">💡 {ex.note}</p>)}
                  </div>
                  <div className="space-y-2">
                    {ex.logs.map((log: any, setIndex: number) => {
                      const isCompleted = log.completed;
                      const showRestTimerHere = isRestActive && activeRestContext.exerciseIndex === exerciseIndex && activeRestContext.setIndex === setIndex;

                      const ghostWeight = lastLogs && lastLogs[setIndex] ? lastLogs[setIndex].weight : '';
                      const ghostReps = lastLogs && lastLogs[setIndex] ? lastLogs[setIndex].reps : '';
                      const placeholderWeight = ghostWeight ? `Last: ${ghostWeight}` : 'kg';
                      const placeholderReps = ghostReps ? `Last: ${ghostReps}` : ex.reps;

                      return (
                        <div key={setIndex}>
                          <div className={`flex items-center gap-2 p-1.5 rounded-2xl transition-all border ${isCompleted ? 'bg-white border-emerald-100' : 'bg-white border-transparent'}`}>
                            <div className="w-6 flex-shrink-0 flex items-center justify-center"><span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${isCompleted ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'}`}>{setIndex + 1}</span></div>
                            <div className="flex-1"><input type="number" inputMode="decimal" placeholder={placeholderWeight} value={log.weight} onChange={(e) => handleInputChange(exerciseIndex, setIndex, 'weight', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-base outline-none transition-all placeholder:text-gray-300 placeholder:text-xs ${isCompleted ? 'bg-transparent border-transparent font-bold text-gray-800' : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white font-bold text-gray-900'}`} disabled={isCompleted} /></div>
                            <div className="flex-1"><input type="text" inputMode="decimal" placeholder={placeholderReps} value={log.reps} onChange={(e) => handleInputChange(exerciseIndex, setIndex, 'reps', e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-base outline-none transition-all placeholder:text-gray-300 placeholder:text-xs ${isCompleted ? 'bg-transparent border-transparent font-bold text-gray-800' : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white font-bold text-gray-900'}`} disabled={isCompleted} /></div>
                            <button onClick={() => toggleSetComplete(exerciseIndex, setIndex)} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ease-out ${isCompleted ? 'bg-emerald-500 shadow-md shadow-emerald-200 scale-100' : 'bg-gray-50 hover:bg-gray-100 active:scale-95'}`}><CheckCircle2 size={20} className={`transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-gray-300'}`} strokeWidth={isCompleted ? 2.5 : 2} /></button>
                          </div>
                          {showRestTimerHere && (<div className="mt-1 mb-2 mx-1 bg-blue-50 border border-blue-100 rounded-lg p-2 flex items-center justify-center gap-2 animate-in slide-in-from-top-1 fade-in shadow-sm"><span className="text-[10px] font-bold uppercase tracking-wide text-blue-700 flex items-center gap-1"><Volume2 size={10} className="animate-pulse" /> Pause</span><span className="text-base font-mono font-bold text-blue-800">{formatTime(restSeconds)}</span></div>)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            })}
            <button onClick={handleFinishWorkout} className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-950 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6 mb-6"><Save size={18} /> Training beenden</button>
          </div>
        </div>
      </div>
    );
  }

  // --- HAUPTANSICHT (Responsive Wrapper) ---
  return (
    <div className="min-h-screen bg-neutral-900 flex justify-center font-sans">

      <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">

        {/* MODALS */}
        {showCustomLogModal && <CustomLogModal onClose={() => setShowCustomLogModal(false)} onSave={handleSaveCustomLog} />}

        {analysisExercise && <ExerciseAnalysisModal onClose={() => setAnalysisExercise(null)} exerciseName={analysisExercise} history={history} />}

        {activePromptModal === 'system' && <PromptModal onClose={() => setActivePromptModal(null)} title="Coach Philosophie" icon={FileText} colorClass="bg-gradient-to-r from-blue-600 to-indigo-700" currentPrompt={systemPrompt} onSave={handleSaveSystemPrompt} />}
        {activePromptModal === 'warmup' && <PromptModal onClose={() => setActivePromptModal(null)} title="Warm-up Prompt" icon={Zap} colorClass="bg-gradient-to-r from-orange-500 to-red-600" currentPrompt={warmupPrompt} onSave={handleSaveWarmupPrompt} />}
        {activePromptModal === 'cooldown' && <PromptModal onClose={() => setActivePromptModal(null)} title="Mein Cool Down" icon={Wind} colorClass="bg-gradient-to-r from-teal-500 to-cyan-600" currentPrompt={cooldownPrompt} onSave={handleSaveCooldownPrompt} description="Definiere hier deinen Cool Down Ablauf:" />}

        {/* HIER IST DER MODAL FÜR DEN PLAN GENERATOR (wird vom Button unten aufgerufen) */}
        {activePromptModal === 'plan' && <PromptModal onClose={() => setActivePromptModal(null)} title="Plan erstellen" icon={Sparkles} colorClass="bg-gradient-to-r from-blue-600 to-indigo-600" currentPrompt={planPrompt} onSave={handleSavePlanPrompt} appendEquipment={true} equipment={equipment} appendHistory={true} history={history} />}

        {showEquipmentModal && <EquipmentModal onClose={() => setShowEquipmentModal(false)} equipment={equipment} onSave={handleSaveEquipment} />}

        {showPastePlanModal && <PastePlanModal onClose={() => setShowPastePlanModal(false)} onImport={handlePasteImport} />}
        
        {/* MODAL FÜR DEN MANUELLEN PLAN */}
        {showBuilderModal && <WorkoutBuilderModal onClose={() => setShowBuilderModal(false)} onSave={handleSaveManualWorkout} templates={templates} onSaveTemplate={handleSaveTemplate} onDeleteTemplate={handleDeleteTemplate} initialData={builderInitialData} />}

        {showExitDialog && <ExitDialog isOpen={showExitDialog} onSave={handleExitSave} onDiscard={handleExitDiscard} onCancel={handleExitCancel} />}

        {previewWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
              <div className={`p-5 rounded-t-3xl text-white bg-gradient-to-r from-gray-800 to-gray-900 flex justify-between items-start shrink-0`}>
                <div><h2 className="text-xl font-bold">{previewWorkout.title}</h2><div className="flex gap-2 mt-1"><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10} /> {previewWorkout.duration}</span><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Flame size={10} /> {previewWorkout.focus}</span></div></div>
                <button onClick={() => setPreviewWorkout(null)} className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3"><p className="text-sm text-gray-500 mb-2 font-medium">Übungsübersicht:</p>{previewWorkout.exercises.map((ex: any, idx: number) => (<div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100"><div><h4 className="font-bold text-gray-800 text-sm">{ex.name}</h4><p className="text-xs text-gray-400 mt-0.5">RPE {ex.rpe}</p></div><div className="text-right"><span className="font-mono font-bold text-blue-600 text-sm">{ex.sets} x {ex.reps}</span></div></div>))}</div>
              <div className="p-4 border-t border-gray-100 shrink-0 flex gap-3"><button onClick={() => setPreviewWorkout(null)} className="flex-1 py-3 text-gray-500 font-bold text-sm">Schließen</button><button onClick={() => startWorkout(previewWorkout.id)} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"><Dumbbell size={16} /> Jetzt starten</button></div>
            </div>
          </div>
        )}

        <div className="pb-24 min-h-screen">

          {activeTab === 'profile' && (
            <>
              <header className="bg-gradient-to-r from-orange-500 to-red-600 p-6 pb-12 text-white shadow-lg rounded-b-3xl">
                <div className="flex justify-center items-center">
                  <div>
                    <h1 className="text-5xl font-bold italic tracking-tighter text-white text-center transform -skew-x-6">
                      You vs You
                    </h1>
                  </div>
                </div>
              </header>
              <div className="p-6 -mt-8 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 flex flex-col justify-center items-center"><Trophy className="text-yellow-500 mb-2 drop-shadow-sm" size={28} /><span className="text-3xl font-black text-gray-900 leading-none">{getStats().total}</span><span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Total Workouts</span></div>
                  <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 flex flex-col justify-center items-center"><Flame className="text-orange-500 mb-2 drop-shadow-sm" size={28} /><span className="text-3xl font-black text-gray-900 leading-none">{getStreakStats().currentStreak}</span><span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Tage Streak</span></div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden text-white shadow-xl flex flex-col items-center justify-between gap-3 h-auto">
                  <Cloud className="absolute -left-4 -bottom-4 text-white opacity-5 w-32 h-32" />
                  <div className="relative z-10 w-full flex justify-between items-center">
                    <div><div className="flex items-center gap-2 mb-1"><Database size={20} className="text-blue-400" /><h3 className="font-bold text-lg">Cloud Sync</h3></div><p className="text-xs text-gray-400">Backup & Restore</p></div>
                    <div className="flex gap-2">
                      <button onClick={handleExport} className="p-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50" title="Backup Datei erstellen"><Download size={20} /></button>
                      <div className="relative"><input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors border border-gray-600" title="Datei importieren"><Upload size={20} /></button></div>
                      <button onClick={() => setShowPastePlanModal(true)} className="p-3 bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/50" title="Plan Text einfügen"><ClipboardCheck size={20} /></button>
                    </div>
                  </div>
                  <button onClick={() => setShowCustomLogModal(true)} className="relative z-10 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/10">
                    <PlusCircle size={18} /> Freies Training eintragen
                  </button>
                </div>

                {/* --- 1. MANUELLER PLAN --- */}
                <div onClick={() => { setBuilderInitialData(null); setShowBuilderModal(true); }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 text-purple-600 p-2 rounded-xl"><Edit size={20} /></div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">Manueller Plan</h3>
                            <p className="text-xs text-gray-500">Eigene Workouts erstellen</p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-300" />
                </div>

                {/* --- 2. WARM-UP PROMPT --- */}
                <div onClick={() => setActivePromptModal('warmup')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-orange-100 text-orange-600 p-2 rounded-xl"><Zap size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Warm-up Prompt</h3><p className="text-xs text-gray-500">Aufwärm-Routine anpassen</p></div></div><ChevronRight className="text-gray-300" /></div>

                {/* --- 3. COOL DOWN PLAN (EHEMALS PROMPT) --- */}
                <div onClick={() => setActivePromptModal('cooldown')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-teal-100 text-teal-600 p-2 rounded-xl"><Wind size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Mein Cool Down</h3><p className="text-xs text-gray-500">Regeneration & Stretching</p></div></div><ChevronRight className="text-gray-300" /></div>

                {/* --- 4. MEIN EQUIPMENT --- */}
                <div onClick={() => setShowEquipmentModal(true)} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><Package size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Mein Equipment</h3><p className="text-xs text-gray-500">Verfügbares Trainingsgerät</p></div></div><ChevronRight className="text-gray-300" /></div>

                {/* --- 5. COACH PHILOSOPHIE --- */}
                <div onClick={() => setActivePromptModal('system')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><FileText size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Coach Philosophie</h3><p className="text-xs text-gray-500">Identität & Regeln definieren</p></div></div><ChevronRight className="text-gray-300" /></div>

                {/* --- 6. NEUER 4-WOCHEN-PLAN --- */}
                <div onClick={() => setActivePromptModal('plan')} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Sparkles size={20} /></div><div><h3 className="font-bold text-lg text-gray-900">Neuer 4-Wochen-Plan</h3><p className="text-xs text-gray-500">Erstelle einen neuen Plan mit KI</p></div></div><div className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-xl shadow-md"><ChevronRight size={20} /></div></div>
                
                <div className="pt-6 pb-4 flex flex-col gap-3 items-center border-t border-gray-200 mt-4"><button onClick={handleClearPlan} className="text-orange-400 text-xs font-bold flex items-center gap-1 hover:text-orange-600 transition-colors"><AlertTriangle size={12} /> Nur Plan löschen (Verlauf behalten)</button><button onClick={handleReset} className="text-red-400 text-xs font-bold flex items-center gap-1 hover:text-red-600 transition-colors"><Trash2 size={12} /> Alles zurücksetzen (Hard Reset)</button></div>
              </div>
            </>
          )}

          {activeTab === 'training' && (
            <>
              <header className="bg-gradient-to-r from-orange-500 to-red-600 p-6 pb-6 shadow-lg text-white rounded-b-3xl">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-black italic text-white uppercase tracking-widest border-b-2 border-orange-200 pb-2 inline-block shadow-sm">
                        Stay Focused • Season 2026
                    </h1>
                </div>
                <div className="flex gap-2 bg-orange-800/30 p-1 rounded-xl backdrop-blur-sm">{[1, 2, 3, 4].map((week) => (<button key={week} onClick={() => setActiveWeek(week)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeWeek === week ? 'bg-white text-orange-700 shadow-md' : 'text-orange-100 hover:bg-white/10'}`}>W{week}</button>))}</div>
              </header>
              <main className="p-4 space-y-4 -mt-2">
                {visibleWorkouts.length > 0 ? (visibleWorkouts.map((workout: any) => { const isCompleted = isWorkoutCompleted(workout.id); return (<div key={workout.id} className={`relative overflow-hidden group p-5 rounded-2xl shadow-sm border transition-all ${isCompleted ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100 hover:shadow-md'} border-l-4 ${workout.color}`}><div className="flex justify-between items-start"><div className="flex-1 cursor-pointer" onClick={() => startWorkout(workout.id)}><div className="flex gap-2 mb-2"><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10} /> {workout.duration}</span><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Flame size={10} /> {workout.focus}</span></div><h3 className={`text-xl font-bold mb-1 ${isCompleted ? 'text-blue-900' : 'text-gray-900'}`}>{workout.title}</h3><p className="text-xs text-gray-500 line-clamp-1">{workout.focus}</p></div><div className="flex flex-col items-end gap-2 ml-4"><button onClick={(e) => {e.stopPropagation(); handleEditWorkout(workout)}} className="bg-white border border-gray-200 text-purple-500 p-2 rounded-xl hover:bg-purple-50 transition-colors shadow-sm mb-1" title="Kopieren & Bearbeiten"><PenTool size={16} /></button><button onClick={(e) => { e.stopPropagation(); setPreviewWorkout(workout); }} className="bg-white border border-gray-200 text-gray-500 p-2 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm" title="Vorschau ansehen"><Eye size={16} /></button>{isCompleted && (<div className="text-emerald-500 p-1"><CheckSquare size={20} /></div>)}</div></div></div>); })) : (<div className="text-center py-10 text-gray-400"><p>Keine Workouts für Woche {activeWeek}.</p></div>)}
              </main>
            </>
          )}

          {activeTab === 'history' && !selectedHistoryEntry && (
            <div className="pb-0">
              <header className="bg-gradient-to-r from-orange-500 to-red-600 p-6 pb-12 text-white shadow-lg rounded-b-3xl">
                <div className="flex justify-between items-center mb-1">
                  <div><h1 className="text-2xl font-black flex items-center gap-2">Verlauf <History className="text-orange-300" size={24} /></h1><p className="text-orange-100 text-sm font-medium mt-1">Deine Trainings-Historie</p></div>
                  <button onClick={handleCSVExport} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors" title="Export als CSV Tabelle"><FileSpreadsheet size={24} /></button>
                </div>
              </header>

              <div className="p-4 -mt-8 space-y-4">
                {history.length > 0 && (
                  <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-800"><BarChart3 size={20} className="text-blue-600" /><h3 className="font-bold text-sm">Volume Load (Letzte Workouts)</h3></div>
                    <div className="flex items-end justify-between h-32 gap-2 px-2">{chartData.map((d: any, i: number) => (<div key={i} className="flex flex-col items-center gap-1 w-full group"><div className="relative w-full flex items-end justify-center h-24 bg-gray-50 rounded-lg overflow-hidden"><div className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-600" style={{ height: `${d.height}%` }}></div></div><span className="text-[10px] text-gray-400 font-bold uppercase">{d.date}</span></div>))}</div>
                  </div>
                )}
                {history.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 bg-white rounded-3xl shadow-sm border border-gray-100"><CalendarDays size={48} className="mx-auto mb-4 text-gray-200" strokeWidth={1} /><p>Noch kein Training abgeschlossen.</p></div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry: any) => (
                      <div key={entry.id} onClick={() => setSelectedHistoryEntry(entry)} className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-emerald-500 border-y border-r border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] relative group">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Abgeschlossen</span>
                            <span className="text-[10px] font-bold text-gray-400">{formatDate(entry.date)}</span>
                            {entry.totalDuration && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10} /> {entry.totalDuration}</span>}
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">{entry.workoutTitle}</h3><p className="text-xs text-gray-500 mt-1">Woche {entry.week} • {entry.type}</p>
                        </div>
                        
                        {/* LÖSCHEN BUTTON */}
                        <div className="flex items-center gap-2 relative z-50" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={(e) => handleDeleteHistoryEntry(e, entry.id)} 
                                className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shadow-sm border border-gray-200"
                                title="Eintrag löschen"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && selectedHistoryEntry && (
            <div className="bg-gray-50">
              <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
                <button onClick={() => setSelectedHistoryEntry(null)} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors mb-2"><ArrowLeft size={20} /> <span className="text-sm font-medium">Zurück</span></button>
                <div className="flex justify-between items-start">
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{formatDate(selectedHistoryEntry.date)}</p><h1 className="text-2xl font-black text-gray-900">{selectedHistoryEntry.snapshot?.title || selectedHistoryEntry.workoutTitle}</h1></div>
                  {selectedHistoryEntry.totalDuration && <div className="bg-gray-100 px-3 py-1 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1"><Clock size={14} /> {selectedHistoryEntry.totalDuration}</div>}
                </div>
              </div>
              <div className="p-4 space-y-4">
                {selectedHistoryEntry.snapshot?.exercises?.map((ex: any, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 opacity-90">
                    <div className="border-b border-gray-100 pb-2 mb-2">
                      <h3 onClick={() => setAnalysisExercise(ex.name)} className="font-bold text-lg text-blue-700 cursor-pointer hover:underline decoration-blue-300 flex items-center gap-2">
                        {ex.name} <TrendingUp size={16} className="text-blue-300" />
                      </h3>
                    </div>
                    <div className="space-y-2">{ex.logs.map((log: any, j: number) => (<div key={j} className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-lg"><span>Satz {j + 1}</span><span className="font-bold">{log.weight}kg x {log.reps}</span></div>))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAV: Fixiert, aber innerhalb der max-w-md Begrenzung zentriert */}
        <div className="fixed bottom-0 w-full max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-2 pb-6 flex justify-between items-center text-xs font-medium z-20 left-0 right-0">
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'profile' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}><UserCircle className="w-6 h-6" /><span>Profil</span></button>
          <button onClick={() => setActiveTab('training')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'training' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}><Dumbbell className="w-6 h-6" /><span>Training</span></button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${activeTab === 'history' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}><History className="w-6 h-6" /><span>Verlauf</span></button>
        </div>

      </div>
    </div>
  );
}

export default App;