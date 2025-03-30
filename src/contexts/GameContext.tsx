import React, { createContext, useState, useContext, use, useEffect, useRef, useCallback } from 'react';
import { GameInit, GameInvite, useSocial } from './SocialContext';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';
import { GameStatus } from '@/types/GameStatus';
import { GameState } from '@/types/GameState';
import { GameResults } from '@/types/GameResults';

const BASE_SOCKET_URL = import.meta.env.VITE_API_BASE_SOCKET_URL;
const GAME_NAMESPACE = import.meta.env.VITE_API_GAME_NAMESPACE;
const SOCKET_URL = `${BASE_SOCKET_URL}/${GAME_NAMESPACE}`;

export type EventName = 'gameStateChanged' | 'opponentMoveInvalid' | 'opponentMoveValid' | 'gameStarted' | 'gameEnded';
export type EventCallback<T> = (data: T) => void;

export interface ValidMoveResponse{
    by: string;
    gameState: GameState
}
export interface InvalidMoveResponse{
    by: string;
    reason: string;
}
export interface MoveResponse{
    success: boolean;
    reason?: string;
}

export interface GameData{
    gameId: string;
    opponents: {
        userId: string;
        username: string;
        letters: string;
        written: string;
        points: number;
        words: string[];
    }[];
    status: GameStatus;
    elapsedTime: number;
}
interface GameContextType{
    gameData: GameData | undefined;
    setGameData: (gameData: GameData) => void;
    gameInitToGameData: (gameInitData: GameInit) => GameData;
    write: (word: string) => void;
    move: (word: string) => Promise<MoveResponse>;
    gameInvites: GameInvite[],
    on: <T,>(eventName: EventName, callback: EventCallback<T>) => () => void;
    gameStarted: boolean;
    connectToGame: () => void;
    cleanContext: () => void;
}
const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gameData, setGameData] = useState<GameData>();
    const [gameInvites, setGameInvites] = useState<GameInvite[]>([]);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [allowConnectToGame, setAllowConnectToGame] = useState<boolean>(false);

    const { registerGameInvite, unregisterGameInvite } = useSocial();
    const { token, user } = useAuth();
    console.log(`GameProvider initialized, user is ${JSON.stringify(user)}, userId is ${user?.id}`);
    const socketRef = React.useRef<Socket | null>(null);

    // Add effect to track user changes
    useEffect(() => {
        console.log('User state changed in GameProvider:', JSON.stringify(user));
    }, [user]);

    const eventListeners = useRef<{
        [key in EventName]: Set<EventCallback<any>>
    }>({
        gameStateChanged: new Set(),
        opponentMoveInvalid: new Set(),
        gameStarted: new Set(),
        opponentMoveValid: new Set(),
        gameEnded: new Set(),
    });
    const on = useCallback(<T,>(eventName: EventName, callback: EventCallback<T>) => {
        eventListeners.current[eventName].add(callback);
        return () => {
            eventListeners.current[eventName].delete(callback);
        };
    }, []);
    const emit = useCallback(<T,>(eventName: EventName, data: T) => {
        eventListeners.current[eventName].forEach(callback => {
            callback(data);
        });
    }, []);

    const handleInvite = (userId: string, username: string) => {
        setGameInvites(prevInvites => [...prevInvites, {senderId: userId, senderUsername: username}]);
    }
    useEffect(() => {
        registerGameInvite(handleInvite);
        return () => unregisterGameInvite(handleInvite);
    }, [registerGameInvite])

    useEffect(() => {
        if (!token || !gameData) {
            console.log('Token or gameData is not available yet. Waiting...');
            return;
        }
        if(!allowConnectToGame){
            console.log('Not allowed to connect to game yet. Waiting for connectToGame to be called...');
            return;
        }
        console.log(`Attempting to connect to socket at: ${SOCKET_URL}, with token: ${token}, gameId: ${gameData?.gameId}`);
        const socket = io(SOCKET_URL, {
            auth: {
                token: token,
                gameId: gameData?.gameId,
            },
        });
        socketRef.current = socket;
        socket.on('game_started', (data: any) => {
            console.log('game_started event received with data: ', data);
            console.log('gameData?.gameId: ', gameData?.gameId);
            if(data.gameId === gameData?.gameId){
                console.log('Game has started');
                gameData.status = GameStatus.InProgress;
                setGameStarted(true);
                emit('gameStarted', data);
                removeGameInvite(gameData.opponents.find(opponent => opponent.userId !== user?.id)?.userId);
            }
        });
        
        socket.on('game_state', (data: GameState) => {
            const playerDataMap = new Map(Object.entries(data.playerData));
            data.playerData = playerDataMap;
        
            console.log(`Data received from server: ${JSON.stringify({
                ...data,
                playerData: Array.from(data.playerData.entries())
            })}`);
            updateGameData(data);
            emit('gameStateChanged', data);
        });

        socket.on('invalid', (data: InvalidMoveResponse) => {
            //here we only have to handle the opponents moves as we handle the users own moves after making a move ourselves
            if(data.by === user?.id) return; //this was our move and it was handled (we assume)
            console.log('Opponent made invalid move with reason: ', data.reason);
            emit('opponentMoveInvalid', data); //data: InvalidMoveResponse
        });

        socket.on('valid', (data: ValidMoveResponse) => {
            if(data.by === user?.id) return; //this was our move and it was handled (we assume)
            console.log('Opponent made valid move');
            emit('opponentMoveValid', data); //data: ValidMoveResponse
        });

        socket.on('game_ended', (results: GameResults) => {
            if(results.gameId !== gameData?.gameId) return;
            console.log('Game ended with results: ', results);
            emit('gameEnded', results);
            //TODO: handle game over (restart the context and wait for fresh data)
        });

        return () => {
            socket.disconnect();
        };
    }, [token, gameData, user, allowConnectToGame]);

    const gameInitToGameData = (gameInitData: GameInit): GameData => {
        console.log('gameInitToGameData called with user:', JSON.stringify(user));
        if(!user) {
            console.error('Cannot create game data: User is not logged in');
            throw new Error('User is not logged in');
        }
        
        const userData = {
            userId: user.id,
            username: user.username,
            points: 0,
            letters: '',
            written: '',
            words: [],
        }
        console.log('Created userData:', JSON.stringify(userData));
        const playerDataMap = gameInitData.opponents.map(opponent => ({
            userId: opponent.userId,
            username: opponent.username,
            points: 0,
            letters: '',
            written: '',
            words: [],
        }))
        playerDataMap.push(userData);
        const res: GameData = {
            gameId: gameInitData.gameId,
            opponents: playerDataMap,
            status: GameStatus.NotStarted,
            elapsedTime: 0,
        }
        return res;
    }

    const write = (word: string) => {
        if(socketRef.current){
            socketRef.current.emit('written', word);
        }else{
            console.log('Socket is not connected');
            throw new Error('attempting to write a word before the game socket is connected');
        }
    }

    const move = (word: string): Promise<MoveResponse> => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) {
                reject(new Error('Socket is not connected'));
                return;
            }
            const handleValid = (data: ValidMoveResponse) => {
                if (data.by === user?.id) {
                    cleanup();
                    resolve({success: true});
                }
            };
            const handleInvalid = (data: InvalidMoveResponse) => {
                if (data.by === user?.id) {
                    cleanup();
                    resolve({success: false, reason: data.reason});
                }
            };
            const cleanup = () => {
                socketRef.current?.off('valid', handleValid);
                socketRef.current?.off('invalid', handleInvalid);
            };
    
            socketRef.current.on('valid', handleValid);
            socketRef.current.on('invalid', handleInvalid);
            socketRef.current.emit('move', word);
    
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Move response timed out'));
            }, 5000);
        });
    }

    const updateGameData = (gameState: GameState) => {
        if(gameState.id !== gameData?.gameId) throw new Error(`gameId mismatch in updateGameData: ${gameState.id} !== ${gameData?.gameId}`);
        gameData.status = gameState.state;
        gameData.elapsedTime = gameState.elapsedTime;
        if(gameState.state === GameStatus.InProgress){
            console.log(`Player data: ${JSON.stringify(gameState.playerData)} ||| of type: ${typeof gameState.playerData}`);
            gameState.playerData.forEach((playerData, playerId) => {
                const opponent = gameData.opponents.find(opponent => opponent.userId === playerId);

                if(!opponent) throw new Error(`could not find opponent with id ${playerId} in updateGameData`);
                opponent.points = playerData.points;
                opponent.letters = playerData.letters;
                opponent.written = playerData.written;
                opponent.words = playerData.words;
            })
        }
    }

    const connectToGame = () => {
        setAllowConnectToGame(true);
        console.log('connectToGame called');
    }

    const cleanContext = () => {
        setGameData(undefined);
        setGameStarted(false);
        setAllowConnectToGame(false);
        socketRef.current?.disconnect();
    }

    const removeGameInvite = (userId: string | undefined) => {
        if(!userId) return;
        setGameInvites(prevInvites => prevInvites.filter(invite => invite.senderId !== userId));
    }

    return (
        <GameContext.Provider value={{gameData, setGameData, gameInitToGameData, write, move, gameInvites, on, gameStarted, connectToGame, cleanContext}}>
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
