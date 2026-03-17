import { create } from 'zustand';
import { Room } from '../types';

interface RoomState {
  currentRoom: Room | null;
  students: { id: string; username: string }[];
  setRoom: (room: Room) => void;
  setStudents: (students: { id: string; username: string }[]) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  students: [],
  setRoom: (room) => set({ currentRoom: room }),
  setStudents: (students) => set({ students }),
  clearRoom: () => set({ currentRoom: null, students: [] }),
}));