import React, { useState, useRef } from 'react';
import { Settings, X, Calendar, Upload, FileDown, Trash2, RefreshCw } from 'lucide-react';
import { AppSettings, Student } from '../../types';
import { parseCSV } from '../../utils/helpers';
import { translate } from '../../translations';

const APP_VERSION = __APP_VERSION__;
const APP_LAST_UPDATE = __APP_LAST_UPDATE__;

export const SettingsSheet = ({ settings, students, onSave, onImport, onReset, onClose, showToast, confirm }: { 
    settings: AppSettings, 
    students: Student[], 
    onSave: (s: AppSettings) => void, 
    onImport: (s: Student[]) => void, 
    onReset: () => void,
    onClose: () => void,
    showToast: (m: string, t: 'success' | 'error') => void,
    confirm: (t: string, m: string, cb: () => void, danger?: boolean) => void
}) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const lang = localSettings.language || 'fa';
    const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) => 
        translate(key, lang, params);

    const days = [
        { id: 6, label: t('saturday') },
        { id: 0, label: t('sunday') },
        { id: 1, label: t('monday') },
        { id: 2, label: t('tuesday') },
        { id: 3, label: t('wednesday') },
        { id: 4, label: t('thursday') },
        { id: 5, label: t('friday') },
    ];

    const toggleDay = (dayId: number, type: 'rokhvani' | 'hefz') => {
        setLocalSettings(prev => {
            const isRokhvani = prev.rokhvaniDays.includes(dayId);
            const isHefz = prev.hefzDays.includes(dayId);

            if (type === 'rokhvani') {
                const newRokhvani = isRokhvani ? prev.rokhvaniDays.filter(d => d !== dayId) : [...prev.rokhvaniDays, dayId];
                return { ...prev, rokhvaniDays: newRokhvani, hefzDays: prev.hefzDays.filter(d => d !== dayId) };
            } else {
                const newHefz = isHefz ? prev.hefzDays.filter(d => d !== dayId) : [...prev.hefzDays, dayId];
                 return { ...prev, hefzDays: newHefz, rokhvaniDays: prev.rokhvaniDays.filter(d => d !== dayId) };
            }
        });
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Diamonds", "Stars", "Pluses", "Note", "Streak", "AyahProgress", "MemorizationProgress", "LastReview", "ReviewHistory", "LastAction"];
        const csvContent = "\uFEFF" + [ 
            headers.join(","),
            ...students.map(s => {
                return [
                    s.id,
                    `"${(s.name || '').replace(/"/g, '""')}"`,
                    s.diamonds,
                    s.stars,
                    s.pluses,
                    `"${(s.note || '').replace(/"/g, '""')}"`,
                    s.streak,
                    `"${JSON.stringify(s.ayahProgress).replace(/"/g, '""')}"`,
                    `"${JSON.stringify(s.memorizationProgress).replace(/"/g, '""')}"`,
                    `"${JSON.stringify(s.lastReview).replace(/"/g, '""')}"`,
                    `"${JSON.stringify(s.reviewHistory || {}).replace(/"/g, '""')}"`,
                    `"${JSON.stringify(s.lastAction || null).replace(/"/g, '""')}"`
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const dateStr = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR').replace(/\//g, '-');
        link.download = `quran-tracker-${dateStr}.csv`;
        link.click();
        showToast(t('csvExportSuccess'), 'success');
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result as string;
                const csvRows = parseCSV(text);
                if (csvRows.length < 2) { showToast(t('csvRestoreInvalid'), 'error'); return; }
                
                const dataLines = csvRows.slice(1);
                const parsedStudents: Student[] = dataLines.map(cols => {
                    if (cols.length < 12) return null;
                    if (!cols[1] || cols[1].trim() === '') return null; // Defensive check for student name

                    const safeJsonParse = (str: string, fallback: any = {}) => {
                        try {
                            return JSON.parse(str || '{}');
                        } catch (_) {
                            return fallback;
                        }
                    };

                    let lastActionVal = undefined;
                    if (cols[11] && cols[11] !== 'null') {
                        try {
                            lastActionVal = JSON.parse(cols[11]);
                        } catch (_) {}
                    }

                    return {
                        id: Number(cols[0]) || Date.now() + Math.floor(Math.random() * 1000),
                        name: cols[1],
                        diamonds: Number(cols[2]) || 0,
                        stars: Number(cols[3]) || 0,
                        pluses: Number(cols[4]) || 0,
                        note: cols[5],
                        streak: Number(cols[6]) || 0,
                        ayahProgress: safeJsonParse(cols[7]),
                        memorizationProgress: safeJsonParse(cols[8]),
                        lastReview: safeJsonParse(cols[9]),
                        reviewHistory: safeJsonParse(cols[10]),
                        lastAction: lastActionVal,
                        completedSurahs: []
                    };
                }).filter(Boolean) as Student[];

                if (parsedStudents.length > 0) {
                    confirm(
                        t('resetDataConfirmTitle'), 
                        t('resetDataConfirmDesc', { count: parsedStudents.length }),
                        () => {
                            onImport(parsedStudents);
                            onClose();
                            showToast(t('csvRestoreSuccess'), 'success');
                        },
                        true
                    );
                } else {
                    showToast(t('csvRestoreEmpty'), 'error');
                }
            } catch (err) {
                console.error(err);
                showToast(t('csvRestoreError'), 'error');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-50 dark:bg-slate-900 w-full max-w-md rounded-t-3xl lg:rounded-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom lg:zoom-in-95 duration-300 max-h-[90vh] lg:max-h-[85vh] overflow-y-auto"
            >
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-slate-700 dark:text-slate-200 flex items-center gap-2"><Settings size={20}/> {t('classSettings')}</h2>
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-800 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"><X size={20}/></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><Calendar size={16}/> {t('weeklySchedule')}</h3>
                        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {days.map(day => {
                                const isRokhvani = localSettings.rokhvaniDays.includes(day.id);
                                const isHefz = localSettings.hefzDays.includes(day.id);
                                return (
                                    <div key={day.id} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-900 last:border-0">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-20">{day.label}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => toggleDay(day.id, 'rokhvani')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isRokhvani ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/40' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-850'}`}
                                            >
                                                {t('recitation')}
                                            </button>
                                            <button 
                                                onClick={() => toggleDay(day.id, 'hefz')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isHefz ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-850'}`}
                                            >
                                                {t('memorization')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <span className="text-sm">🎨</span> {t('appTheme')}
                        </h3>
                        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 flex gap-1">
                            {(['system', 'light', 'dark'] as const).map((themeMode) => {
                                const isActive = (localSettings.theme || 'system') === themeMode;
                                return (
                                    <button
                                        key={themeMode}
                                        type="button"
                                        onClick={() => setLocalSettings(prev => ({ ...prev, theme: themeMode }))}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {t(themeMode)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <span className="text-sm">🌐</span> {t('appLanguage')}
                        </h3>
                        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 flex gap-1">
                            {(['fa', 'en'] as const).map((l) => {
                                const isActive = (localSettings.language || 'fa') === l;
                                return (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setLocalSettings(prev => ({ ...prev, language: l }))}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {t(l)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><Upload size={16}/> {t('dataManagement')}</h3>
                        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 grid grid-cols-2 gap-2">
                             <button onClick={handleExportCSV} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 gap-2 transition-colors border border-slate-100 dark:border-slate-850">
                                <FileDown size={24} className="text-blue-500"/>
                                <span className="text-xs font-bold">{t('exportCsv')}</span>
                             </button>
                             <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 gap-2 transition-colors border border-slate-100 dark:border-slate-850">
                                <Upload size={24} className="text-green-500"/>
                                <span className="text-xs font-bold">{t('importCsv')}</span>
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                        </div>
                    </div>

                    <button onClick={() => { onSave(localSettings); onClose(); showToast(t('settingsSaved'), 'success'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-transform">
                        {t('saveSettings')}
                    </button>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                         <button onClick={() => { 
                              confirm(t('resetDataWarningTitle'), t('resetDataWarningDesc'), () => {
                                  onReset();
                                  onClose();
                                  showToast(t('dataDeleted'), 'success');
                              }, true);
                          }} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-900/35 font-bold text-sm active:scale-95 transition-transform">
                              <Trash2 size={18} /> {t('resetAllData')}
                         </button>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{APP_VERSION} - {APP_LAST_UPDATE}</span>
                        <button onClick={() => window.location.reload()} className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-md">
                            <RefreshCw size={10} />
                            {t('updateApp')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
