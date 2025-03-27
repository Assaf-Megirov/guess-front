import { createContext, useState, useContext, use, useEffect } from 'react';
import { GameInit, GameInvite, useSocial } from './SocialContext';

export interface GameData{
    gameId: string;
    opponents: {
        userId: string;
        username: string;
    }[];
}
interface GameContextType{
    gameData: GameData | undefined;
    setGameData: (gameData: GameData) => void;
    gameInitToGameData: (gameInitData: GameInit) => GameData;
    gameInvites: GameInvite[],
}
const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gameData, setGameData] = useState<GameData>();
    const [gameInvites, setGameInvites] = useState<GameInvite[]>([]);

    const { registerGameInvite, unregisterGameInvite } = useSocial();

    const handleInvite = (userId: string, username: string) => {
        setGameInvites(prevInvites => [...prevInvites, {senderId: userId, senderUsername: username}]);
    }
    useEffect(() => {
        registerGameInvite(handleInvite);
        return () => unregisterGameInvite(handleInvite);
    }, [registerGameInvite])

    const gameInitToGameData = (gameInitData: GameInit): GameData => {
        const res: GameData = {
            gameId: gameInitData.gameId,
            opponents: gameInitData.opponents.map(opponent => ({
                userId: opponent.userId,
                username: opponent.username,
              }))
        }
        return res;
    }

    return (
        <GameContext.Provider value={{gameData, setGameData, gameInitToGameData, gameInvites}}>
        {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if(!context){
        throw new Error('useGame must be used inside a GameProvider.');
    }
    return context;
}

export default GameContext;
