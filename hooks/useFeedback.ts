import { useState } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useFeedback = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false });

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void, isDangerous: boolean = false) => {
      setModalConfig({
          isOpen: true,
          title,
          message,
          onConfirm: () => {
              onConfirm();
              setModalConfig({ isOpen: false });
          },
          onCancel: () => setModalConfig({ isOpen: false }),
          isDangerous
      });
  };

  return { toasts, modalConfig, addToast, confirmAction };
};