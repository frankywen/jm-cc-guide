import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { wsService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';
import { Room, StudentProgress, SudokuQuestion } from '../types';

interface Student { id: string; username: string; }

interface GameStartData {
  sessionId: string;
  totalQuestions: number;
  numbers?: number[];
  puzzle?: string;
  currentIndex: number;
  gameType: string;
  difficulty?: string;
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
  const [sudokuPuzzle, setSudokuPuzzle] = useState<string>('');
  const [sudokuSolution, setSudokuSolution] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Multi-question state
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [disconnectedStudents, setDisconnectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => { loadRoom(); connectWebSocket(); return () => wsService.disconnect(); }, [roomId]);

  const loadRoom = async () => {
    try {
      const res: any = await api.get('/rooms/' + roomId);
      if (res.code === 0) { setRoom(res.data.room); setStudents(res.data.students || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const connectWebSocket = async () => {
    if (!token) return;

    // Clear previous handlers and callbacks to avoid duplicates
    wsService.clearOnConnectCallbacks();

    // Register handlers and callbacks BEFORE connecting (for reconnection)
    wsService.on('user_joined', (msg) => {
      console.log('[TeacherRoom] Received user_joined:', msg);
      loadRoom();
    });
    wsService.on('progress:update', handleProgressUpdate);
    wsService.on('student:left', handleStudentLeft);
    wsService.onConnect(() => {
      console.log('[TeacherRoom] WebSocket connected, joining room:', roomId);
      wsService.send({ type: 'join_room', roomId });
    });
    try {
      await wsService.connect(token);
      console.log('[TeacherRoom] wsService.connect resolved');
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

  const handleStudentLeft = (msg: any) => {
    console.log('[TeacherRoom] Student left:', msg.data);
    const { studentId } = msg.data;
    // Remove student from the list
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // Also remove from progress
    setStudentProgress(prev => prev.filter(p => p.studentId !== studentId));
    // Remove from disconnected set
    setDisconnectedStudents(prev => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  const startGame = async () => {
    try {
      const res: any = await api.post('/startGame', {
        roomId,
        questionCount,
        difficulty: room?.gameType === 'sudoku' ? difficulty : undefined
      });
      if (res.code === 0) {
        const { sessionId: newSessionId, totalQuestions: total, firstQuestion, gameType } = res.data;
        setSessionId(newSessionId);
        setTotalQuestions(total);
        setCurrentIndex(0);

        // Set question based on game type
        if (gameType === 'sudoku') {
          setSudokuPuzzle(firstQuestion.puzzle);
          setSudokuSolution(firstQuestion.solution || '');
          setQuestion([]);
        } else {
          setQuestion(firstQuestion);
          setSudokuPuzzle('');
          setSudokuSolution('');
        }

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
            gameType,
            difficulty: res.data.difficulty,
            numbers: gameType === 'game24' ? firstQuestion : undefined,
            puzzle: gameType === 'sudoku' ? firstQuestion.puzzle : undefined
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
        const { question, gameType } = res.data;
        setCurrentIndex(nextIndex);

        // Set question based on game type
        if (gameType === 'sudoku') {
          setSudokuPuzzle(question.puzzle);
          setSudokuSolution(question.solution || '');
          setQuestion([]);
        } else {
          setQuestion(question);
          setSudokuPuzzle('');
          setSudokuSolution('');
        }

        // Broadcast next question to students
        wsService.send({
          type: 'game:next',
          roomId,
          data: {
            sessionId,
            currentIndex: nextIndex,
            gameType,
            numbers: gameType === 'game24' ? question : undefined,
            puzzle: gameType === 'sudoku' ? question.puzzle : undefined
          }
        });
      }
    } catch (err) {
      console.error('Failed to get next question:', err);
    }
  };

  const endGame = async () => {
    if (!confirm('确定要结束游戏吗？')) return;

    await api.put('/rooms/' + roomId + '/status', { status: 'finished' });
    wsService.send({ type: 'game:end', roomId });
    setRoom((prev) => prev ? { ...prev, status: 'finished' } : null);
    setQuestion([]);
    // Keep sessionId and studentProgress for final ranking display
  };

  const resetGame = async () => {
    await api.put('/rooms/' + roomId + '/status', { status: 'waiting' });
    setRoom((prev) => prev ? { ...prev, status: 'waiting' } : null);
    setQuestion([]);
    setSudokuPuzzle('');
    setSudokuSolution('');
    setSessionId(null);
    setTotalQuestions(0);
    setCurrentIndex(0);
    setStudentProgress([]);
    setDisconnectedStudents(new Set());
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

  const logout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.clear();
      navigate('/login');
    }
  };

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
            {/* Question display */}
            {room?.gameType === 'game24' && question.length === 4 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">当前题目:</p>
                <div className="flex justify-center gap-2">
                  {question.map((num, i) => <span key={i} className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center font-bold text-primary-600">{num}</span>)}
                </div>
              </div>
            )}
            {room?.gameType === 'sudoku' && sudokuPuzzle && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">当前数独题目:</p>
                <div className="flex justify-center">
                  <div className="grid grid-cols-9 gap-0.5 border-2 border-gray-800">
                    {sudokuPuzzle.split('').map((cell, i) => {
                      const row = Math.floor(i / 9);
                      const col = i % 9;
                      const borderRight = (col + 1) % 3 === 0 && col < 8 ? 'border-r-2 border-gray-800' : '';
                      const borderBottom = (row + 1) % 3 === 0 && row < 8 ? 'border-b-2 border-gray-800' : '';
                      return (
                        <div
                          key={i}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${borderRight} ${borderBottom} ${cell === '.' ? 'bg-white' : 'bg-gray-200'}`}
                        >
                          {cell === '.' ? '' : cell}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {sudokuSolution && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-500 cursor-pointer">查看答案</summary>
                    <div className="mt-2 flex justify-center">
                      <div className="grid grid-cols-9 gap-0.5 border-2 border-gray-800">
                        {sudokuSolution.split('').map((cell, i) => {
                          const row = Math.floor(i / 9);
                          const col = i % 9;
                          const borderRight = (col + 1) % 3 === 0 && col < 8 ? 'border-r-2 border-gray-800' : '';
                          const borderBottom = (row + 1) % 3 === 0 && row < 8 ? 'border-b-2 border-gray-800' : '';
                          const isGiven = sudokuPuzzle[i] !== '.';
                          return (
                            <div
                              key={i}
                              className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${borderRight} ${borderBottom} ${isGiven ? 'bg-gray-200' : 'bg-green-100'}`}
                            >
                              {cell}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                )}
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
                  {room.gameType === 'sudoku' && (
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="easy">简单</option>
                      <option value="medium">中等</option>
                      <option value="hard">困难</option>
                      <option value="very-hard">非常困难</option>
                      <option value="insane">疯狂</option>
                      <option value="inhuman">非人类</option>
                    </select>
                  )}
                  <button onClick={startGame} className="flex-1 bg-green-500 text-white py-2 rounded-lg">开始游戏</button>
                </>
              )}
              {room.status === 'playing' && (
                <>
                  {currentIndex < totalQuestions - 1 && (
                    <button onClick={nextQuestion} className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">下一题</button>
                  )}
                  <button onClick={endGame} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">结束游戏</button>
                  <button onClick={refreshProgress} className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">刷新进度</button>
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
                const isDisconnected = disconnectedStudents.has(s.id);
                return (
                  <div key={s.id} className={`flex items-center justify-between p-2 bg-gray-50 rounded ${isDisconnected ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span>{s.username}</span>
                      {isDisconnected && <span className="text-xs text-red-500 bg-red-100 px-1.5 py-0.5 rounded">已断开</span>}
                    </div>
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
                      <span className={`w-2 h-2 rounded-full ${isDisconnected ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    )}
                  </div>
                );
              })}</div>}
          </div>
        </div>

        {(room.status === 'playing' || room.status === 'finished') && studentProgress.length > 0 && (() => {
          // Sort students by totalScore descending
          const rankedProgress = [...studentProgress].sort((a, b) => b.totalScore - a.totalScore);
          const isGameFinished = room.status === 'finished';

          return (
            <div className={`mt-6 rounded-lg shadow p-6 ${isGameFinished ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300' : 'bg-white'}`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {isGameFinished ? (
                  <>
                    <span className="text-2xl">🏆</span>
                    <span className="text-xl">最终排名</span>
                  </>
                ) : (
                  '实时排行榜'
                )}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm">
                      <th className="pb-2">排名</th>
                      <th className="pb-2">学生</th>
                      <th className="pb-2">进度</th>
                      <th className="pb-2">完成题数</th>
                      <th className="pb-2">总分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedProgress.map((p, index) => {
                      const isDisconnected = disconnectedStudents.has(p.studentId);
                      const rankBg = index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-100' : '';
                      return (
                        <tr key={p.studentId} className={`border-t ${rankBg} ${isDisconnected ? 'opacity-60' : ''}`}>
                          <td className="py-3">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                            {index > 2 && <span className="text-gray-500 font-medium">#{index + 1}</span>}
                          </td>
                          <td className="py-3">
                            <span className="font-medium">{p.username}</span>
                            {isDisconnected && <span className="ml-2 text-xs text-red-500 bg-red-100 px-1.5 py-0.5 rounded">已断开</span>}
                          </td>
                          <td className="py-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${isGameFinished ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${(p.completedCount / totalQuestions) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3">{p.completedCount}/{totalQuestions}</td>
                          <td className={`py-3 font-bold ${isGameFinished && index < 3 ? 'text-xl text-primary-600' : 'text-primary-600'}`}>{p.totalScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}