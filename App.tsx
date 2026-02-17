import React from 'react';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { TeacherDashboard } from './screens/TeacherDashboard';
import { useStudentData } from './hooks/useStudentData';
import { useAppSettings } from './hooks/useAppSettings';
import { useFeedback } from './hooks/useFeedback';

const App = () => {
  const { settings, setSettings } = useAppSettings();
  
  const { 
    students, 
    activeStudentId, 
    setActiveStudentId, 
    handleUpdateProgress, 
    handleManualPoint, 
    handleAddStudent, 
    handleEditStudent, 
    handleDeleteStudent, 
    handleImportData, 
    handleResetData 
  } = useStudentData({ hefzDays: settings.hefzDays });

  const { toasts, modalConfig, addToast, confirmAction } = useFeedback();

  return (
    <>
      <ToastContainer toasts={toasts} />
      <ConfirmationModal {...modalConfig} />
      
      <TeacherDashboard
        students={students}
        onUpdateProgress={handleUpdateProgress}
        onSelectStudent={setActiveStudentId}
        activeStudentId={activeStudentId}
        onManualPoint={handleManualPoint}
        onResetData={handleResetData}
        onAddStudent={handleAddStudent}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
        settings={settings}
        onUpdateSettings={setSettings}
        onImportData={handleImportData}
        showToast={addToast}
        confirm={confirmAction}
      />
    </>
  );
};

export default App;