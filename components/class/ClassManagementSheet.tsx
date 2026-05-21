import React, { useState } from 'react';
import { X, Check, Edit, Trash2, Calendar, BookOpen, Plus, Save, Undo2, Archive, ArchiveRestore, ChevronRight } from 'lucide-react';
import { QuranClass } from '../../types';

interface ClassManagementSheetProps {
  classes: QuranClass[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onCreateClass: (
    name: string,
    emoji: string,
    startDate?: string,
    endDate?: string,
    firstStudentName?: string
  ) => void;
  onEditClass: (id: string, updatedFields: Partial<QuranClass>) => void;
  onDeleteClass: (id: string) => void;
  onArchiveClass: (id: string, archive: boolean) => void;
  onClose: () => void;
  showToast: (m: string, t: 'success' | 'error') => void;
  confirm: (t: string, m: string, cb: () => void, danger?: boolean) => void;
}

const DEFAULT_EMOJIS = ['🕌', '🕋', '🍁', '🌸', '📚', '🌟', '✏️', '🏆', '🌱', '☀️', '🦁', '❤️'];

export const ClassManagementSheet = ({
  classes,
  activeClassId,
  onSelectClass,
  onCreateClass,
  onEditClass,
  onDeleteClass,
  onArchiveClass,
  onClose,
  showToast,
  confirm,
}: ClassManagementSheetProps) => {
  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassEmoji, setNewClassEmoji] = useState('🕌');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [firstStudentName, setFirstStudentName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeClasses = classes.filter((c) => !c.archived);
  const archivedClasses = classes.filter((c) => c.archived);

  // Editing Class State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const handleStartEdit = (c: QuranClass, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent class switching click
    setEditingClassId(c.id);
    setEditName(c.name);
    setEditEmoji(c.emoji || '🕌');
    setEditStartDate(c.startDate || '');
    setEditEndDate(c.endDate || '');
  };

