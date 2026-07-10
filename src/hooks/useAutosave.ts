import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../state/editorStore';

const DEBOUNCE_MS = 400;

export function useAutosave(save: () => Promise<void>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);

  useEffect(() => {
    const handleOffline = () => setSaveStatus('offline');
    const handleOnline = () => setSaveStatus('saved');
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    if (!navigator.onLine) setSaveStatus('offline');
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [setSaveStatus]);

  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus(navigator.onLine ? 'saving' : 'offline');
    timerRef.current = setTimeout(async () => {
      try {
        await save();
        if (navigator.onLine) setSaveStatus('saved');
      } catch (error) {
        console.error('Autosave failed:', error);
        setSaveStatus('error');
      }
    }, DEBOUNCE_MS);
  }, [save, setSaveStatus]);
}
