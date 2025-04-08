import React, { useEffect, useState } from 'react';
import { GamePausedData, GameResumedData, InvalidMoveResponse, MoveResponse, PlayerLeftData, useGame, ValidMoveResponse } from '@/contexts/GameContext';
import { GameState } from '@/types/GameState';
import { PlayerData } from '@/types/PlayerData';
import { useAuth } from '@/contexts/AuthContext';
import { GameResults } from '@/types/GameResults';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import GameHeader from './GameHeader';
import GameResultsPanel from './GameResultsPanel';
import GameDialogs from './GameDialogs';
import PlayerError from '@/types/PlayerErrors';
import AnimationState from '@/types/AnimationState';
import GameContent from './GameContent';


const Game: React.FC = () => {
  const [time, setTime] = useState(0); //in seconds
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [results, setResults] = useState<GameResults | null>(null);
  const [playerErrors, setPlayerErrors] = useState<PlayerError>({});
  const [animation, setAnimation] = useState<AnimationState>({});
  const [rankChanges, setRankChanges] = useState<{[playerId: string]: 'up' | 'down' | null}>({});
  const [gamePaused, setGamePaused] = useState(false);
  const [showAloneDialog, setShowAloneDialog] = useState(false);

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
    console.log(intervalId);
    return () => clearInterval(id);
  }, []);

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

  const handleGameStateChange = (data: GameState) => { //sets rankChanges and players[]
    console.log('Game state changed');
    setTime(gameData?.elapsedTime || 0);
    
    const playerEntries = Array.from(data.playerData.entries());
    console.log(`Player entries: ${JSON.stringify(playerEntries)}`);
    const sortedPlayers: PlayerData[] = playerEntries
      .map(([playerId, playerData]) => ({
        id: playerId,
        username: playerData.username,
        points: playerData.points,
        letters: playerData.letters,
        written: playerData.written,
        words: playerData.words,
        isPlaying: playerData.isPlaying,
      }))
      .sort((a, b) => b.points - a.points);
    
    sortedPlayers.forEach((player, index) => {
      player.currentRank = index + 1;
    });
    
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
    setTimeout(() => {
      setRankChanges({});
    }, 2000);
    
    console.log(`Sorted players: ${JSON.stringify(sortedPlayers)}`);
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

  const handlePlayerRemoved = (data: PlayerLeftData) => {
    console.log(`${data.username} removed from game: ${data.reason}`);
    toast.error(`${data.username} removed from game: ${data.reason}`);
    //TODO: handle case where the user is alone in the game now
    //show dialog to the player to either continue playing alone or leave the game
    const playersPlaying = players.filter(player => player.isPlaying).length;
    console.log(`Players playing: ${playersPlaying}`);
    console.log(`Players: ${JSON.stringify(players)}`);
    console.log(`players length: ${players.length}`);
    if(playersPlaying === 1){
      setGamePaused(true);
      console.log('Showing alone dialog');
      setShowAloneDialog(true);
    }else{
      console.log('Not showing alone dialog');
      setGamePaused(false);
    }
  }
  const handleContinuePlaying = () => {
    setGamePaused(false);
    setShowAloneDialog(false);
  }

  const handleLeaveGame = () => {
    cleanContext();
    navigate('/');
  }

  const handleGamePaused = (data: GamePausedData) => {
    console.log(`Game paused: ${data}`);
    setGamePaused(true);
  }

  const handleGameResumed = (data: GameResumedData) => {
    console.log(`Game resumed: ${data}`);
    setGamePaused(false);
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
    const unsubPlayerRemoved = on('playerRemoved', (data: PlayerLeftData) => {
      console.log(`${data.username} removed from game: ${data.reason}`);
      handlePlayerRemoved(data);
    });
    const unsubGamePaused = on('gamePaused', (data: GamePausedData) => {
      console.log(`Game paused: ${data}`);
      handleGamePaused(data);
    });
    const unsubGameResumed = on('gameResumed', (data: GameResumedData) => {
      console.log(`Game resumed: ${data}`);
      handleGameResumed(data);
    });

    return () => {
      unsubGameStateChange();
      unsubOpponentMoveInvalid();
      unsubOpponentMoveValid();
      unsubGameStarted();
      unsubGameEnded();
      unsubPlayerRemoved();
      unsubGamePaused();
      unsubGameResumed();
    } 
  }, [on, handleGameStateChange, handleOpponentMoveInvalid, handleOpponentMoveValid, handleGameStarted, handleGameEnded, handlePlayerRemoved, handleGamePaused, handleGameResumed]);

  const handleHome = () => {
    localStorage.setItem('lobbyCode', ''); //to disable auto-rejoin
    if(isAuthenticated){
      navigate('/home');
    } else {
      navigate('/');
    }
    cleanContext();
  }

  //this implementation is for immediate restart
  // const handlePlayAgain = () => { 
  //   const gameIdTemp = gameData?.gameId;
  //   cleanContext();
  //   setResults(null);
  //   setPlayers([]);
  //   setTime(0);
  //   if(gameIdTemp){
  //     setGameData({gameId: gameIdTemp, opponents: [], status: GameStatus.NotStarted, elapsedTime: 0});
  //   }else{
  //     console.error('No gameId found');
  //     toast.error('We had trouble restarting the game');
  //     navigate('/');
  //   }
  //   connectToGame();
  // }

  const handlePlayAgain = () => {
    console.log('Play again button clicked');
    navigate('/');
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
  
  if(results && userId){
    return <GameResultsPanel results={results} players={players} userId={userId} onPlayAgain={handlePlayAgain} onHome={handleHome} />
  }
  
  const currentPlayer = players.find(player => player.id === userId);
  const opponents = players.filter(player => player.id !== userId);
  const totalPlayers = players.length;
  const useSidebar = totalPlayers > 4;

  return (
    <div className="flex w-full h-screen bg-gray-50 relative">
      <GameHeader time={time} />
      <GameDialogs 
        showAloneDialog={showAloneDialog} 
        gamePaused={gamePaused && !showAloneDialog}
        onContinuePlaying={handleContinuePlaying}
        onLeaveGame={handleLeaveGame}
        setShowAloneDialog={setShowAloneDialog}
      />
      <GameContent 
        currentPlayer={currentPlayer || {id: '', username: '', points: 0, letters: '', written: '', words: [], isPlaying: false}}
        opponents={opponents}
        useSidebar={useSidebar}
        totalPlayers={totalPlayers}
        handleWrite={handleWrite}
        handleMove={handleMove}
        animation={animation}
        playerErrors={playerErrors}
        rankChanges={rankChanges}
      />
      
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