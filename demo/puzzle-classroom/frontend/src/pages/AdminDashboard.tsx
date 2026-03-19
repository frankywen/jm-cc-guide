import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AdminRoom } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try {
      const res: any = await api.get('/admin/rooms');
      if (res.code === 0) setRooms(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('确定要删除这个房间吗？')) return;
    try {
      await api.delete('/admin/rooms/' + roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setSelectedRooms(prev => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const startEdit = (room: AdminRoom) => {
    setEditingRoom(room.id);
    setEditName(room.name);
    setEditStatus(room.status);
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditName('');
    setEditStatus('');
  };

  const saveEdit = async (roomId: string) => {
    try {
      await api.put('/admin/rooms/' + roomId, {
        name: editName,
        status: editStatus,
      });
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return { ...r, name: editName, status: editStatus as any };
        }
        return r;
      }));
      cancelEdit();
    } catch (err: any) {
      alert(err.response?.data?.message || '更新失败');
    }
  };

  const toggleSelectAll = () => {
    if (selectedRooms.size === rooms.length) {
      setSelectedRooms(new Set());
    } else {
      setSelectedRooms(new Set(rooms.map(r => r.id)));
    }
  };

  const toggleSelect = (roomId: string) => {
    setSelectedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  const batchDelete = async () => {
    if (selectedRooms.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedRooms.size} 个房间吗？`)) return;

    setDeleting(true);
    try {
      await api.post('/admin/rooms/batch-delete', {
        roomIds: Array.from(selectedRooms),
      });
      setRooms(prev => prev.filter(r => !selectedRooms.has(r.id)));
      setSelectedRooms(new Set());
    } catch (err: any) {
      alert(err.response?.data?.message || '批量删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const logout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-800',
    playing: 'bg-green-100 text-green-800',
    finished: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    waiting: '等待中',
    playing: '游戏中',
    finished: '已结束',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">管理后台</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">管理员: {user?.username}</span>
            <button onClick={logout} className="text-gray-600">退出</button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">所有房间 ({rooms.length})</h2>
          {selectedRooms.size > 0 && (
            <button
              onClick={batchDelete}
              disabled={deleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? '删除中...' : `删除选中 (${selectedRooms.size})`}
            </button>
          )}
        </div>
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">加载中...</div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">暂无房间</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRooms.size === rooms.length && rooms.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">房间名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.id} className={selectedRooms.has(room.id) ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRooms.has(room.id)}
                        onChange={() => toggleSelect(room.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRoom === room.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{room.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{room.teacherName || '未知'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRoom === room.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="waiting">等待中</option>
                          <option value="playing">游戏中</option>
                          <option value="finished">已结束</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[room.status]}`}>
                          {statusLabels[room.status]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(room.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingRoom === room.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => saveEdit(room.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => startEdit(room)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => deleteRoom(room.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}