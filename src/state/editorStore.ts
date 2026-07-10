import { create } from 'zustand';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface EditorState {
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  saveStatus: 'idle',
  setSaveStatus: (status) => set({ saveStatus: status }),
}));
