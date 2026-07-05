import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md rounded-xl p-6 font-sans border border-black/10 shadow-2xl bg-white animate-in fade-in-50 zoom-in-95 duration-200">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              {options.title || 'Xác nhận hành động'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 mt-2 whitespace-pre-line leading-relaxed">
              {options.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-row justify-end gap-2.5">
            <AlertDialogCancel
              onClick={handleCancel}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer outline-none transition-colors"
            >
              {options.cancelText || 'Hủy'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg text-white text-sm font-semibold cursor-pointer outline-none transition-colors border-none ${
                options.type === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : options.type === 'warning'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {options.confirmText || 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
