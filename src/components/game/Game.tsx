import React, { useEffect } from 'react';
import DynamicTextarea from './DynamicTextArea';
import { MoveResponse, useGame } from '@/contexts/GameContext';
import { GameState } from '@/types/GameState';
import { useAuth } from '@/contexts/AuthContext';
import { GameResults } from '@/types/GameResults';
import { useNavigate } from 'react-router-dom';

interface PlayerData{
  id: string;
  username: string;
  points: number;
  letters: string;
  written: string;
  words: string[];
}

const Game: React.FC = () => {
  const [time, setTime] = React.useState(0); //in seconds
  const [intervalId, setIntervalId] = React.useState<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = React.useState<PlayerData[]>([]);
  const [results, setResults] = React.useState<GameResults | null>(null);

  const { move, write, on, gameData, gameStarted, connectToGame } = useGame();
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

  const handleMove = async (word: string) => {
    const res: MoveResponse = await move(word);
    if (res.success) {
      //TODO: create a +1 animation
      return true;
    }else{
      //TODO: create an animation that shakes the textarea
      return false;
    }
  };

  const handleWrite = (word: string) => {
    write(word);
    console.log(word);
  }

  const handleGameStateChange = (data: GameState) => {
    console.log('Game state changed');
    setTime(gameData?.elapsedTime || 0);
    const newPlayers: PlayerData[] = [];
    //TODO: get usernames from an endpoint
    data.playerData.forEach((playerData, playerId) => {
      newPlayers.push({
        id: playerId,
        username: 'TODO',
        points: playerData.points,
        letters: playerData.letters,
        written: playerData.written,
        words: playerData.words,
      });
    });
    setPlayers(newPlayers);
    //TODO: use the points data
    //TODO: verify gameState.players matches the player ids in the players array
    //TODO: handle GAME_STATE (status) changes
  }
  const handleOpponentMoveInvalid = () => {
    //TODO: create an animation that shakes the textarea of the opponent
    console.log('Opponent move is invalid');
  }
  const handleOpponentMoveValid = () => {
    //TODO: create a +1 animation for the opponent
    console.log('Opponent move is valid');
  }
  const handleGameStarted = () => {
    //TODO: at first the ui should not be shown and only a loading animation with a waiting for opponent message. And then the ui should be shown
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
    const unsubOpponentMoveInvalid = on('opponentMoveInvalid', (data) => {
      console.log(`Opponent move is invalid: ${data}`);
      handleOpponentMoveInvalid();
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
    //TODO: clean up the game context
    //TODO: add option to restart game
  }

  const getOpponents = (results: GameResults) => {
    return Object.entries(results.scores).filter(([key, value]) => key !== user?.id);
  }
  const getOpponent = (results: GameResults) => {
    return getOpponents(results)[0];
  }
  const getPlayer = (results: GameResults) => {
    const player = Object.entries(results.scores).find(([key, value]) => key === user?.id);
    return player;
  }

  if(!gameStarted){
    return (
      <div className="h-screen flex flex-col items-center justify-center">
      <div>Waiting for opponent</div>
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      </div>
    );
  }
  if(results && user && results.winner !== user.id){
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="text-center">
        <span className="text-4xl font-bold">Game ended, you lost</span>
        <span className="text-2xl font-bold">Opponent: {getOpponent(results)?.[0]}, points: {getOpponent(results)?.[1]}</span>
        <span className="text-2xl font-bold">You: {getPlayer(results)?.[0]}, points: {getPlayer(results)?.[1]}</span>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => {
          handleHome();
        }}>Home</button>
        </div>
      </div>
    );
  }
  if(results && user && results.winner === user.id){
    return (
      <div className="h-screen flex flex-col items-center justify-center">
      <div className="text-center">
      <span className="text-4xl font-bold">Game ended, you won</span>
      <span className="text-2xl font-bold">You: {getPlayer(results)?.[0]}, points: {getPlayer(results)?.[1]}</span>
      <span className="text-2xl font-bold">Opponent: {getOpponent(results)?.[0]}, points: {getOpponent(results)?.[1]}</span>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => {
        handleHome();
      }}>Home</button>
      </div>
    </div>
    );
  }
  return (
    <div className="flex flex-col md:flex-row w-full">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-6xl font-bold text-red-600">
        {formattedTime}
      </div>
      {/* user section */}
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-300 p-4 flex flex-col items-center">
      <span className="text-4xl font-bold mt-2 text-blue-600">{players.find(player => player.id === user?.id)?.points}</span>
        <DynamicTextarea
          onChange={handleWrite}
          onEnter={handleMove}
          placeholder="Type here..."
          disabled={false}
        />
        <span className="text-4xl font-bold mt-2 text-blue-600">{players.find(player => player.id === user?.id)?.letters}</span>
        <div className="w-full md:w-full p-4 m-4 max-h-40 overflow-y-auto border border-gray-300 rounded">
        <div className="grid grid-cols-3 gap-4">
          {players.find(player => player.id === user?.id)?.words.map((word, index) => (
            <span key={index} className="text-lg font-medium">
              {word}
            </span>
          ))}
        </div>
      </div>
      </div>

      {/* opponent section */}
      <div className="w-full md:w-1/2 p-4 flex flex-col items-center">
      <span className="text-4xl font-bold mt-2 text-blue-600">{players.find(player => player.id !== user?.id)?.points}</span>
        <DynamicTextarea
          onChange={(val) => console.log('Right:', val)}
          placeholder="Type here..."
          disabled={true}
          value={players.find(player => player.id !== user?.id)?.written}
        />
        <span className="text-4xl font-bold mt-2 text-blue-600">{players.find(player => player.id !== user?.id)?.letters}</span>
        <div className="w-full md:w-full p-4 m-4 max-h-40 overflow-y-auto border border-gray-300 rounded">
        <div className="grid grid-cols-3 gap-4">
          {players.find(player => player.id !== user?.id)?.words.map((word, index) => (
            <span key={index} className="text-lg font-medium">
              {word}
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Game;