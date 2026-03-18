import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const body = isLogin ? { username, password } : { username, password, role };
      const res: any = await api.post(endpoint, body);
      if (res.code === 0) {
        if (isLogin) {
          setAuth(res.data.user, res.data.token);
          // Navigate based on role
          if (res.data.user.role === 'admin') {
            navigate('/admin');
          } else if (res.data.user.role === 'teacher') {
            navigate('/teacher');
          } else {
            navigate('/rooms');
          }
        } else {
          setIsLogin(true);
          setError('注册成功，请登录');
        }
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '请求失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary-600">
          {isLogin ? '登录' : '注册'} - 益智课堂游戏
        </h1>
        {error && (
          <div className={'mb-4 p-3 rounded ' + (error.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required />
          </div>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">角色</label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="student">学生</option>
                <option value="teacher">老师</option>
              </select>
            </div>
          )}
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 font-medium">
            {isLogin ? '登录' : '注册'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? '没有账号？' : '已有账号？'}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary-600 ml-1 hover:underline font-medium">
            {isLogin ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
