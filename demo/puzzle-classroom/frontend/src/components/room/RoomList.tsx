import { Room } from '../../types';

interface RoomListProps {
  rooms: Room[];
  onJoinRoom: (roomId: string) => void;
  loading?: boolean;
}

export default function RoomList({ rooms, onJoinRoom, loading }: RoomListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="mt-2">暂无房间</p>
      </div>
    );
  }

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'playing':
        return 'bg-green-100 text-green-800';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Room['status']) => {
    switch (status) {
      case 'waiting':
        return '等待中';
      case 'playing':
        return '游戏中';
      case 'finished':
        return '已结束';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {getStatusText(room.status)}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              游戏类型: {room.gameType === 'game24' ? '24点' : room.gameType}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              创建时间: {new Date(room.createdAt).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => onJoinRoom(room.id)}
            disabled={room.status === 'finished'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              room.status === 'finished'
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {room.status === 'finished' ? '已结束' : '加入'}
          </button>
        </div>
      ))}
    </div>
  );
}