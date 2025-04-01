import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import Lobby from './game/Lobby';
import { useGame } from '../contexts/GameContext';
import { GameStatus } from '@/types/GameStatus';
import { useNavigate } from 'react-router-dom';
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
    const [lobby, setLobby] = useState<Lobby | null>(null);
    const lobbyRef = React.useRef<Lobby | null>(null);
    const [gameCode, setGameCode] = useState<string>('');
    const [username, setUsername] = useState<string>('');
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
        socket.on('lobby_state', (lobby: {code: string, players: {playerId: string, username: string, ready: boolean}[], admin: {playerId: string, username: string}}) => {
            console.log(`lobby state: ${JSON.stringify(lobby)}`);
            const newLobby = {code: lobby.code, players: lobby.players.map(player => ({id: player.playerId, username: player.username, ready: player.ready})), admin: {id: lobby.admin.playerId, username: lobby.admin.username}};
            setLobby(newLobby);
            lobbyRef.current = newLobby;
        });
        socket.on('start_game', (data: {gameId: string}) => {
            const {gameId} = data;
            const currentLobby = lobbyRef.current;
            console.log(`lobby from ref: ${JSON.stringify(currentLobby)}`);
            console.log(`lobby.players mapped to opponents: ${JSON.stringify(currentLobby?.players.map(player => ({userId: player.id, username: player.username, letters: '', written: '', points: 0, words: []})))}`);
            setGameData({gameId: gameId, opponents: currentLobby?.players.map(player => ({userId: player.id, username: player.username, letters: '', written: '', points: 0, words: []})) || [], status: GameStatus.NotStarted, elapsedTime: 0});
            connectToGame();
            console.log(`Game started: ${JSON.stringify(data, null, 2)}`);
            navigate('/game');
        });

        return () => {
            socket.disconnect();
        };
    }, [guestId, user]);

    useEffect(() => {
        const storedGameCode = localStorage.getItem('lobbyCode');
        const storedUsername = localStorage.getItem('username');
        if(storedGameCode && storedUsername){
            setGameCode(storedGameCode);
            setUsername(storedUsername);
            // Wait for socket to be ready before joining
            if(socketRef.current) {
                joinGame(storedGameCode, storedUsername);
            } else {
                // If socket isn't ready yet, wait for it
                const checkSocket = setInterval(() => {
                    if(socketRef.current) {
                        joinGame(storedGameCode, storedUsername);
                        clearInterval(checkSocket);
                    }
                }, 100);
            }
        }
    }, []);

    const createGame = () => {
        console.log('create game called');
        const socket = socketRef.current;
        if(!socket){
            console.error('Socket not initialized');
            return;
        }
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
        socket.on('joined_lobby', ({code, players, admin}: {code: string, players: {playerId: string, username: string, ready: boolean}[], admin: {id: string, username: string}}) => {
            setLobby({code, players: players.map(player => ({id: player.playerId, username: player.username, ready: player.ready})), admin});
            localStorage.setItem('lobbyCode', code);
            localStorage.setItem('username', username);
        });
        socket.on('invalid_lobby_code', ({code}: {code: string}) => {
            console.error(`Invalid lobby code: ${code}`);
            setLobby(null);
            //TODO: show error message to the user
        });
        socket.on('lobby_not_found', ({code}: {code: string}) => {
            console.error(`Lobby not found: ${code}`);
            setLobby(null);
            //TODO: show error message to the user
        });
        
        const codeToUse = codeOverride || gameCode;
        const usernameToUse = usernameOverride || (isGuest ? username : user?.username);
        console.log(`username state: ${username}`);
        console.log(`joining lobby with code: ${codeToUse} and username: ${usernameToUse}`);
        socket.emit('join_lobby', {
            code: codeToUse,
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
        const playerId = isGuest ? guestId : user?.id;
        socket.emit('start_game', {code: lobby?.code, playerId: playerId});
    }
    if(lobby){
        const userId = isGuest ? guestId : user?.id;
        if (!userId) return null;
        return <Lobby lobby={lobby} userId={userId} onReady={onReady} onUnready={onUnready} onStart={onStart} />
    }
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-8">Index</h1>
        <input
                type="text"
                placeholder="Enter username"
                className="w-64 px-4 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
        <div className="flex flex-col items-center space-y-6">
            <button
            onClick={createGame}
            className="w-48 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md transition-colors"
            > Create Game </button>
            <div className="flex flex-col items-center">
            <input
                type="text"
                placeholder="Enter Game Code"
                className="w-64 px-4 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
            />
            <button
                onClick={() => joinGame()}
                className="w-48 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md transition-colors"
            > Join Game </button>
            </div>
        </div>
        </div>
    );
};

export default Index;
