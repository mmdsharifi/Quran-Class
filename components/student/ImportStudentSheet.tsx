import React, { useState } from 'react';
import { X, Check, Users, HelpCircle } from 'lucide-react';
import { QuranClass, Student } from '../../types';
import { translate } from '../../translations';

export const ImportStudentSheet = ({
  classes,
  activeClassId,
  language = 'fa',
  onClose,
  onImport,
  showToast,
}: {
  classes: QuranClass[];
  activeClassId: string;
  language?: 'fa' | 'en';
  onClose: () => void;
  onImport: (selectedStudents: Student[], keepData: boolean) => void;
  showToast: any;
}) => {
  const otherClasses = classes.filter((c) => c.id !== activeClassId && !c.archived);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [keepData, setKeepData] = useState(true);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const sourceStudents = selectedClass ? selectedClass.students : [];

  const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) => translate(key, language, params);

  const handleToggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === sourceStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(sourceStudents.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      showToast(t('importEmpty'), 'error');
      return;
    }

    const studentsToImport = sourceStudents.filter((s) =>
      selectedStudentIds.includes(s.id)
    );

    onImport(studentsToImport, keepData);
    showToast(t('importSuccess', { count: studentsToImport.length }), 'success');
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
          <h2 className="text-lg font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            <span>{t('importFromOtherClass')}</span>
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="bg-slate-200 dark:bg-slate-800 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-start">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                {t('selectSourceClass')}
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-850 rounded-xl p-3 font-bold text-slate-700 dark:text-slate-200 focus:border-blue-500 dark:focus:border-blue-400 outline-none"
                required
              >
                <option value="" className="dark:bg-slate-950">{t('selectSourceClassPlaceholder')}</option>
                {otherClasses.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-950">
                    {c.emoji || '🕌'} {c.name} ({c.students?.length || 0} {t('persons')})
                  </option>
                ))}
              </select>
            </div>

            {selectedClassId && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('selectStudentsToImport')}</span>
                  {sourceStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {selectedStudentIds.length === sourceStudents.length
                        ? t('deselectAll')
                        : t('selectAll')}
                    </button>
                  )}
                </div>

                {sourceStudents.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                    {t('noStudentsInClass')}
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-2 p-1 border border-slate-100 dark:border-slate-850 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl">
                    {sourceStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <label
                          key={student.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 shadow-sm'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudent(student.id)}
                              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-500 focus:ring-blue-500 h-4.5 w-4.5 dark:bg-slate-900"
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                              {student.name}
                            </span>
                          </div>
                          {student.note && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              {student.note}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedClassId && sourceStudents.length > 0 && (
              <div className="bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepData}
                    onChange={(e) => setKeepData(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-500 focus:ring-blue-500 h-5 w-5 mt-0.5 shrink-0 dark:bg-slate-900"
                  />
                  <div className="flex flex-col text-start">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {t('keepHistory')}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      {t('keepHistoryDesc')}
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!selectedClassId || selectedStudentIds.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-650 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 text-md"
            >
              <Check size={18} /> {t('importAction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
