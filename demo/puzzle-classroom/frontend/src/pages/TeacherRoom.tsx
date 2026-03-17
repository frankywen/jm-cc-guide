import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { wsService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';
import { Room } from '../types';

interface Student { id: string; username: string; }

export default function TeacherRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [room, setRoom] = useState<Room | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [question, setQuestion] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRoom(); connectWebSocket(); return () => wsService.disconnect(); }, [roomId]);

  const loadRoom = async () => {
    try {
      const res: any = await api.get('/rooms/' + roomId);
      if (res.code === 0) { setRoom(res.data.room); setStudents(res.data.students || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const connectWebSocket = async () => {
    if (!token) return;
    try {
      await wsService.connect(token);
      // Join the room via WebSocket to receive broadcasts
      wsService.send({ type: 'join_room', roomId });
      wsService.on('user_joined', () => loadRoom());
    } catch (err) { console.error(err); }
  };

  const startGame = async () => {
    const numbers = [Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1];
    setQuestion(numbers);
    await api.put('/rooms/' + roomId + '/status', { status: 'playing' });
    wsService.send({ type: 'game:start', roomId, data: { numbers } });
    setRoom((prev) => prev ? { ...prev, status: 'playing' } : null);
  };

  const endGame = async () => {
    await api.put('/rooms/' + roomId + '/status', { status: 'finished' });
    wsService.send({ type: 'game:end', roomId });
    setRoom((prev) => prev ? { ...prev, status: 'finished' } : null);
    setQuestion([]);
  };

  const resetGame = async () => {
    await api.put('/rooms/' + roomId + '/status', { status: 'waiting' });
    setRoom((prev) => prev ? { ...prev, status: 'waiting' } : null);
    setQuestion([]);
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center text-gray-500">房间不存在</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-primary-600">{room.name}</h1>
            <span className={'text-sm px-2 py-1 rounded ' + (room.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' : room.status === 'playing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
              {room.status === 'waiting' ? '等待中' : room.status === 'playing' ? '游戏中' : '已结束'}
            </span>
          </div>
          <button onClick={logout} className="text-gray-600">退出</button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">游戏控制</h2>
            {question.length === 4 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">当前题目:</p>
                <div className="flex justify-center gap-2">
                  {question.map((num, i) => <span key={i} className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center font-bold text-primary-600">{num}</span>)}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {room.status === 'waiting' && <button onClick={startGame} className="flex-1 bg-green-500 text-white py-2 rounded-lg">开始游戏</button>}
              {room.status === 'playing' && <button onClick={endGame} className="flex-1 bg-red-500 text-white py-2 rounded-lg">结束游戏</button>}
              {room.status === 'finished' && <button onClick={resetGame} className="flex-1 bg-primary-600 text-white py-2 rounded-lg">重新开始</button>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">学生列表 ({students.length}人)</h2>
            {students.length === 0 ? <p className="text-gray-500 text-center py-4">暂无学生加入</p> :
              <div className="space-y-2">{students.map((s) => <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded"><span>{s.username}</span><span className="w-2 h-2 bg-green-500 rounded-full"></span></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
