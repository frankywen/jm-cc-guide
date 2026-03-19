import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Room } from '../types';

export default function TeacherDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try {
      const res: any = await api.get('/rooms');
      if (res.code === 0) setRooms(res.data || []);
    } catch (err) { console.error('Failed to load rooms:', err); }
    finally { setLoading(false); }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res: any = await api.post('/rooms', { name: newRoomName });
      if (res.code === 0) { setNewRoomName(''); loadRooms(); }
    } catch (err) { console.error('Failed to create room:', err); }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('确定要删除这个房间吗？')) return;
    try { await api.delete('/rooms/' + roomId); loadRooms(); }
    catch (err) { console.error('Failed to delete room:', err); }
  };

  const logout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">老师控制台</h1>
          <button onClick={logout} className="text-gray-600 hover:text-gray-800">退出登录</button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">创建新房间</h2>
          <form onSubmit={createRoom} className="flex gap-4">
            <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="房间名称" className="flex-1 px-4 py-2 border rounded-lg" />
            <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">创建</button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">我的房间</h2></div>
          {loading ? <div className="p-8 text-center text-gray-500">加载中...</div> :
           rooms.length === 0 ? <div className="p-8 text-center text-gray-500">暂无房间</div> :
           <div className="divide-y">
             {rooms.map((room) => (
               <div key={room.id} className="px-6 py-4 flex items-center justify-between">
                 <div>
                   <h3 className="font-medium">{room.name}</h3>
                   <p className="text-sm text-gray-500">状态: {room.status === 'waiting' ? '等待中' : room.status === 'playing' ? '游戏中' : '已结束'}</p>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => navigate('/teacher/room/' + room.id)} className="bg-primary-600 text-white px-4 py-2 rounded-lg">进入</button>
                   <button onClick={() => deleteRoom(room.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg">删除</button>
                 </div>
               </div>
             ))}
           </div>}
        </div>
      </div>
    </div>
  );
}
