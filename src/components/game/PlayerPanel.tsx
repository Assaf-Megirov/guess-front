import { PlayerData } from "@/types/PlayerData";
import DynamicTextarea from "@/components/game/DynamicTextArea";
import WordsList from "./WordsList";
interface PlayerPanelProps {
    player: PlayerData;
    isCurrentPlayer: boolean;
    onWrite: (text: string) => void;
    onMove: (move: string) => Promise<boolean>;
    animation: {valid: boolean, invalid: boolean, points: boolean};
    errorMessage: string | null;
}

const PlayerPanel = ({ 
    player, 
    isCurrentPlayer = false, 
    onWrite, 
    onMove, 
    animation, 
    errorMessage 
  }: PlayerPanelProps) => {
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
          animation?.points ? 'scale-150 text-green-600' : textColor
        }`}>
          {player.points || 0}
          {animation?.points && <span className="animate-ping absolute text-green-500">+1</span>}
        </div>
        {errorMessage && (
          <div className="w-full mb-2 px-2 py-1 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className={`w-full ${animation?.invalid ? 'animate-shake' : ''}`}>
          <DynamicTextarea
            onChange={isCurrentPlayer ? onWrite : () => {}}
            onEnter={isCurrentPlayer ? onMove : undefined}
            placeholder={isCurrentPlayer ? "Type here..." : "Opponent's text"}
            disabled={!isCurrentPlayer}
            value={isCurrentPlayer ? undefined : player.written || ''}
            className={`border-2 ${
              animation?.valid 
                ? 'border-green-500' 
                : animation?.invalid 
                  ? 'border-red-500' 
                  : borderColor
            }`}
          />
        </div>
        
        <div className={`text-2xl font-bold mt-2 mb-2 ${textColor}`}>
          {player.letters || ''}
        </div>
        
        <WordsList words={player.words} isCurrentPlayer={isCurrentPlayer} textColor={textColor} borderColor={borderColor} />
      </div>
    );
  };

export default PlayerPanel;