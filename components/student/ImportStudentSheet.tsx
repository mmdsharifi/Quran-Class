import React, { useState } from 'react';
import { X, Check, Users, HelpCircle } from 'lucide-react';
import { QuranClass, Student } from '../../types';

export const ImportStudentSheet = ({
  classes,
  activeClassId,
  onClose,
  onImport,
  showToast,
}: {
  classes: QuranClass[];
  activeClassId: string;
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
      showToast('لطفاً حداقل یک شاگرد را انتخاب کنید', 'error');
      return;
    }

    const studentsToImport = sourceStudents.filter((s) =>
      selectedStudentIds.includes(s.id)
    );

    onImport(studentsToImport, keepData);
    showToast(`${studentsToImport.length} شاگرد با موفقیت وارد شدند`, 'success');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-md rounded-t-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-slate-700 flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            <span>ورود شاگرد از کلاس دیگر</span>
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="bg-slate-200 p-2 rounded-full text-slate-500 hover:bg-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-right">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                کلاس مبدا
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:border-blue-500 outline-none"
                required
              >
                <option value="">انتخاب کلاس مبدا...</option>
                {otherClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji || '🕌'} {c.name} ({c.students?.length || 0} شاگرد)
                  </option>
                ))}
              </select>
            </div>

            {selectedClassId && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500">انتخاب شاگردان</span>
                  {sourceStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      {selectedStudentIds.length === sourceStudents.length
                        ? 'لغو انتخاب همه'
                        : 'انتخاب همه'}
                    </button>
                  )}
                </div>

                {sourceStudents.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-white border border-slate-200 rounded-xl">
                    هیچ شاگردی در این کلاس وجود ندارد.
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-2 p-1 border border-slate-100 bg-slate-100/50 rounded-xl">
                    {sourceStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <label
                          key={student.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50 border-blue-200 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudent(student.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                            />
                            <span className="font-bold text-slate-700 text-sm">
                              {student.name}
                            </span>
                          </div>
                          {student.note && (
                            <span className="text-xs text-slate-400 truncate max-w-[150px]">
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
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepData}
                    onChange={(e) => setKeepData(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-5 w-5 mt-0.5 shrink-0"
                  />
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-700">
                      انتقال همراه با سوابق کامل شاگرد
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 leading-normal">
                      شامل تمام امتیازات (ستاره، الماس)، زجیره فعالیت، و پیشرفت آیات
                      روخوانی و حفظ. در غیر این صورت فقط نام و یادداشت انتقال می‌یابد.
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 text-md"
            >
              <Check size={18} /> وارد کردن شاگردان
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
