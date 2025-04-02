import React, { useEffect, useState } from 'react';
import DynamicTextarea from './DynamicTextArea';
import { InvalidMoveResponse, MoveResponse, useGame, ValidMoveResponse } from '@/contexts/GameContext';
import { GameState } from '@/types/GameState';
import { useAuth } from '@/contexts/AuthContext';
import { GameResults } from '@/types/GameResults';
import { useNavigate } from 'react-router-dom';

interface PlayerData {
  id: string;
  username: string;
  points: number;
  letters: string;
  written: string;
  words: string[];
  previousRank?: number;
  currentRank?: number;
}

interface AnimationState {
  [playerId: string]: {
    valid: boolean;
    invalid: boolean;
    points: boolean;
  };
}

interface PlayerError {
  [playerId: string]: string | null;
}

const Game: React.FC = () => {
  const [time, setTime] = useState(0); // in seconds
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [results, setResults] = useState<GameResults | null>(null);
  const [playerErrors, setPlayerErrors] = useState<PlayerError>({});
  const [animation, setAnimation] = useState<AnimationState>({});
  const [rankChanges, setRankChanges] = useState<{[playerId: string]: 'up' | 'down' | null}>({});

  const { move, write, on, gameData, gameStarted, connectToGame, cleanContext } = useGame();
  const { user, guestId, isAuthenticated } = useAuth();
  const userId = isAuthenticated ? user?.id : guestId;
  const navigate = useNavigate();

  useEffect(() => {
    connectToGame();
    console.log('Game component mounted, calling connectToGame');
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);
    setIntervalId(id);
    return () => clearInterval(id);
  }, []);
  
  const formattedTime = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;

  const triggerAnimation = (type: 'valid' | 'invalid' | 'points', playerId: string) => {
    setAnimation(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { valid: false, invalid: false, points: false }),
        [type]: true
      }
    }));
    
    setTimeout(() => {
      setAnimation(prev => ({
        ...prev,
        [playerId]: {
          ...(prev[playerId] || { valid: false, invalid: false, points: false }),
          [type]: false
        }
      }));
    }, 1000);
  };

  const handleMove = async (word: string) => {
    const res: MoveResponse = await move(word);
    if (res.success) {
      triggerAnimation('points', userId || '');
      triggerAnimation('valid', userId || '');
      setPlayerErrors(prev => ({ ...prev, [userId || '']: null }));
      return true;
    } else {
      triggerAnimation('invalid', userId || '');
      setPlayerErrors(prev => ({ ...prev, [userId || '']: res.reason || 'Invalid move' }));
      return false;
    }
  };

  const handleWrite = (word: string) => {
    write(word);
    if (playerErrors[userId || '']) {
      setPlayerErrors(prev => ({ ...prev, [userId || '']: null }));
    }
    console.log(word);
  }

  const handleGameStateChange = (data: GameState) => {
    console.log('Game state changed');
    setTime(gameData?.elapsedTime || 0);
    
    // Create new players array with ranks
    const playerEntries = Array.from(data.playerData.entries());
    const sortedPlayers: PlayerData[] = playerEntries
      .map(([playerId, playerData]) => ({
        id: playerId,
        username: playerData.username,
        points: playerData.points,
        letters: playerData.letters,
        written: playerData.written,
        words: playerData.words,
      }))
      .sort((a, b) => b.points - a.points);
    
    // Add rank information
    sortedPlayers.forEach((player, index) => {
      player.currentRank = index + 1;
    });
    
    // Check for rank changes
    const newRankChanges: {[playerId: string]: 'up' | 'down' | null} = {};
    
    players.forEach(oldPlayer => {
      const newPlayer = sortedPlayers.find(p => p.id === oldPlayer.id);
      if (newPlayer && oldPlayer.currentRank && newPlayer.currentRank) {
        if (newPlayer.currentRank < oldPlayer.currentRank) {
          newRankChanges[oldPlayer.id] = 'up';
        } else if (newPlayer.currentRank > oldPlayer.currentRank) {
          newRankChanges[oldPlayer.id] = 'down';
        } else {
          newRankChanges[oldPlayer.id] = null;
        }
      }
    });
    
    setRankChanges(newRankChanges);
    
    // Clear rank change animations after a delay
    setTimeout(() => {
      setRankChanges({});
    }, 2000);
    
    setPlayers(sortedPlayers);
  }
  
  const handleOpponentMoveInvalid = (data: InvalidMoveResponse) => {
    const playerId = data.by;
    if (playerId && playerId !== userId) {
      triggerAnimation('invalid', playerId);
      setPlayerErrors(prev => ({ ...prev, [playerId]: data.reason || 'Opponent made an invalid move' }));
      
      setTimeout(() => {
        setPlayerErrors(prev => ({ ...prev, [playerId]: null }));
      }, 3000);
    }
    
    console.log('Opponent move is invalid');
  }
  
  const handleOpponentMoveValid = (data: ValidMoveResponse) => {
    const playerId = data.by;
    if (playerId && playerId !== userId) {
      triggerAnimation('points', playerId);
      triggerAnimation('valid', playerId);
      setPlayerErrors(prev => ({ ...prev, [playerId]: null }));
    }
    console.log('Opponent move is valid');
  }
  
  const handleGameStarted = () => {
    console.log('Game started');
    setTime(0);
  }
  
  const handleGameEnded = (results: GameResults) => {
    setResults(results);
  }
  
  useEffect(() => {
    const unsubGameStateChange = on('gameStateChanged', (data: GameState) => {
      console.log(`Game state changed: ${JSON.stringify(data)}`);
      handleGameStateChange(data);
    });
    const unsubOpponentMoveInvalid = on('opponentMoveInvalid', (data: InvalidMoveResponse) => {
      console.log(`Opponent move is invalid: ${data}`);
      handleOpponentMoveInvalid(data);
    });
    const unsubOpponentMoveValid = on('opponentMoveValid', (data: ValidMoveResponse) => {
      console.log(`Opponent move is valid: ${data}`);
      handleOpponentMoveValid(data);
    });
    const unsubGameStarted = on('gameStarted', (data) => {
      console.log(`Game started: ${JSON.stringify(data)}`);
      handleGameStarted();
    });
    const unsubGameEnded = on('gameEnded', (results: GameResults) => {
      console.log(`Game ended: ${results}`);
      handleGameEnded(results);
    });

    return () => {
      unsubGameStateChange();
      unsubOpponentMoveInvalid();
      unsubOpponentMoveValid();
      unsubGameStarted();
      unsubGameEnded();
    } 
  }, [on]);

  const handleHome = () => {
    if(isAuthenticated){
      navigate('/home');
    } else {
      navigate('/');
    }
    cleanContext();
  }

  const handlePlayAgain = () => {
    setResults(null);
    setPlayers([]);
    setTime(0);
    connectToGame();
  }

  const getPlayersByRank = (results: GameResults) => {
    return Object.entries(results.scores)
      .map(([playerId, score]) => {
        const player = players.find(p => p.id === playerId);
        return {
          id: playerId,
          score,
          isCurrentPlayer: playerId === userId,
          username: player?.username || 'Player ' + playerId.substring(0, 4)
        };
      })
      .sort((a, b) => b.score.points - a.score.points);
  }

  if (!gameStarted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-2xl font-bold mb-4 text-indigo-600">Waiting for opponents</div>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  if (results && userId) {
    const isWinner = results.winner === userId;
    const rankedPlayers = getPlayersByRank(results);
    const playerRank = rankedPlayers.findIndex(p => p.id === userId) + 1;
    
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
          <h1 className={`text-5xl font-bold mb-6 text-center ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
            {isWinner ? '🏆 You Won! 🏆' : playerRank === 2 ? '🥈 So Close! 🥈' : '😔 You Placed #' + playerRank + ' 😔'}
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-center">Final Scores</h2>
            <div className="space-y-2">
              {rankedPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex justify-between p-3 rounded-lg ${
                    player.isCurrentPlayer 
                      ? 'bg-blue-100 border-2 border-blue-300' 
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-xl font-bold mr-2">#{index + 1}</span>
                    <span className="font-medium">
                      {player.isCurrentPlayer ? 'You' : player.username}
                    </span>
                  </div>
                  <div className="text-xl font-bold">
                    {player.score.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-4 mt-8">
            <button 
              className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              onClick={handlePlayAgain}
            >
              Play Again
            </button>
            <button 
              className="w-1/2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              onClick={handleHome}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const currentPlayer = players.find(player => player.id === userId);
  const opponents = players.filter(player => player.id !== userId);
  const totalPlayers = players.length;
  
  // Determine layout based on number of players
  const useSidebar = totalPlayers > 4;
  
  // Render player panel
  const renderPlayerPanel = (player: PlayerData, isCurrentPlayer: boolean = false) => {
    const bgColor = isCurrentPlayer ? 'bg-blue-50' : 'bg-red-50';
    const borderColor = isCurrentPlayer ? 'border-blue-300' : 'border-red-300';
    const textColor = isCurrentPlayer ? 'text-blue-600' : 'text-red-600';
    const labelBgColor = isCurrentPlayer ? 'bg-blue-600' : 'bg-red-600';
    
    return (
      <div className={`p-3 flex flex-col items-center ${bgColor} relative h-full`}>
        <div className={`absolute top-1 ${isCurrentPlayer ? 'left-2' : 'right-2'} ${labelBgColor} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
          {isCurrentPlayer ? 'YOU' : player.username}
        </div>
        
        <div className={`text-3xl font-bold mt-6 mb-2 transition-all duration-300 ${
          animation[player.id]?.points ? 'scale-150 text-green-600' : textColor
        }`}>
          {player.points || 0}
          {animation[player.id]?.points && <span className="animate-ping absolute text-green-500">+1</span>}
        </div>
        
        {/* player error message */}
        {playerErrors[player.id] && (
          <div className="w-full mb-2 px-2 py-1 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
            {playerErrors[player.id]}
          </div>
        )}
        
        <div className={`w-full ${animation[player.id]?.invalid ? 'animate-shake' : ''}`}>
          <DynamicTextarea
            onChange={isCurrentPlayer ? handleWrite : () => {}}
            onEnter={isCurrentPlayer ? handleMove : undefined}
            placeholder={isCurrentPlayer ? "Type here..." : "Opponent's text"}
            disabled={!isCurrentPlayer}
            value={isCurrentPlayer ? undefined : player.written || ''}
            className={`border-2 ${
              animation[player.id]?.valid 
                ? 'border-green-500' 
                : animation[player.id]?.invalid 
                  ? 'border-red-500' 
                  : borderColor
            }`}
          />
        </div>
        
        <div className={`text-2xl font-bold mt-2 mb-2 ${textColor}`}>
          {player.letters || ''}
        </div>
        
        <div className="w-full p-2 my-2 max-h-28 overflow-y-auto border-2 border-opacity-70 rounded-lg bg-white text-sm" style={{ borderColor: borderColor.replace('border-', '') }}>
          <h3 className={`font-bold ${textColor} mb-1`}>{isCurrentPlayer ? 'Your' : 'Their'} Words:</h3>
          <div className="grid grid-cols-2 gap-1">
            {player.words.map((word, index) => (
              <span key={index} className={`text-sm font-medium ${isCurrentPlayer ? 'bg-blue-100' : 'bg-red-100'} rounded px-1 py-0.5 truncate`}>
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render leaderboard sidebar for 5+ players
  const renderLeaderboard = () => {
    return (
      <div className="w-1/4 bg-gray-100 border-l border-gray-300 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Leaderboard</h2>
        
        <div className="space-y-2">
          {players.map((player, index) => (
            <div 
              key={player.id}
              className={`p-2 rounded-lg flex justify-between items-center transition-all duration-300 ${
                player.id === userId 
                  ? 'bg-blue-100 border border-blue-300' 
                  : 'bg-white border border-gray-200'
              } ${
                rankChanges[player.id] === 'up' 
                  ? 'transform -translate-y-2' 
                  : rankChanges[player.id] === 'down' 
                    ? 'transform translate-y-2' 
                    : ''
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg font-bold mr-2">#{index + 1}</span>
                <span className="font-medium text-sm truncate max-w-28">
                  {player.id === userId ? 'You' : player.username}
                </span>
              </div>
              
              <div className={`flex items-center ${
                animation[player.id]?.points ? 'text-green-600' : ''
              }`}>
                {rankChanges[player.id] === 'up' && (
                  <span className="text-green-500 mr-1">▲</span>
                )}
                {rankChanges[player.id] === 'down' && (
                  <span className="text-red-500 mr-1">▼</span>
                )}
                <span className="font-bold">
                  {player.points}
                  {animation[player.id]?.points && (
                    <span className="text-green-500 animate-ping absolute">+1</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 relative">
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-10">
        <div className="text-4xl font-bold text-red-600 bg-white rounded-b-lg shadow-md px-6 py-2 border-b-2 border-l-2 border-r-2 border-gray-300">
          {formattedTime}
        </div>
      </div>
      
      <div className={`flex flex-wrap pt-16 ${useSidebar ? 'w-3/4' : 'w-full'}`}>
        {/* Current player always shown */}
        {currentPlayer && (
          <div className={`${
            totalPlayers <= 2
              ? 'w-1/2'
              : totalPlayers <= 4
                ? 'w-1/2'
                : 'w-full'
          } border-b border-r border-gray-300`}>
            {renderPlayerPanel(currentPlayer, true)}
          </div>
        )}
        
        {/* Opponents - show all for 2-4 players, or just top 1-3 for 5+ */}
        {opponents
          .slice(0, useSidebar ? 3 : opponents.length)
          .map((opponent, index) => (
            <div 
              key={opponent.id} 
              className={`${
                totalPlayers <= 2
                  ? 'w-1/2'
                  : totalPlayers <= 4
                    ? 'w-1/2'
                    : 'w-full'
              } border-b ${index < opponents.length - 1 ? 'border-r' : ''} border-gray-300`}
            >
              {renderPlayerPanel(opponent)}
            </div>
          ))}
      </div>
      
      {/* Sidebar for 5+ players */}
      {useSidebar && renderLeaderboard()}
      
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Game;