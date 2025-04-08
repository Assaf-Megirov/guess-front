import { GameResults } from '@/types/GameResults';
import { PlayerData } from '@/types/PlayerData';
import ResultScores from './ResultScores';

interface GameResultsProps {
    results: GameResults;
    players: PlayerData[];
    userId: string;
    onPlayAgain: () => void;
    onHome: () => void;
}

const getPlayersByRank = (results: GameResults, players: PlayerData[], userId: string) => {
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

const GameResultsPanel = ({ results, players, userId, onPlayAgain, onHome }: GameResultsProps) => {
    const isWinner = results.winner === userId;
    const rankedPlayers = getPlayersByRank(results, players, userId);
    const playerRank = rankedPlayers.findIndex(p => p.id === userId) + 1;
    
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
          <h1 className={`text-5xl font-bold mb-6 text-center ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
            {isWinner ? '🏆 You Won! 🏆' : playerRank === 2 ? '🥈 So Close! 🥈' : '😔 You Placed #' + playerRank + ' 😔'}
          </h1>
          
          <ResultScores rankedPlayers={rankedPlayers} />
          
          <div className="flex space-x-4 mt-8">
            <button 
              className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              onClick={onPlayAgain}
              disabled={true}
            >
              Play Again (Coming Soon)
            </button>
            <button 
              className="w-1/2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              onClick={onHome}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  };

export default GameResultsPanel;