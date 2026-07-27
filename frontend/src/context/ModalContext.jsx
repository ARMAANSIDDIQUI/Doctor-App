import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, Trash2, X } from 'lucide-react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info' | 'success' | 'warning' | 'danger'
    confirmText: 'OK',
    cancelText: 'Cancel',
    isConfirm: false,
    resolveRef: null,
  });

  const showAlert = useCallback(({ title = 'Notice', message, type = 'info', confirmText = 'OK' }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText: '',
        isConfirm: false,
        resolveRef: resolve,
      });
    });
  }, []);

  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message,
    type = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        isConfirm: true,
        resolveRef: resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (modalState.resolveRef) {
      modalState.resolveRef(result);
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolveRef: null }));
  };

  const renderIcon = () => {
    switch (modalState.type) {
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <Trash2 className="h-6 w-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        );
      case 'success':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Info className="h-6 w-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (modalState.type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white';
      case 'info':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white';
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {modalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200">
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl border border-slate-100 transition-all">
            <button
              onClick={() => handleClose(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              {renderIcon()}
              <h3 className="mt-4 text-lg font-bold text-slate-900 tracking-tight">
                {modalState.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {modalState.message}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              {modalState.isConfirm && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all active:scale-95"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all active:scale-95 ${getConfirmButtonClasses()}`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
