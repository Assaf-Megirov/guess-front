import React, { useEffect, useState } from 'react';
import DynamicTextarea from './DynamicTextArea';
import { InvalidMoveResponse, MoveResponse, useGame } from '@/contexts/GameContext';
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
}

interface AnimationState {
  player: {
    valid: boolean;
    invalid: boolean;
    points: boolean;
  };
  opponent: {
    valid: boolean;
    invalid: boolean;
    points: boolean;
  };
}

const Game: React.FC = () => {
  const [time, setTime] = useState(0); // in seconds
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [results, setResults] = useState<GameResults | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [opponentError, setOpponentError] = useState<string | null>(null);
  const [animation, setAnimation] = useState<AnimationState>({
    player: { valid: false, invalid: false, points: false },
    opponent: { valid: false, invalid: false, points: false },
  });

  const { move, write, on, gameData, gameStarted, connectToGame, cleanContext } = useGame();
  const { user } = useAuth();
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

  const triggerAnimation = (type: 'valid' | 'invalid' | 'points', target: 'player' | 'opponent') => {
    setAnimation(prev => ({
      ...prev,
      [target]: {
        ...prev[target],
        [type]: true
      }
    }));
    
    setTimeout(() => {
      setAnimation(prev => ({
        ...prev,
        [target]: {
          ...prev[target],
          [type]: false
        }
      }));
    }, 1000);
  };

  const handleMove = async (word: string) => {
    const res: MoveResponse = await move(word);
    if (res.success) {
      triggerAnimation('points', 'player');
      triggerAnimation('valid', 'player');
      setPlayerError(null);
      return true;
    } else {
      triggerAnimation('invalid', 'player');
      setPlayerError(res.reason || 'Invalid move');
      return false;
    }
  };

  const handleWrite = (word: string) => {
    write(word);
    if (playerError) {
      setPlayerError(null);
    }
    console.log(word);
  }

  const handleGameStateChange = (data: GameState) => {
    console.log('Game state changed');
    setTime(gameData?.elapsedTime || 0);
    const newPlayers: PlayerData[] = [];
    
    data.playerData.forEach((playerData, playerId) => {
      newPlayers.push({
        id: playerId,
        username: 'Player ' + playerId.substring(0, 4),
        points: playerData.points,
        letters: playerData.letters,
        written: playerData.written,
        words: playerData.words,
      });
    });
    setPlayers(newPlayers);
  }
  
  const handleOpponentMoveInvalid = (data: InvalidMoveResponse) => {
    triggerAnimation('invalid', 'opponent');
    setOpponentError(data.reason || 'Opponent made an invalid move');
    setTimeout(() => {
      setOpponentError(null);
    }, 3000);
    
    console.log('Opponent move is invalid');
  }
  
  const handleOpponentMoveValid = () => {
    triggerAnimation('points', 'opponent');
    triggerAnimation('valid', 'opponent');
    setOpponentError(null);
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
      console.log(`Game state changed: ${data}`);
      handleGameStateChange(data);
    });
    const unsubOpponentMoveInvalid = on('opponentMoveInvalid', (data: InvalidMoveResponse) => {
      console.log(`Opponent move is invalid: ${data}`);
      handleOpponentMoveInvalid(data);
    });
    const unsubOpponentMoveValid = on('opponentMoveValid', (data) => {
      console.log(`Opponent move is valid: ${data}`);
      handleOpponentMoveValid();
    });
    const unsubGameStarted = on('gameStarted', (data) => {
      console.log(`Game started: ${data}`);
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
    navigate('/');
    cleanContext();
  }

  const handlePlayAgain = () => {
    setResults(null);
    setPlayers([]);
    setTime(0);
    connectToGame();
  }

  const getOpponents = (results: GameResults) => {
    return Object.entries(results.scores).filter(([key]) => key !== user?.id);
  }
  
  const getOpponent = (results: GameResults) => {
    return getOpponents(results)[0];
  }
  
  const getPlayer = (results: GameResults) => {
    return Object.entries(results.scores).find(([key]) => key === user?.id);
  }

  if (!gameStarted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-2xl font-bold mb-4 text-indigo-600">Waiting for opponent</div>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  if (results && user) {
    const isWinner = results.winner === user.id;
    const playerScore = getPlayer(results)?.[1];
    const opponentData = getOpponent(results);
    const opponentScore = opponentData?.[1];
    
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
          <h1 className={`text-5xl font-bold mb-6 text-center ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
            {isWinner ? '🏆 You Won! 🏆' : '😔 You Lost 😔'}
          </h1>
          
          <div className="flex justify-between mb-6">
            <div className="text-center w-1/2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-xl font-semibold mb-2">You</div>
              <div className="text-3xl font-bold text-blue-600">{playerScore}</div>
            </div>
            
            <div className="text-center w-1/2 p-4 ml-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="text-xl font-semibold mb-2">Opponent</div>
              <div className="text-3xl font-bold text-red-600">{opponentScore}</div>
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
  
  const playerData = players.find(player => player.id === user?.id);
  const opponentData = players.find(player => player.id !== user?.id);

  return (
    <div className="flex flex-col md:flex-row w-full h-screen bg-gray-50">
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-10">
        <div className="text-6xl font-bold text-red-600 bg-white rounded-b-lg shadow-md px-6 py-2 border-b-2 border-l-2 border-r-2 border-gray-300">
          {formattedTime}
        </div>
      </div>
      
      {/* user section */}
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-300 p-6 flex flex-col items-center bg-blue-50 relative pt-20">
        <div className="absolute top-20 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          YOU
        </div>
        
        <div className={`text-5xl font-bold mt-8 mb-4 transition-all duration-300 ${animation.player.points ? 'scale-150 text-green-600' : 'text-blue-600'}`}>
          {playerData?.points || 0}
          {animation.player.points && <span className="animate-ping absolute text-green-500">+1</span>}
        </div>
        
        {/* player error message */}
        {playerError && (
          <div className="w-full mb-2 px-3 py-2 bg-red-100 border-l-4 border-red-500 text-red-700">
            {playerError}
          </div>
        )}
        
        <div className={`w-full ${animation.player.invalid ? 'animate-shake' : ''}`}>
          <DynamicTextarea
            onChange={handleWrite}
            onEnter={handleMove}
            placeholder="Type here..."
            disabled={false}
            className={`border-2 ${animation.player.valid ? 'border-green-500' : animation.player.invalid ? 'border-red-500' : 'border-blue-300'}`}
          />
        </div>
        
        <div className="text-4xl font-bold mt-4 mb-2 text-blue-600">
          {playerData?.letters || ''}
        </div>
        
        <div className="w-full p-4 my-4 max-h-40 overflow-y-auto border-2 border-blue-300 rounded-lg bg-white">
          <h3 className="font-bold text-blue-600 mb-2">Your Words:</h3>
          <div className="grid grid-cols-3 gap-2">
            {playerData?.words.map((word, index) => (
              <span key={index} className="text-lg font-medium bg-blue-100 rounded px-2 py-1">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* opponent section */}
      <div className="w-full md:w-1/2 p-6 flex flex-col items-center bg-red-50 relative pt-20">
        <div className="absolute top-20 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          OPPONENT
        </div>
        
        <div className={`text-5xl font-bold mt-8 mb-4 transition-all duration-300 ${animation.opponent.points ? 'scale-150 text-green-600' : 'text-red-600'}`}>
          {opponentData?.points || 0}
          {animation.opponent.points && <span className="animate-ping absolute text-green-500">+1</span>}
        </div>
        
        {/* opponent error message */}
        {opponentError && (
          <div className="w-full mb-2 px-3 py-2 bg-red-100 border-l-4 border-red-500 text-red-700">
            {opponentError}
          </div>
        )}
        
        <div className={`w-full ${animation.opponent.invalid ? 'animate-shake' : ''}`}>
          <DynamicTextarea
            onChange={(val) => console.log('Right:', val)}
            placeholder="Opponent's text"
            disabled={true}
            value={opponentData?.written || ''}
            className={`border-2 ${animation.opponent.valid ? 'border-green-500' : animation.opponent.invalid ? 'border-red-500' : 'border-red-300'}`}
          />
        </div>
        
        <div className="text-4xl font-bold mt-4 mb-2 text-red-600">
          {opponentData?.letters || ''}
        </div>
        
        <div className="w-full p-4 my-4 max-h-40 overflow-y-auto border-2 border-red-300 rounded-lg bg-white">
          <h3 className="font-bold text-red-600 mb-2">Opponent's Words:</h3>
          <div className="grid grid-cols-3 gap-2">
            {opponentData?.words.map((word, index) => (
              <span key={index} className="text-lg font-medium bg-red-100 rounded px-2 py-1">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
      
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