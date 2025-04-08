import { PlayerData } from "@/types/PlayerData";
import PlayerError from "@/types/PlayerErrors";
import AnimationState from "@/types/AnimationState";
import PlayerPanel from "./PlayerPanel";
import Leaderboard from "./LeaderBoard";

interface GameContentProps{
    currentPlayer: PlayerData;
    opponents: PlayerData[];
    useSidebar: boolean;
    totalPlayers: number;
    handleWrite: (text: string) => void;
    handleMove: (move: string) => Promise<boolean>;
    animation: AnimationState;
    playerErrors: PlayerError;
    rankChanges: {[playerId: string]: 'up' | 'down' | null};
}

const getPlayerWidthClass = (totalPlayers: number, index: number, opponentsLength: number) => {
    if (totalPlayers <= 4) {
      return 'w-1/2 border-b border-r border-gray-300';
    } 
    else {
      const isLastOpponent = index === opponentsLength - 1;
      return `w-full border-b ${isLastOpponent ? '' : 'border-r'} border-gray-300`;
    }
  };

const GameContent = ({ 
    currentPlayer, 
    opponents, 
    useSidebar, 
    totalPlayers, 
    handleWrite, 
    handleMove, 
    animation, 
    playerErrors, 
    rankChanges 
  }: GameContentProps) => {
    return (
      <>
        <div className={`flex flex-wrap pt-16 ${useSidebar ? 'w-3/4 max-sm:w-3/5' : 'w-full'}`}>
          {currentPlayer && (
            <div className={getPlayerWidthClass(totalPlayers, 0, opponents.length)}>
              <PlayerPanel 
                player={currentPlayer} 
                isCurrentPlayer={true}
                onWrite={handleWrite}
                onMove={handleMove}
                animation={animation[currentPlayer.id]}
                errorMessage={playerErrors[currentPlayer.id]}
              />
            </div>
          )}
          
          {opponents
            .slice(0, useSidebar ? 3 : opponents.length)
            .map((opponent, index) => (
              <div key={opponent.id} className={getPlayerWidthClass(totalPlayers, index, opponents.length)}>
                <PlayerPanel 
                  player={opponent}
                  isCurrentPlayer={false}
                  onWrite={() => {}}
                  onMove={handleMove}
                  animation={animation[opponent.id]}
                  errorMessage={playerErrors[opponent.id]}
                />
              </div>
            ))}
        </div>
        
        {useSidebar && <Leaderboard players={[currentPlayer, ...opponents]} animation={animation} rankChanges={rankChanges} userId={currentPlayer?.id} />}
      </>
    );
  };

export default GameContent;