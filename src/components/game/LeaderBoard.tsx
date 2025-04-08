import AnimationState from "@/types/AnimationState";
import PlayerData from "@/types/PlayerData";
import LeaderboardItem from "./LeaderBoardItem";


interface LeaderboardProps {
    players: PlayerData[];
    animation: AnimationState;
    rankChanges: {[playerId: string]: 'up' | 'down' | null};
    userId: string;
}

const Leaderboard = ({ players, animation, rankChanges, userId }: LeaderboardProps) => {
    return (
      <div className="w-1/4 bg-gray-100 border-l border-gray-300 p-4 overflow-y-auto md:w-1/4 sm:w-1/3 max-sm:w-2/5 max-sm:p-2">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center max-sm:text-lg max-sm:mb-2">Leaderboard</h2>
        
        <div className="space-y-2 max-sm:space-y-1">
          {players.map((player, index) => (
            <LeaderboardItem 
              key={player.id}
              player={player}
              rank={index + 1}
              isCurrentPlayer={player.id === userId}
              rankChange={rankChanges[player.id]}
              animation={animation[player.id]}
            />
          ))}
        </div>
      </div>
    );
  };

export default Leaderboard;