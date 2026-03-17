import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Room } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try { const res: any = await api.get('/rooms'); if (res.code === 0) setRooms(res.data || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const joinRoom = async (roomId: string) => {
    try { await api.post('/rooms/' + roomId + '/join'); navigate('/room/' + roomId); }
    catch (err: any) { alert(err.response?.data?.message || '加入失败'); }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

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
               <div><h3 className="font-medium">{room.name}</h3><p className="text-sm text-gray-500">游戏类型: 24点</p></div>
               <button onClick={() => joinRoom(room.id)} className="bg-primary-600 text-white px-6 py-2 rounded-lg">加入</button>
             </div>
           ))}
         </div>}
      </div>
    </div>
  );
}
