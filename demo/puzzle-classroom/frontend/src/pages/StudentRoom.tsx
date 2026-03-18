import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { wsService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';
import { Room } from '../types';

interface GameStartData {
  sessionId: string;
  totalQuestions: number;
  numbers: number[];
  currentIndex: number;
}

interface GameNextData {
  sessionId: string;
  currentIndex: number;
  numbers: number[];
}

export default function StudentRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [question, setQuestion] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [result, setResult] = useState<{ correct: boolean; score: number } | null>(null);

  // Multi-question state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadRoom();
    connectWebSocket();
    return () => { wsService.disconnect(); };
  }, [roomId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'playing' && !result) {
      interval = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, result]);

  const loadRoom = async () => {
    try {
      const res: any = await api.get('/rooms/' + roomId);
      if (res.code === 0) {
        setRoom(res.data.room);
        if (res.data.room.status === 'playing') setGameState('playing');
      }
    } catch (err) { console.error('Load room failed:', err); }
  };

  const connectWebSocket = async () => {
    if (!token) return;
    // Register handlers and callbacks BEFORE connecting (for reconnection)
    wsService.on('game:start', (msg) => {
      const data = msg.data as GameStartData;
      setGameState('playing');
      setSessionId(data.sessionId);
      setTotalQuestions(data.totalQuestions);
      setCurrentIndex(data.currentIndex);
      setQuestion(data.numbers);
      setTimeSpent(0);
      setResult(null);
      setAnswer('');
      setTotalScore(0);
      setCompletedCount(0);
      setIsCompleted(false);
    });

    wsService.on('game:next', (msg) => {
      const data = msg.data as GameNextData;
      setCurrentIndex(data.currentIndex);
      setQuestion(data.numbers);
      setTimeSpent(0);
      setResult(null);
      setAnswer('');
    });

    wsService.on('game:end', () => {
      setGameState('finished');
      setSessionId(null);
    });

    wsService.onConnect(() => {
      wsService.send({ type: 'join_room', roomId });
    });

    try {
      await wsService.connect(token);
      // Join the room via WebSocket to receive broadcasts
      wsService.send({ type: 'join_room', roomId });
    } catch (err) { console.error('WS failed:', err); }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    try {
      const res: any = await api.post('/rooms/' + roomId + '/answer', {
        answer,
        question: question.join(','),
        timeSpent,
        sessionId,
        questionIndex: currentIndex
      });
      if (res.code === 0) {
        setResult({ correct: res.data.correct, score: res.data.score });
        if (res.data.totalScore !== undefined) {
          setTotalScore(res.data.totalScore);
        }
        if (res.data.totalCompleted !== undefined) {
          setCompletedCount(res.data.totalCompleted);
        }
        if (res.data.completed) {
          setIsCompleted(true);
        }
      }
    } catch (err) { console.error('Submit failed:', err); }
  };

  const requestNextQuestion = () => {
    if (!sessionId || currentIndex >= totalQuestions - 1) return;
    wsService.send({
      type: 'game:next',
      roomId,
      data: { sessionId }
    });
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  if (!room) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">{room.name}</h1>
          <button onClick={logout} className="text-gray-600">退出</button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {gameState === 'waiting' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">等待游戏开始</h2>
            <p className="text-gray-500">老师正在准备游戏...</p>
          </div>
        )}
        {gameState === 'playing' && question.length === 4 && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-6">
              {sessionId && (
                <div className="mb-4">
                  <span className="text-primary-600 font-medium">
                    题目 {currentIndex + 1} / {totalQuestions}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${((currentIndex + (result ? 1 : 0)) / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="text-gray-500 mb-2">用时: {timeSpent} 秒</div>
              <div className="flex justify-center gap-4 mb-6">
                {question.map((num, i) => (
                  <div key={i} className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-2xl font-bold text-primary-600">{num}</div>
                ))}
              </div>
            </div>
            <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="输入答案，如: (1+2)*3+4"
              className="w-full px-4 py-3 border rounded-lg text-lg mb-4" disabled={!!result} />
            {result ? (
              <div className="space-y-4">
                <div className={'p-4 rounded-lg ' + (result.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                  {result.correct ? '正确！得分: ' + result.score : '答案错误'}
                </div>
                {sessionId && (
                  <div className="text-center text-gray-600">
                    当前总分: <span className="font-bold text-primary-600">{totalScore}</span> 分
                  </div>
                )}
                {isCompleted ? (
                  <div className="bg-blue-100 p-4 rounded-lg text-center">
                    <div className="text-blue-700 font-bold mb-2">已完成全部题目！</div>
                    <div className="text-blue-600">最终得分: {totalScore} 分</div>
                  </div>
                ) : currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={requestNextQuestion}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg"
                  >
                    下一题
                  </button>
                ) : (
                  <div className="text-center text-gray-500">
                    等待老师结束游戏...
                  </div>
                )}
              </div>
            ) : (
              <button onClick={submitAnswer} className="w-full bg-primary-600 text-white py-3 rounded-lg">提交答案</button>
            )}
          </div>
        )}
        {gameState === 'finished' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">游戏结束</h2>
            {totalScore > 0 && (
              <div className="mb-4">
                <div className="text-4xl font-bold text-primary-600">{totalScore}</div>
                <div className="text-gray-500">最终得分</div>
              </div>
            )}
            <p className="text-gray-500">等待下一轮...</p>
          </div>
        )}
      </div>
    </div>
  );
}