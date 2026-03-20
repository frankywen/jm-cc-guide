import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { wsService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';
import { Room, SudokuQuestion } from '../types';

interface GameStartData {
  sessionId: string;
  totalQuestions: number;
  numbers?: number[];
  puzzle?: string;
  currentIndex: number;
  gameType: string;
  difficulty?: string;
}

interface GameNextData {
  sessionId: string;
  currentIndex: number;
  numbers?: number[];
  puzzle?: string;
  gameType: string;
}

interface NumberCard {
  id: number;
  value: number;
  hidden: boolean;
}

interface Operation {
  num1Index: number;
  operator: string;
  num2Index: number;
  result: number;
}

export default function StudentRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [timeSpent, setTimeSpent] = useState(0);
  const [result, setResult] = useState<{ correct: boolean; score: number } | null>(null);

  // Game type
  const [gameType, setGameType] = useState<string>('game24');
  const [difficulty, setDifficulty] = useState<string>('');

  // Multi-question state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // 24-point game state
  const [originalQuestion, setOriginalQuestion] = useState<number[]>([]);
  const [numberCards, setNumberCards] = useState<NumberCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [message, setMessage] = useState<string>('');

  // Sudoku game state
  const [sudokuPuzzle, setSudokuPuzzle] = useState<string>('');
  const [sudokuAnswer, setSudokuAnswer] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

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

  // Reset game state for new question (24-point game)
  const resetQuestionState = useCallback((numbers: number[]) => {
    setOriginalQuestion(numbers);
    setNumberCards(numbers.map((num, i) => ({ id: i, value: num, hidden: false })));
    setSelectedCard(null);
    setSelectedOperator(null);
    setOperations([]);
    setMessage('');
    setResult(null);
    setTimeSpent(0);
  }, []);

  // Reset game state for new Sudoku puzzle
  const resetSudokuState = useCallback((puzzle: string) => {
    setSudokuPuzzle(puzzle);
    // Initialize answer array: empty cells are '.' in puzzle, students fill them
    setSudokuAnswer(puzzle.split(''));
    setSelectedCell(null);
    setMessage('');
    setResult(null);
    setTimeSpent(0);
  }, []);

  const loadRoom = async () => {
    try {
      const res: any = await api.get('/rooms/' + roomId);
      if (res.code === 0) {
        setRoom(res.data.room);
        if (res.data.room.status === 'playing') {
          setGameState('playing');
          fetchCurrentGameState();
        }
      }
    } catch (err) { console.error('Load room failed:', err); }
  };

  const fetchCurrentGameState = async () => {
    try {
      const res: any = await api.get('/rooms/' + roomId + '/gameState');
      if (res.code === 0 && res.data.status === 'playing') {
        setSessionId(res.data.sessionId);
        setTotalQuestions(res.data.totalQuestions);
        setCurrentIndex(res.data.currentIndex);
        setGameType(res.data.gameType || 'game24');
        setDifficulty(res.data.difficulty || '');
        setGameState('playing');
        // Restore progress
        if (res.data.totalScore !== undefined) {
          setTotalScore(res.data.totalScore);
        }
        if (res.data.completedCount !== undefined) {
          setCompletedCount(res.data.completedCount);
        }
        // Handle different game types
        if (res.data.gameType === 'sudoku' && res.data.question) {
          resetSudokuState(res.data.question.puzzle);
        } else if (res.data.question) {
          resetQuestionState(res.data.question);
        }
      }
    } catch (err) { console.error('Failed to fetch game state:', err); }
  };

  const connectWebSocket = async () => {
    if (!token) return;

    // Clear previous handlers and callbacks to avoid duplicates
    wsService.clearOnConnectCallbacks();

    wsService.on('game:start', (msg) => {
      console.log('[StudentRoom] Received game:start:', msg);
      const data = msg.data as GameStartData;
      setGameState('playing');
      setSessionId(data.sessionId);
      setTotalQuestions(data.totalQuestions);
      setCurrentIndex(data.currentIndex);
      setGameType(data.gameType || 'game24');
      setDifficulty(data.difficulty || '');
      setTotalScore(0);
      setCompletedCount(0);
      setIsCompleted(false);
      // Handle different game types
      if (data.gameType === 'sudoku' && data.puzzle) {
        resetSudokuState(data.puzzle);
      } else if (data.numbers) {
        resetQuestionState(data.numbers);
      }
    });

    wsService.on('game:next', (msg) => {
      console.log('[StudentRoom] Received game:next:', msg);
      const data = msg.data as GameNextData;
      setCurrentIndex(data.currentIndex);
      setGameType(data.gameType || 'game24');
      // Handle different game types
      if (data.gameType === 'sudoku' && data.puzzle) {
        resetSudokuState(data.puzzle);
      } else if (data.numbers) {
        resetQuestionState(data.numbers);
      }
    });

    wsService.on('game:end', () => {
      console.log('[StudentRoom] Received game:end');
      setGameState('finished');
      setSessionId(null);
      // Navigate back to room list after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    });

    wsService.onConnect(() => {
      console.log('[StudentRoom] WebSocket connected, joining room:', roomId);
      wsService.send({ type: 'join_room', roomId });
    });

    try {
      await wsService.connect(token);
      console.log('[StudentRoom] wsService.connect resolved');
      wsService.send({ type: 'join_room', roomId });
    } catch (err) { console.error('WS failed:', err); }
  };

  // Calculate result of operation
  const calculate = (a: number, op: string, b: number): number | null => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : null;
      default: return null;
    }
  };

  // Handle number card click
  const handleNumberClick = (index: number) => {
    if (result || numberCards[index].hidden) return;

    if (selectedCard === null) {
      // First number selected
      setSelectedCard(index);
      setSelectedOperator(null);
    } else if (selectedOperator === null) {
      // Clicked another number without operator - switch selection
      if (selectedCard === index) {
        setSelectedCard(null);
      } else {
        setSelectedCard(index);
      }
    } else {
      // Have both number and operator, this is second number
      if (selectedCard === index) {
        // Clicked same number - deselect
        setSelectedCard(null);
        setSelectedOperator(null);
        return;
      }

      const num1 = numberCards[selectedCard].value;
      const num2 = numberCards[index].value;
      const resultValue = calculate(num1, selectedOperator, num2);

      if (resultValue === null) {
        setMessage('计算错误（可能除以0）');
        return;
      }

      // Create new state
      const newCards = [...numberCards];
      newCards[selectedCard].hidden = true;
      newCards[index].hidden = true;
      newCards.push({
        id: newCards.length,
        value: resultValue,
        hidden: false
      });

      const newOp: Operation = {
        num1Index: selectedCard,
        operator: selectedOperator,
        num2Index: index,
        result: resultValue
      };

      setNumberCards(newCards);
      setOperations([...operations, newOp]);
      setSelectedCard(null);
      setSelectedOperator(null);
      setMessage(`${num1} ${selectedOperator} ${num2} = ${resultValue}`);

      // Check if only one number left
      const visibleCards = newCards.filter(c => !c.hidden);
      if (visibleCards.length === 1) {
        checkAnswer(visibleCards[0].value);
      }
    }
  };

  // Handle operator click
  const handleOperatorClick = (op: string) => {
    if (result || selectedCard === null) return;
    setSelectedOperator(op);
  };

  // Check final answer
  const checkAnswer = async (finalValue: number) => {
    if (!sessionId) return;

    const isCorrect = Math.abs(finalValue - 24) < 0.0001;

    // Build a mathematical expression from operations
    // Format: build expression that can be evaluated
    let answerStr = '';
    if (operations.length > 0 && isCorrect) {
      // Build expression - for validation, we send the calculation steps
      // Backend will validate that the numbers used match the question
      const steps = operations.map(op =>
        `${numberCards[op.num1Index].value}${op.operator}${numberCards[op.num2Index].value}=${Math.round(op.result * 100) / 100}`
      ).join(';');
      answerStr = steps;
    } else {
      answerStr = operations.map(op =>
        `${numberCards[op.num1Index].value}${op.operator}${numberCards[op.num2Index].value}=${op.result}`
      ).join(', ');
    }

    try {
      const res: any = await api.post('/rooms/' + roomId + '/answer', {
        answer: answerStr || `=${finalValue}`,
        question: originalQuestion.join(','),
        timeSpent,
        sessionId,
        questionIndex: currentIndex
      });

      if (res.code === 0) {
        setResult({ correct: isCorrect, score: res.data.score });
        if (res.data.totalScore !== undefined) {
          setTotalScore(res.data.totalScore);
        }
        if (res.data.totalCompleted !== undefined) {
          setCompletedCount(res.data.totalCompleted);
        }
        if (res.data.completed) {
          setIsCompleted(true);
        }

        if (!res.data.completed && res.data.nextQuestion) {
          setIsAdvancing(true);
          setTimeout(() => {
            setCurrentIndex(res.data.nextIndex);
            if (gameType === 'sudoku' && res.data.nextQuestion.puzzle) {
              resetSudokuState(res.data.nextQuestion.puzzle);
            } else {
              resetQuestionState(res.data.nextQuestion);
            }
            setIsAdvancing(false);
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  // Skip question
  const skipQuestion = async () => {
    console.log('[StudentRoom] skipQuestion called, sessionId:', sessionId, 'result:', result);
    if (!sessionId) {
      setMessage('无法跳过：游戏会话无效');
      return;
    }
    if (result) {
      return; // Already answered, button should be hidden
    }

    try {
      console.log('[StudentRoom] Sending skip request...');
      const res: any = await api.post('/rooms/' + roomId + '/skip', {
        sessionId,
        questionIndex: currentIndex
      });

      console.log('[StudentRoom] Skip response:', res);

      if (res.code === 0) {
        setMessage('已跳过此题，得0分');
        setResult({ correct: false, score: 0 });
        if (res.data.totalScore !== undefined) {
          setTotalScore(res.data.totalScore);
        }
        if (res.data.totalCompleted !== undefined) {
          setCompletedCount(res.data.totalCompleted);
        }
        if (res.data.completed) {
          setIsCompleted(true);
        }

        if (!res.data.completed && res.data.nextQuestion) {
          setIsAdvancing(true);
          setTimeout(() => {
            setCurrentIndex(res.data.nextIndex);
            if (gameType === 'sudoku') {
              resetSudokuState(res.data.nextQuestion.puzzle);
            } else {
              resetQuestionState(res.data.nextQuestion);
            }
            setIsAdvancing(false);
          }, 1500);
        }
      } else {
        console.error('Skip failed with code:', res.code, res.message);
        setMessage('跳过失败: ' + (res.message || '未知错误'));
      }
    } catch (err) {
      console.error('Skip request error:', err);
      setMessage('跳过失败，请重试');
    }
  };

  // Reset current question
  const resetQuestion = () => {
    if (result) return;
    resetQuestionState(originalQuestion);
  };

  // Sudoku: Handle cell click
  const handleSudokuCellClick = (index: number) => {
    if (result) return;
    // Don't allow editing given cells (original puzzle values)
    if (sudokuPuzzle[index] !== '.') return;
    setSelectedCell(index);
  };

  // Sudoku: Handle number input
  const handleSudokuNumberInput = (num: string) => {
    if (result || selectedCell === null) return;
    const newAnswer = [...sudokuAnswer];
    newAnswer[selectedCell] = num;
    setSudokuAnswer(newAnswer);
  };

  // Sudoku: Clear selected cell
  const handleSudokuClear = () => {
    if (result || selectedCell === null) return;
    const newAnswer = [...sudokuAnswer];
    newAnswer[selectedCell] = '.';
    setSudokuAnswer(newAnswer);
  };

  // Sudoku: Submit answer
  const submitSudokuAnswer = async () => {
    if (!sessionId || result) return;

    const answerStr = sudokuAnswer.join('');
    // Check if all cells are filled
    if (answerStr.includes('.')) {
      setMessage('请填写所有空格');
      return;
    }

    try {
      const res: any = await api.post('/rooms/' + roomId + '/answer', {
        answer: answerStr,
        questionIndex: currentIndex,
        sessionId,
        timeSpent
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

        if (!res.data.completed && res.data.nextQuestion) {
          setIsAdvancing(true);
          setTimeout(() => {
            setCurrentIndex(res.data.nextIndex);
            resetSudokuState(res.data.nextQuestion.puzzle);
            setIsAdvancing(false);
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Submit Sudoku failed:', err);
    }
  };

  // Sudoku: Skip question
  const skipSudokuQuestion = async () => {
    if (!sessionId || result) return;

    try {
      const res: any = await api.post('/rooms/' + roomId + '/skip', {
        sessionId,
        questionIndex: currentIndex
      });

      if (res.code === 0) {
        setMessage('已跳过此题，得0分');
        setResult({ correct: false, score: 0 });
        if (res.data.totalScore !== undefined) {
          setTotalScore(res.data.totalScore);
        }
        if (res.data.totalCompleted !== undefined) {
          setCompletedCount(res.data.totalCompleted);
        }
        if (res.data.completed) {
          setIsCompleted(true);
        }

        if (!res.data.completed && res.data.nextQuestion) {
          setIsAdvancing(true);
          setTimeout(() => {
            setCurrentIndex(res.data.nextIndex);
            resetSudokuState(res.data.nextQuestion.puzzle);
            setIsAdvancing(false);
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Skip Sudoku failed:', err);
    }
  };

  const logout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const leaveRoom = () => {
    if (confirm('确定要离开房间吗？')) {
      wsService.disconnect();
      navigate('/');
    }
  };

  const operators = ['+', '-', '×', '÷'];
  const operatorMap: Record<string, string> = { '+': '+', '-': '-', '×': '*', '÷': '/' };

  if (!room) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>;

  const visibleCards = numberCards.filter(c => !c.hidden);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">{room.name}</h1>
          <div className="flex items-center gap-4">
            <button onClick={leaveRoom} className="text-gray-600 hover:text-gray-800">离开房间</button>
            <button onClick={logout} className="text-gray-600 hover:text-gray-800">退出登录</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {gameState === 'waiting' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">等待游戏开始</h2>
            <p className="text-gray-500">老师正在准备游戏...</p>
          </div>
        )}
        {gameState === 'playing' && gameType === 'game24' && originalQuestion.length === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-4">
              {sessionId && (
                <div className="mb-3">
                  <span className="text-primary-600 font-medium">
                    题目 {currentIndex + 1} / {totalQuestions}
                  </span>
                  <span className="ml-4 text-gray-500">总分: {totalScore}</span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${((currentIndex + (result ? 1 : 0)) / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="text-gray-500 mb-2">用时: {timeSpent} 秒</div>
            </div>

            {/* Number Cards */}
            <div className="flex justify-center gap-3 mb-4 flex-wrap">
              {numberCards.map((card, i) => (
                <button
                  key={card.id}
                  onClick={() => handleNumberClick(i)}
                  disabled={card.hidden || !!result}
                  className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold transition-all
                    ${card.hidden ? 'opacity-30 bg-gray-100 text-gray-400' :
                      selectedCard === i ? 'bg-blue-500 text-white ring-4 ring-blue-200' :
                      'bg-primary-100 text-primary-600 hover:bg-primary-200'}
                    ${result ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {card.hidden ? '' : card.value}
                </button>
              ))}
            </div>

            {/* Operators */}
            {!result && (
              <div className="flex justify-center gap-3 mb-4">
                {operators.map((op) => (
                  <button
                    key={op}
                    onClick={() => handleOperatorClick(operatorMap[op])}
                    disabled={selectedCard === null}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold transition-all
                      ${selectedCard === null ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                        selectedOperator === operatorMap[op] ? 'bg-green-500 text-white ring-4 ring-green-200' :
                        'bg-green-100 text-green-600 hover:bg-green-200'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}

            {/* Message */}
            {message && (
              <div className="text-center text-gray-600 mb-3 text-sm">
                {message}
              </div>
            )}

            {/* Operations History */}
            {operations.length > 0 && (
              <div className="text-center text-sm text-gray-500 mb-3">
                计算过程: {operations.map((op, i) => (
                  <span key={i} className="mx-1">
                    {numberCards[op.num1Index].value} {op.operator} {numberCards[op.num2Index].value} = {Math.round(op.result * 100) / 100}
                  </span>
                ))}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <div className={'p-4 rounded-lg text-center ' + (result.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                  {result.correct ? `正确！得分: ${result.score}` : result.score === 0 && !message.includes('跳过') ? '答案错误或最终结果不是24' : '已跳过'}
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
                ) : isAdvancing ? (
                  <div className="text-center text-primary-600 py-2 font-medium">
                    正在加载下一题...
                  </div>
                ) : currentIndex < totalQuestions - 1 ? (
                  <div className="text-center text-gray-500 py-2">
                    即将进入下一题...
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    等待老师结束游戏...
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!result && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetQuestion}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  重置
                </button>
                <button
                  onClick={skipQuestion}
                  className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                >
                  跳过此题
                </button>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-center text-sm text-gray-400">
              点击数字 → 选择运算符 → 点击另一个数字 → 得到结果，最终等于24即为正确
            </div>
          </div>
        )}
        {/* Sudoku Game UI */}
        {gameState === 'playing' && gameType === 'sudoku' && sudokuPuzzle && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-4">
              {sessionId && (
                <div className="mb-3">
                  <span className="text-primary-600 font-medium">
                    题目 {currentIndex + 1} / {totalQuestions}
                  </span>
                  <span className="ml-4 text-gray-500">总分: {totalScore}</span>
                  {difficulty && <span className="ml-4 text-gray-500">难度: {difficulty}</span>}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${((currentIndex + (result ? 1 : 0)) / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="text-gray-500 mb-2">用时: {timeSpent} 秒</div>
            </div>

            {/* Sudoku Grid */}
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-9 gap-0.5 border-2 border-gray-800 bg-gray-800 p-0.5">
                {sudokuAnswer.map((cell, i) => {
                  const row = Math.floor(i / 9);
                  const col = i % 9;
                  const isGiven = sudokuPuzzle[i] !== '.';
                  const borderRight = (col + 1) % 3 === 0 && col < 8 ? 'border-r-2 border-gray-800' : 'border-r border-gray-300';
                  const borderBottom = (row + 1) % 3 === 0 && row < 8 ? 'border-b-2 border-gray-800' : 'border-b border-gray-300';

                  return (
                    <button
                      key={i}
                      onClick={() => handleSudokuCellClick(i)}
                      disabled={isGiven || !!result}
                      className={`w-9 h-9 flex items-center justify-center text-sm font-medium transition-all
                        ${isGiven ? 'bg-gray-200 text-gray-800 font-bold' :
                          selectedCell === i ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' :
                          'bg-white hover:bg-gray-50'}
                        ${borderRight} ${borderBottom}`}
                    >
                      {cell === '.' ? '' : cell}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number Pad */}
            {!result && selectedCell !== null && (
              <div className="flex justify-center gap-2 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSudokuNumberInput(num)}
                    className="w-10 h-10 bg-primary-100 text-primary-600 rounded font-bold text-lg hover:bg-primary-200"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleSudokuClear}
                  className="w-10 h-10 bg-gray-200 text-gray-600 rounded font-bold hover:bg-gray-300"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className="text-center text-gray-600 mb-3 text-sm">
                {message}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <div className={'p-4 rounded-lg text-center ' + (result.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                  {result.correct ? `正确！得分: ${result.score}` : '答案错误，得0分'}
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
                ) : isAdvancing ? (
                  <div className="text-center text-primary-600 py-2 font-medium">
                    正在加载下一题...
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-2">
                    {result.correct ? '即将进入下一题...' : '等待老师结束游戏...'}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!result && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={submitSudokuAnswer}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                >
                  提交答案
                </button>
                <button
                  onClick={skipSudokuQuestion}
                  className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                >
                  跳过此题
                </button>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-center text-sm text-gray-400">
              点击空格 → 选择数字 → 填满所有格子后提交答案
            </div>
          </div>
        )}
        {gameState === 'finished' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">游戏结束</h2>
            <div className="mb-4">
              <div className="text-4xl font-bold text-primary-600">{totalScore}</div>
              <div className="text-gray-500">最终得分</div>
            </div>
            <p className="text-gray-500">正在返回房间列表...</p>
          </div>
        )}
      </div>
    </div>
  );
}