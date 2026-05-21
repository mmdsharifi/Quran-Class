import React, { useState, useRef } from 'react';
import { Settings, X, Calendar, Upload, FileDown, Trash2, RefreshCw } from 'lucide-react';
import { AppSettings, Student } from '../../types';
import { parseCSVLine } from '../../utils/helpers';

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
    const days = [
        { id: 6, label: 'شنبه' },
        { id: 0, label: 'یک‌شنبه' },
        { id: 1, label: 'دوشنبه' },
        { id: 2, label: 'سه‌شنبه' },
        { id: 3, label: 'چهارشنبه' },
        { id: 4, label: 'پنج‌شنبه' },
        { id: 5, label: 'جمعه' },
    ];

    const [localSettings, setLocalSettings] = useState(settings);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        link.download = `quran-tracker-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.csv`;
        link.click();
        showToast('فایل خروجی ساخته شد', 'success');
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result as string;
                const lines = text.split('\n').filter(l => l.trim() !== '');
                if (lines.length < 2) { showToast('فایل خالی یا نامعتبر است', 'error'); return; }
                
                const dataLines = lines.slice(1);
                const parsedStudents: Student[] = dataLines.map(line => {
                    const cols = parseCSVLine(line);
                    if (cols.length < 12) return null;
                    return {
                        id: Number(cols[0]),
                        name: cols[1],
                        diamonds: Number(cols[2]),
                        stars: Number(cols[3]),
                        pluses: Number(cols[4]),
                        note: cols[5],
                        streak: Number(cols[6]),
                        ayahProgress: JSON.parse(cols[7] || '{}'),
                        memorizationProgress: JSON.parse(cols[8] || '{}'),
                        lastReview: JSON.parse(cols[9] || '{}'),
                        reviewHistory: JSON.parse(cols[10] || '{}'),
                        lastAction: cols[11] && cols[11] !== 'null' ? JSON.parse(cols[11]) : undefined,
                        completedSurahs: []
                    };
                }).filter(Boolean) as Student[];

                if (parsedStudents.length > 0) {
                    confirm(
                        'بازنشانی اطلاعات', 
                        `تعداد ${parsedStudents.length} رکورد پیدا شد. آیا مطمئن هستید که جایگزین شوند؟ تمام داده‌های فعلی از بین می‌روند.`,
                        () => {
                            onImport(parsedStudents);
                            onClose();
                            showToast('اطلاعات با موفقیت بازیابی شد', 'success');
                        },
                        true
                    );
                } else {
                    showToast('هیچ داده معتبری یافت نشد', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('خطا در پردازش فایل CSV', 'error');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-50 w-full max-w-md rounded-t-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
            >
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-slate-700 flex items-center gap-2"><Settings size={20}/> تنظیمات کلاس</h2>
                    <button onClick={onClose} className="bg-slate-200 p-2 rounded-full text-slate-500 hover:bg-slate-300"><X size={20}/></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2"><Calendar size={16}/> برنامه هفتگی</h3>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {days.map(day => {
                                const isRokhvani = localSettings.rokhvaniDays.includes(day.id);
                                const isHefz = localSettings.hefzDays.includes(day.id);
                                return (
                                    <div key={day.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                                        <span className="text-sm font-bold text-slate-700 w-20">{day.label}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => toggleDay(day.id, 'rokhvani')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isRokhvani ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                            >
                                                روخوانی
                                            </button>
                                            <button 
                                                onClick={() => toggleDay(day.id, 'hefz')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isHefz ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                            >
                                                حفظ
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2"><Upload size={16}/> مدیریت داده‌ها</h3>
                        <div className="bg-white rounded-2xl border border-slate-200 p-2 grid grid-cols-2 gap-2">
                             <button onClick={handleExportCSV} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 gap-2 transition-colors border border-slate-100">
                                <FileDown size={24} className="text-blue-500"/>
                                <span className="text-xs font-bold">خروجی CSV</span>
                             </button>
                             <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 gap-2 transition-colors border border-slate-100">
                                <Upload size={24} className="text-green-500"/>
                                <span className="text-xs font-bold">ایمپورت CSV</span>
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                        </div>
                    </div>

                    <button onClick={() => { onSave(localSettings); onClose(); showToast('تنظیمات ذخیره شد', 'success'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                        ذخیره تنظیمات
                    </button>

                    <div className="pt-4 border-t border-slate-200">
                         <button onClick={() => { 
                             confirm('حذف کل داده‌ها', 'هشدار: آیا مطمئن هستید که می‌خواهید تمام داده‌ها را حذف کنید؟ این عملیات غیرقابل بازگشت است.', () => {
                                 onReset();
                                 onClose();
                                 showToast('داده‌ها حذف شدند', 'success');
                             }, true);
                         }} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 p-3 rounded-xl border border-red-200 font-bold text-sm active:scale-95 transition-transform">
                             <Trash2 size={18} /> حذف تمام داده‌ها و شروع مجدد
                         </button>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono">{APP_VERSION} - {APP_LAST_UPDATE}</span>
                        <button onClick={() => window.location.reload()} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                            <RefreshCw size={10} />
                            بروزرسانی برنامه
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
