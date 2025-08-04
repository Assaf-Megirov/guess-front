import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import Lobby from './game/Lobby';
import { useGame } from '../contexts/GameContext';
import { GameStatus } from '@/types/GameStatus';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GameSettings } from './game/GameSettingsMenu';
import Header from './Header';
const BASE_SOCKET_URL = import.meta.env.VITE_API_BASE_SOCKET_URL;
const LOBBY_NAMESPACE = import.meta.env.VITE_API_LOBBY_NAMESPACE;
const SOCKET_URL = `${BASE_SOCKET_URL}/${LOBBY_NAMESPACE}`;

interface LobbyPlayer {
    id: string;
    username: string;
    ready: boolean;
}
interface Lobby {
    code: string;
    players: LobbyPlayer[];
    admin: {id: string; username: string};
}

interface IndexProps {
}

const Index: React.FC<IndexProps> = () => {
    const socketRef = React.useRef<Socket | null>(null);
    const [socketConnected, setSocketConnected] = useState<boolean>(false);
    const [lobby, setLobby] = useState<Lobby | null>(null);
    const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
    const lobbyRef = React.useRef<Lobby | null>(null);
    const [gameCode, setGameCode] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [lobbyError, setLobbyError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const { guestId, isAuthenticated, user } = useAuth();
    const { setGameData, connectToGame } = useGame();
    const navigate = useNavigate();
    const isGuest = !isAuthenticated && !!guestId;

    useEffect(() => {
        console.log(`isGuest: ${isGuest} guestId: ${guestId} user: ${user}`);
        if(!guestId && !user){
            console.log('No user or guestId found! waiting for user to login or guestId to be set');
            return;
        }
        const playerId = isGuest ? guestId : user?.id;
        console.log(`attempting to connect with player ID: ${playerId} to socket: ${SOCKET_URL}`);
        const socket = io(SOCKET_URL, {
            auth: {
                playerId,
            },
        });
        socketRef.current = socket;
        socket.on('connect', () => {
            console.log('socket connected');
            setSocketConnected(true);
        });
        socket.on('lobby_state', (lobby: {code: string, players: {playerId: string, username: string, ready: boolean}[], admin: {playerId: string, username: string}, gameSettings: GameSettings}) => {
            console.log(`lobby state: ${JSON.stringify(lobby)}`);
            const newLobby = {code: lobby.code, players: lobby.players.map(player => ({id: player.playerId, username: player.username, ready: player.ready})), admin: {id: lobby.admin.playerId, username: lobby.admin.username}};
            setLobby(newLobby);
            lobbyRef.current = newLobby;
            setGameSettings(lobby.gameSettings);
        });
        socket.on('start_game', (data: {gameId: string}) => {
            const {gameId} = data;
            const currentLobby = lobbyRef.current;
            console.log(`lobby from ref: ${JSON.stringify(currentLobby)}`);
            console.log(`lobby.players mapped to opponents: ${JSON.stringify(currentLobby?.players.map(player => ({userId: player.id, username: player.username, letters: '', written: '', points: 0, words: [], isPlaying: false})))}`);
            setGameData({gameId: gameId, opponents: currentLobby?.players.map(player => ({userId: player.id, username: player.username, letters: '', written: '', points: 0, words: [], isPlaying: false})) || [], status: GameStatus.NotStarted, elapsedTime: 0});
            connectToGame();
            console.log(`Game started: ${JSON.stringify(data, null, 2)}`);
            navigate('/game');
        });
        socket.on('disconnect', () => {
            console.log('socket disconnected');
            setSocketConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [guestId, user, isGuest, setGameData, connectToGame, navigate]);

    useEffect(() => {
        const storedGameCode = localStorage.getItem('lobbyCode');
        const storedUsername = localStorage.getItem('username');
        if(storedGameCode && storedUsername){
            setGameCode(storedGameCode);
            setUsername(storedUsername);
            const checkSocketConnection = setInterval(() => {
                if(socketRef.current && socketConnected) {
                    console.log('Socket is connected, attempting to rejoin game');
                    joinGame(storedGameCode, storedUsername);
                    clearInterval(checkSocketConnection);
                }
            }, 250);
            return () => clearInterval(checkSocketConnection);
        }
        if(storedUsername){
            setUsername(storedUsername);
        }
    }, [socketConnected]);

    const createGame = () => {
        console.log('create game called');
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
        if(!socket.connected){
            toast.error('We had trouble connecting to the server, please try again later');
            return;
        }
        if(!username){
            setUsernameError('Please enter a username');
            return;
        }
        setUsernameError(null);
        socket.on('lobby_created', ({code}: {code: string}) => {
            setGameCode(code);
            joinGame(code);
        });
        socket.emit('create_lobby', {username: isGuest ? username : user?.username});
    }
    const joinGame = (codeOverride?: string, usernameOverride?: string) => {
        console.log('join game called');
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
        if(!socket.connected){
            //try to reconnect
            console.log('socket not connected, attempting to reconnect');
            socket.connect();
            const onConnect = () => {
                socket.off('connect', onConnect);
                const codeToUse = codeOverride || gameCode;
                const usernameToUse = usernameOverride || (isGuest ? username : user?.username);
                console.log(`Socket connected, joining lobby with code: ${codeToUse} and username: ${usernameToUse}`);
                socket.emit('join_lobby', {
                    code: codeToUse.toLowerCase(),
                    username: usernameToUse,
                });
            }
            socket.on('connect', onConnect);
            if(!socket.connected){
                toast.error('We had trouble connecting to the server, please try again later');
                return;
            }
            setTimeout(() => {
                if(!socket.connected) {
                    socket.off('connect', onConnect);
                    toast.error('We had trouble connecting to the server, please try again later');
                }
            }, 3000);
        }
        if(!username){
            setUsernameError('Please enter a username');
            return;
        }
        setUsernameError(null);
        socket.on('joined_lobby', ({code, players, admin}: {code: string, players: {playerId: string, username: string, ready: boolean}[], admin: {id: string, username: string}}) => {
            setLobby({code, players: players.map(player => ({id: player.playerId, username: player.username, ready: player.ready})), admin});
            localStorage.setItem('lobbyCode', code);
            localStorage.setItem('username', username);
            setLobbyError(null);
        });
        socket.on('invalid_lobby_code', ({code}: {code: string}) => {
            console.error(`Invalid lobby code: ${code}`);
            setLobby(null);
            setLobbyError(`lobby code is invalid, codes can only be letters and numbers and only 4 characters long`);
        });
        socket.on('lobby_not_found', ({code}: {code: string}) => {
            console.error(`Lobby not found: ${code}`);
            setLobby(null);
            setLobbyError(`lobby not found, please check the code and try again`);
        });
        
        const codeToUse = codeOverride || gameCode;
        const usernameToUse = usernameOverride || (isGuest ? username : user?.username);
        console.log(`username state: ${username}`);
        console.log(`joining lobby with code: ${codeToUse} and username: ${usernameToUse}`);
        socket.emit('join_lobby', {
            code: codeToUse.toLowerCase(),
            username: usernameToUse,
        });
    }

    const onReady = () => { 
        console.log('ready');
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
        const playerId = isGuest ? guestId : user?.id;
        socket.emit('ready', {code: lobby?.code, playerId: playerId});
    }
    const onUnready = () => {
        console.log('unready');
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
        const playerId = isGuest ? guestId : user?.id;
        socket.emit('unready', {code: lobby?.code, playerId: playerId});
    }
    const onStart = () => {
        console.log('start');
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
        socket.on('not_enough_players', () => {
            toast.error('Not enough players to start the game, you can leave the lobby and play alone');
        });
        const playerId = isGuest ? guestId : user?.id;
        socket.emit('start_game', {code: lobby?.code, playerId: playerId});
    }
    const onLeave = () => {
        console.log('leave');
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
        const playerId = isGuest ? guestId : user?.id;
        socket.emit('leave_lobby', {code: lobby?.code, playerId: playerId});
        setLobby(null);
        localStorage.removeItem('lobbyCode');
    }

    const onGameSettingsChange = (newSettings: GameSettings) => {
        console.log('game settings changed:', newSettings);
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
        socket.emit('set_game_settings', {
            code: lobby?.code,
            playerId: isGuest ? guestId : user?.id,
            gameSettings: newSettings
        });
        setGameSettings(newSettings);
    }
    
    if(lobby){
        const userId = isGuest ? guestId : user?.id;
        if (!userId) return null;
        return <Lobby 
            lobby={lobby} 
            userId={userId} 
            onReady={onReady} 
            onUnready={onUnready} 
            onStart={onStart} 
            onLeave={onLeave}
            gameSettings={gameSettings}
            onGameSettingsChange={onGameSettingsChange}
        />
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="mb-4 text-center text-2xl font-bold">
        you can also <a href="/singleGame" className="text-blue-500 underline">play alone</a>
        </p>
        <h1 className="text-4xl font-bold mb-8">Index</h1>
        {usernameError && (
          <div className="w-64 mb-1">
            <div className="flex items-start gap-1">
              <span className="text-[8px] mt-1 flex-shrink-0">•</span>
              <span className="text-red-500 text-xs flex-1 break-words whitespace-normal">
                {usernameError}
              </span>
            </div>
          </div>
        )}
        <input
                type="text"
                placeholder="Enter username"
                className={`w-64 px-4 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  usernameError ? 'border-red-500' : 'border-gray-300'
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
        <div className="flex flex-col items-center space-y-6">
            <button
            onClick={createGame}
            className="w-48 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md transition-colors"
            > Create Game </button>
            <div className="flex flex-col items-center">
            {lobbyError && (
              <div className="w-64 mb-1">
                <div className="flex items-start gap-1">
                  <span className="text-[8px] mt-1 flex-shrink-0">•</span>
                  <span className="text-red-500 text-xs flex-1 break-words whitespace-normal">
                    {lobbyError}
                  </span>
                </div>
              </div>
            )}
            <input
                type="text"
                placeholder="Enter Game Code"
                className={`w-64 px-4 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  lobbyError ? 'border-red-500' : 'border-gray-300'
                }`}
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
            />
            <button
                onClick={() => joinGame()}
                className="w-48 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md transition-colors"
            > Join Game </button>
            </div>
        </div>
        <Header />
        </div>
    );
};

export default Index;