  const handleSaveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editName.trim()) {
      showToast('نام کلاس نمی‌تواند خالی باشد', 'error');
      return;
    }
    onEditClass(id, {
      name: editName.trim(),
      emoji: editEmoji,
      startDate: editStartDate,
      endDate: editEndDate,
    });
    setEditingClassId(null);
    showToast('مشخصات کلاس بروزرسانی شد', 'success');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClassId(null);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetClass = classes.find(c => c.id === id);
    const isTargetActive = targetClass ? !targetClass.archived : false;

    if (classes.length <= 1) {
      showToast('حداقل باید یک کلاس در سیستم وجود داشته باشد', 'error');
      return;
    }
    if (isTargetActive && activeClasses.length <= 1) {
      showToast('حداقل باید یک کلاس فعال داشته باشید', 'error');
      return;
    }
    confirm(
      'حذف کلاس',
      `آیا از حذف کلاس "${name}" اطمینان دارید؟ تمامی اطلاعات مربوط به دانش‌آموزان این کلاس به طور کامل حذف خواهد شد.`,
      () => {
        onDeleteClass(id);
        showToast('کلاس با موفقیت حذف شد', 'success');
      },
      true
    );
  };

  const handleArchive = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeClasses.length <= 1) {
      showToast('حداقل باید یک کلاس فعال داشته باشید', 'error');
      return;
    }
    confirm(
      'بایگانی کلاس',
      `آیا از بایگانی کردن کلاس "${name}" اطمینان دارید؟`,
      () => {
        onArchiveClass(id, true);
        showToast('کلاس با موفقیت بایگانی شد', 'success');
      }
    );
  };

  const handleRestore = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onArchiveClass(id, false);
    showToast(`کلاس "${name}" با موفقیت بازیابی شد`, 'success');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      showToast('نام کلاس الزامی است', 'error');
      return;
    }
    onCreateClass(
      newClassName.trim(),
      newClassEmoji,
      newStartDate,
      newEndDate,
      firstStudentName.trim()
    );
    showToast('کلاس جدید با موفقیت ایجاد شد', 'success');
    // Reset Form
    setNewClassName('');
    setNewClassEmoji('🕌');
    setNewStartDate('');
    setNewEndDate('');
    setFirstStudentName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-md rounded-t-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-slate-700 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-500" /> مدیریت کلاس‌ها
          </h2>
          <button onClick={onClose} className="bg-slate-200 p-2 rounded-full text-slate-500 hover:bg-slate-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Class List */}
          {!showAddForm && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">لیست کلاس‌های شما</span>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} /> کلاس جدید
                </button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {activeClasses.map((c) => {
                  const isActive = c.id === activeClassId;
                  const isEditing = c.id === editingClassId;
                  const studentCount = c.students?.length || 0;

                  if (isEditing) {
                    return (
                      <div
                        key={c.id}
                        className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm flex flex-col gap-3"
                      >
                        <div className="grid grid-cols-4 gap-2">
                          <div className="col-span-3">
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">نام کلاس</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ایموجی</label>
                            <select
                              value={editEmoji}
                              onChange={(e) => setEditEmoji(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 text-center"
                            >
                              {DEFAULT_EMOJIS.map((emo) => (
                                <option key={emo} value={emo}>{emo}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">تاریخ شروع</label>
                            <input
                              type="text"
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              placeholder="مثلا ۱۴۰۴/۰۷/۰۱"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none focus:border-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">تاریخ پایان</label>
                            <input
                              type="text"
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              placeholder="مثلا ۱۴۰۴/۱۰/۰۱"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none focus:border-blue-400"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-1">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200"
                          >
                            انصراف
                          </button>
                          <button
                            onClick={(e) => handleSaveEdit(c.id, e)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Save size={12} /> ذخیره
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectClass(c.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 text-right transition-all group ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.emoji || '🕌'}</span>
                        <div className="text-right">
                          <span className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
                            {c.name}
                            {isActive && (
                              <span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                                فعال
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {studentCount} شاگرد
                            {c.startDate && ` | دوره: از ${c.startDate} تا ${c.endDate || '---'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEdit(c, e)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                          title="ویرایش کلاس"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => handleArchive(c.id, c.name, e)}
                          disabled={activeClasses.length <= 1}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:text-slate-300"
                          title="بایگانی کلاس"
                        >
                          <Archive size={14} />
                        </button>
                        {classes.length > 1 && (
                          <button
                            onClick={(e) => handleDelete(c.id, c.name, e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                            title="حذف کلاس"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Collapsible Archived Classes Accordion */}
              {archivedClasses.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-600 py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Archive size={14} className="text-slate-400" />
                      کلاس‌های بایگانی‌شده ({archivedClasses.length})
                    </span>
                    <ChevronRight
                      size={14}
                      className={`transform transition-transform ${showArchived ? 'rotate-90' : 'rotate-0'}`}
                    />
                  </button>

                  {showArchived && (
                    <div className="space-y-2 mt-3 max-h-[25vh] overflow-y-auto pr-1 animate-in fade-in duration-200">
                      {archivedClasses.map((c) => {
                        const studentCount = c.students?.length || 0;
                        return (
                          <div
                            key={c.id}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-right"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl opacity-60">{c.emoji || '🕌'}</span>
                              <div className="text-right">
                                <span className="font-bold text-sm text-slate-500">
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {studentCount} شاگرد
                                  {c.startDate && ` | دوره: از ${c.startDate} تا ${c.endDate || '---'}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={(e) => handleRestore(c.id, c.name, e)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                                title="بازیابی کلاس"
                              >
                                <ArchiveRestore size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(c.id, c.name, e)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                                title="حذف دائمی"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add Class Form */}
          {showAddForm && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">ایجاد کلاس جدید</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <Undo2 size={12} /> بازگشت به لیست
                </button>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">نام کلاس</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm text-slate-700 outline-none focus:border-blue-400"
                    placeholder="مثلا کلاس ترم بهار ۱۴۰۵ 🌸"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">ایموجی کلاس</label>
                  <div className="grid grid-cols-6 gap-2">
                    {DEFAULT_EMOJIS.map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setNewClassEmoji(emo)}
                        className={`text-xl p-2.5 rounded-xl border transition-all ${
                          newClassEmoji === emo
                            ? 'bg-blue-50 border-blue-400 scale-110 shadow-sm'
                            : 'bg-slate-50 border-transparent hover:border-slate-200'
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">تاریخ شروع (اختیاری)</label>
                    <input
                      type="text"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      placeholder="۱۴۰۵/۰۱/۱۵"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">تاریخ پایان (اختیاری)</label>
                    <input
                      type="text"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      placeholder="۱۴۰۵/۰۳/۳۱"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">نام اولین شاگرد (اختیاری)</label>
                  <input
                    type="text"
                    value={firstStudentName}
                    onChange={(e) => setFirstStudentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 outline-none focus:border-blue-400"
                    placeholder="مثلا علیرضا حسینی"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                ثبت و ایجاد کلاس
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
