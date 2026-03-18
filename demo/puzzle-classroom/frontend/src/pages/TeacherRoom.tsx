import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { wsService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';
import { Room, StudentProgress } from '../types';

interface Student { id: string; username: string; }

interface GameStartData {
  sessionId: string;
  totalQuestions: number;
  numbers: number[];
  currentIndex: number;
}

interface ProgressUpdateData {
  sessionId: string;
  students: StudentProgress[];
}

export default function TeacherRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [room, setRoom] = useState<Room | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [question, setQuestion] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-question state
  const [questionCount, setQuestionCount] = useState(10);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);

  useEffect(() => { loadRoom(); connectWebSocket(); return () => wsService.disconnect(); }, [roomId]);

  const loadRoom = async () => {
    try {
      const res: any = await api.get('/rooms/' + roomId);
      if (res.code === 0) { setRoom(res.data.room); setStudents(res.data.students || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const connectWebSocket = async () => {
    if (!token) return;
    // Register handlers and callbacks BEFORE connecting (for reconnection)
    wsService.on('user_joined', () => loadRoom());
    wsService.on('progress:update', handleProgressUpdate);
    wsService.onConnect(() => {
      wsService.send({ type: 'join_room', roomId });
    });
    try {
      await wsService.connect(token);
      // Join the room via WebSocket to receive broadcasts
      wsService.send({ type: 'join_room', roomId });
    } catch (err) { console.error(err); }
  };

  const handleProgressUpdate = (msg: any) => {
    const data = msg.data as ProgressUpdateData;
    if (data.students) {
      setStudentProgress(data.students);
    }
  };

  const startGame = async () => {
    try {
      const res: any = await api.post('/startGame', { roomId, questionCount });
      if (res.code === 0) {
        const { sessionId: newSessionId, totalQuestions: total, firstQuestion } = res.data;
        setSessionId(newSessionId);
        setTotalQuestions(total);
        setCurrentIndex(0);
        setQuestion(firstQuestion);

        // Initialize progress for all students
        const initialProgress = students.map(s => ({
          studentId: s.id,
          username: s.username,
          currentIndex: 0,
          completedCount: 0,
          totalScore: 0
        }));
        setStudentProgress(initialProgress);

        // Broadcast game start to students
        wsService.send({
          type: 'game:start',
          roomId,
          data: {
            sessionId: newSessionId,
            totalQuestions: total,
            currentIndex: 0,
            numbers: firstQuestion
          }
        });
        setRoom((prev) => prev ? { ...prev, status: 'playing' } : null);
      }
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const nextQuestion = async () => {
    if (!sessionId || currentIndex >= totalQuestions - 1) return;

    const nextIndex = currentIndex + 1;

    try {
      // Get the next question from the session
      const res: any = await api.post('/getNextQuestion', {
        roomId,
        index: nextIndex
      });

      if (res.code === 0) {
        const { question } = res.data;
        setCurrentIndex(nextIndex);
        setQuestion(question);

        // Broadcast next question to students
        wsService.send({
          type: 'game:next',
          roomId,
          data: {
            sessionId,
            currentIndex: nextIndex,
            numbers: question
          }
        });
      }
    } catch (err) {
      console.error('Failed to get next question:', err);
    }
  };

  const endGame = async () => {
    await api.put('/rooms/' + roomId + '/status', { status: 'finished' });
    wsService.send({ type: 'game:end', roomId });
    setRoom((prev) => prev ? { ...prev, status: 'finished' } : null);
    setQuestion([]);
    setSessionId(null);
    setTotalQuestions(0);
    setCurrentIndex(0);
  };

  const resetGame = async () => {
    await api.put('/rooms/' + roomId + '/status', { status: 'waiting' });
    setRoom((prev) => prev ? { ...prev, status: 'waiting' } : null);
    setQuestion([]);
    setSessionId(null);
    setTotalQuestions(0);
    setCurrentIndex(0);
    setStudentProgress([]);
  };

  const refreshProgress = async () => {
    if (!sessionId) return;
    try {
      const res: any = await api.get('/gameProgress?roomId=' + roomId);
      if (res.code === 0 && res.data.progress) {
        setStudentProgress(res.data.progress);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    }
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
            {sessionId && (
              <span className="ml-2 text-sm text-gray-500">
                题目 {currentIndex + 1} / {totalQuestions}
              </span>
            )}
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
            <div className="flex gap-2 flex-wrap">
              {room.status === 'waiting' && (
                <>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value={5}>5 题</option>
                    <option value={10}>10 题</option>
                    <option value={15}>15 题</option>
                    <option value={20}>20 题</option>
                  </select>
                  <button onClick={startGame} className="flex-1 bg-green-500 text-white py-2 rounded-lg">开始游戏</button>
                </>
              )}
              {room.status === 'playing' && (
                <>
                  {currentIndex < totalQuestions - 1 ? (
                    <button onClick={nextQuestion} className="flex-1 bg-blue-500 text-white py-2 rounded-lg">下一题</button>
                  ) : (
                    <button onClick={endGame} className="flex-1 bg-red-500 text-white py-2 rounded-lg">结束游戏</button>
                  )}
                  <button onClick={refreshProgress} className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg">刷新进度</button>
                </>
              )}
              {room.status === 'finished' && <button onClick={resetGame} className="flex-1 bg-primary-600 text-white py-2 rounded-lg">重新开始</button>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">学生列表 ({students.length}人)</h2>
            {students.length === 0 ? <p className="text-gray-500 text-center py-4">暂无学生加入</p> :
              <div className="space-y-2">{students.map((s) => {
                const progress = studentProgress.find(p => p.studentId === s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{s.username}</span>
                    {progress && sessionId ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(progress.completedCount / totalQuestions) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{progress.completedCount}/{totalQuestions}</span>
                        <span className="text-sm font-medium">{progress.totalScore}分</span>
                      </div>
                    ) : (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                );
              })}</div>}
          </div>
        </div>

        {sessionId && studentProgress.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">实时进度</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm">
                    <th className="pb-2">学生</th>
                    <th className="pb-2">进度</th>
                    <th className="pb-2">完成题数</th>
                    <th className="pb-2">总分</th>
                  </tr>
                </thead>
                <tbody>
                  {studentProgress.map((p) => (
                    <tr key={p.studentId} className="border-t">
                      <td className="py-2">{p.username}</td>
                      <td className="py-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(p.completedCount / totalQuestions) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2">{p.completedCount}/{totalQuestions}</td>
                      <td className="py-2 font-medium">{p.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}