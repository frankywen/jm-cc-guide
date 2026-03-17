import { useState, useEffect, useCallback } from 'react';

interface Game24Props {
  numbers: number[];
  timeLimit?: number;
  onSubmit: (answer: string) => void;
  onTimeUp?: () => void;
  disabled?: boolean;
}

export default function Game24({ numbers, timeLimit = 60, onSubmit, onTimeUp, disabled }: Game24Props) {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (disabled || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [disabled, isSubmitted, onTimeUp]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || disabled || isSubmitted) return;
    setIsSubmitted(true);
    onSubmit(answer.trim());
  }, [answer, disabled, isSubmitted, onSubmit]);

  const resetGame = useCallback(() => {
    setAnswer('');
    setTimeLeft(timeLimit);
    setIsSubmitted(false);
  }, [timeLimit]);

  useEffect(() => {
    resetGame();
  }, [numbers, resetGame]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">24点游戏</h2>
        <p className="text-gray-600">使用加减乘除运算，使四个数字的结果等于24</p>
      </div>

      {/* Numbers Display */}
      <div className="flex justify-center gap-4 mb-6">
        {numbers.map((num, index) => (
          <div
            key={index}
            className="w-16 h-16 flex items-center justify-center bg-primary-500 text-white text-2xl font-bold rounded-lg shadow-md"
          >
            {num}
          </div>
        ))}
      </div>

      {/* Timer */}
      <div className="text-center mb-4">
        <span className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Answer Input */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">你的答案</label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="例如: (1+2+3)*4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={disabled || isSubmitted}
          />
          <p className="mt-1 text-sm text-gray-500">使用数字和运算符 (+, -, *, /, (, ))</p>
        </div>

        <button
          type="submit"
          disabled={!answer.trim() || disabled || isSubmitted}
          className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitted ? '已提交' : '提交答案'}
        </button>
      </form>

      {/* Operators Hint */}
      <div className="mt-4 text-center text-sm text-gray-500">
        可用运算符: + - * / ( )
      </div>
    </div>
  );
}