import PlayerData from "@/types/PlayerData";

interface LeaderboardItemProps{
    player: PlayerData;
    rank: number;
    isCurrentPlayer: boolean;
    rankChange: 'up' | 'down' | null;
    animation: {points: boolean, invalid: boolean, valid: boolean};
}

const LeaderboardItem = ({ player, rank, isCurrentPlayer, rankChange, animation }: LeaderboardItemProps) => {
    return (
      <div 
        className={`p-2 rounded-lg flex justify-between items-center transition-all duration-300 ${
          isCurrentPlayer 
            ? 'bg-blue-100 border border-blue-300' 
            : 'bg-white border border-gray-200'
        } ${
          rankChange === 'up' 
            ? 'transform -translate-y-2' 
            : rankChange === 'down' 
              ? 'transform translate-y-2' 
              : ''
        } max-sm:p-1`}
      >
        <div className="flex items-center w-3/4 max-sm:w-4/5">
          <span className="text-lg font-bold mr-2 max-sm:text-sm max-sm:mr-1 min-w-5">
            #{rank}
          </span>
          <span className="font-medium text-sm truncate max-sm:text-xs">
            {isCurrentPlayer ? 'You' : player.username}
          </span>
        </div>
        
        <div className={`flex items-center justify-end w-1/4 max-sm:w-1/5 ${
          animation?.points ? 'text-green-600' : ''
        }`}>
          {rankChange === 'up' && (
            <span className="text-green-500 mr-1">▲</span>
          )}
          {rankChange === 'down' && (
            <span className="text-red-500 mr-1">▼</span>
          )}
          <span className="font-bold max-sm:text-sm text-right">
            {player.points}
            {animation?.points && (
              <span className="text-green-500 animate-ping absolute">+1</span>
            )}
          </span>
        </div>
      </div>
    );
  };

export default LeaderboardItem;