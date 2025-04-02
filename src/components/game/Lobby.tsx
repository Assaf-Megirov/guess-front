import React from 'react';
interface LobbyProps {
  lobby: {
    code: string;
    players: {
      id: string;
      username: string;
      ready: boolean;
    }[];
    admin: {
      id: string;
      username: string;
    };
  };
  userId: string;
  onReady: () => void;
  onUnready: () => void;
  onStart: () => void;
  onLeave: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ lobby, userId, onReady, onUnready, onStart, onLeave }) => {
    console.log(`lobby initialized with: ${JSON.stringify(lobby)}`);
    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 min-h-screen">
            <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Game Code:</p>
                <p className="text-xl font-bold">{lobby.code}</p>
            </div>
          <h2 className="text-3xl font-bold mb-6">Lobby</h2>
          <div className="w-full max-w-md space-y-4">
            {lobby.players.map((player) => (
              <div 
                key={player.id} 
                className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md"
              >
                <span className="text-lg font-medium">{player.username}</span>
                <span 
                  className={`px-2 py-1 rounded-full text-sm font-bold ${
                    player.ready ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                {player.ready ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex space-x-4">
            <button
                onClick={lobby.players.find(player => player.id === userId)?.ready ? onUnready : onReady}
                className={`px-6 py-3 ${
                    lobby.players.find(player => player.id === userId)?.ready 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                } text-white rounded-md shadow-md transition-colors`}
            >{lobby.players.find(player => player.id === userId)?.ready ? 'Not Ready' : 'Ready'}
            </button>
            {lobby.admin.id === userId && (
              <button
                onClick={onStart}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md transition-colors"
              >
                Start
              </button>
            )}
          </div>
          <div className="mt-12">
            <button
                onClick={onLeave}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-md transition-colors"
            > Leave Lobby </button>
          </div>
        </div>
      );
};

export default Lobby;
