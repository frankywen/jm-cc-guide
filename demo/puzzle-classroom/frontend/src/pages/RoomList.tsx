import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { wsService } from '../services/websocket';
import { Room } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  useEffect(() => { loadRooms(); }, []);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!token) return;

    const connectWS = async () => {
      try {
        // Only connect if not already connected
        if (!wsService.isConnected()) {
          await wsService.connect(token);
        }
      } catch (err) {
        console.error('[RoomList] Failed to connect WebSocket:', err);
      }
    };

    connectWS();

    // Don't disconnect on unmount - let the next page handle it
  }, [token]);

  // Listen for room updates
  const handleRoomCreated = useCallback((message: any) => {
    console.log('[RoomList] Room created:', message.data);
    const newRoom = message.data as Room;
    setRooms(prev => {
      // Avoid duplicates
      if (prev.some(r => r.id === newRoom.id)) return prev;
      return [...prev, newRoom];
    });
  }, []);

  const handleRoomDeleted = useCallback((message: any) => {
    console.log('[RoomList] Room deleted:', message.data);
    const roomId = message.data.roomId;
    setRooms(prev => prev.filter(r => r.id !== roomId));
  }, []);

  const handleRoomUpdated = useCallback((message: any) => {
    console.log('[RoomList] Room updated:', message.data);
    const { roomId, status, room } = message.data;
    setRooms(prev => {
      // Check if room exists in current list
      const existingIndex = prev.findIndex(r => r.id === roomId);
      if (existingIndex >= 0) {
        // Update existing room
        return prev.map(r => {
          if (r.id === roomId) {
            return { ...r, status };
          }
          return r;
        });
      } else {
        // Room not in list - if status is waiting or playing, add it
        if ((status === 'waiting' || status === 'playing') && room) {
          return [...prev, room];
        }
        return prev;
      }
    });
  }, []);

  useEffect(() => {
    wsService.on('room:created', handleRoomCreated);
    wsService.on('room:deleted', handleRoomDeleted);
    wsService.on('room:updated', handleRoomUpdated);

    return () => {
      wsService.off('room:created', handleRoomCreated);
      wsService.off('room:deleted', handleRoomDeleted);
      wsService.off('room:updated', handleRoomUpdated);
    };
  }, [handleRoomCreated, handleRoomDeleted, handleRoomUpdated]);

  const loadRooms = async () => {
    try { const res: any = await api.get('/rooms'); if (res.code === 0) setRooms(res.data || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const joinRoom = async (roomId: string) => {
    try { await api.post('/rooms/' + roomId + '/join'); navigate('/room/' + roomId); }
    catch (err: any) { alert(err.response?.data?.message || '加入失败'); }
  };

  const logout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const gameTypeLabels: Record<string, string> = { 'game24': '24点', 'sudoku': '数独' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">益智课堂游戏</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎, {user?.username}</span>
            <button onClick={logout} className="text-gray-600">退出</button>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">可加入的房间</h2>
        {loading ? <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">加载中...</div> :
         rooms.length === 0 ? <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">暂无可加入的房间</div> :
         <div className="space-y-4">
           {rooms.map((room) => (
             <div key={room.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
               <div><h3 className="font-medium">{room.name}</h3><p className="text-sm text-gray-500">游戏类型: {gameTypeLabels[room.gameType] || room.gameType} | 状态: {room.status === 'waiting' ? '等待中' : room.status === 'playing' ? '游戏中' : '已结束'}</p></div>
               <button onClick={() => joinRoom(room.id)} className="bg-primary-600 text-white px-6 py-2 rounded-lg">加入</button>
             </div>
           ))}
         </div>}
      </div>
    </div>
  );
}
