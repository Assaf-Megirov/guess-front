import { GameData, useGame } from '@/contexts/GameContext';
import React from 'react';

const Game: React.FC = ({  }) => {
  const {gameData} = useGame();
  if(!gameData){
    return <h1>No game data yet...</h1>
  }
  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-lg font-bold mb-2">Game ID: {gameData.gameId}</h2>
      <h3 className="text-md font-semibold">Opponents:</h3>
      <ul className="list-disc list-inside">
        {gameData.opponents.map((opponent) => (
          <li key={opponent.userId}>
            <span className="font-medium">{opponent.username}</span> (User ID: {opponent.userId})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Game;
