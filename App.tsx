import React from 'react';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { TeacherDashboard } from './screens/TeacherDashboard';
import { useClassData } from './hooks/useClassData';
import { useFeedback } from './hooks/useFeedback';

const App = () => {
  const {
    classes,
    activeClassId,
    students,
    settings,
    activeStudentId,
    setActiveStudentId,
    handleSelectClass,
    handleCreateClass,
    handleEditClass,
    handleDeleteClass,
    handleUpdateProgress,
    handleManualPoint,
    handleAddStudent,
    handleEditStudent,
    handleDeleteStudent,
    handleResetData,
    handleUpdateSettings,
    handleArchiveClass,
    handleImportStudentsFromClass,
    handleImportData,
  } = useClassData();

  const { toasts, modalConfig, addToast, confirmAction } = useFeedback();

  return (
    <>
      <ToastContainer toasts={toasts} />
      <ConfirmationModal {...modalConfig} />
      
      <TeacherDashboard
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onCreateClass={handleCreateClass}
        onEditClass={handleEditClass}
        onDeleteClass={handleDeleteClass}
        onArchiveClass={handleArchiveClass}
        students={students}
        onUpdateProgress={handleUpdateProgress}
        onSelectStudent={setActiveStudentId}
        activeStudentId={activeStudentId}
        onManualPoint={handleManualPoint}
        onResetData={handleResetData}
        onAddStudent={handleAddStudent}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
        onImportStudentsFromClass={handleImportStudentsFromClass}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onImportData={handleImportData}
        showToast={addToast}
        confirm={confirmAction}
      />
    </>
  );
};

export default App;