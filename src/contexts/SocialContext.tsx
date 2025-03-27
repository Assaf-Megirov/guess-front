import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_BASE_SOCKET_URL;

interface FriendRequest {
    type: 'new_request' | 'request_accepted' | 'self_accepted_request';
    from: {
        userId: string;
        username: string;
    };
    timestamp: number;
}

export interface GameInvite {
    senderId: string;
    senderUsername: string;
}

export interface GameInit {
    gameId: string;
    opponents: {
        userId: string;
        username: string;
    }[];
}

interface SocialContextType {
    registerFriendRequestReceived: (callback: (userId: string, username: string) => void) => void;
    unregisterFriendRequestReceived: (callback: (userId: string, username: string) => void) => void;
    registerFriendRequestAccepted: (callback: (userId: string, username: string) => void) => void;
    unregisterFriendRequestAccepted: (callback: (userId: string, username: string) => void) => void;
    registerFriendsListUpdate: (callback: () => void) => void;
    unregisterFriendsListUpdate: (callback: () => void) => void;
    triggerFriendsListUpdate: () => void;
    registerGameInvite: (callback: (userId: string, username: string) => void) => void;
    unregisterGameInvite: (callback: (userId: string, username: string) => void) => void;
    registerGameInit: (callback: (gameInitData: GameInit) => void) => void;
    unregisterGameInit: (callback: (gameInitData: GameInit) => void) => void;
    acceptInvite: (senderId: string) => void;
    sendInvite: (targetId: string) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const friendRequestReceivedCallbacks = React.useRef<Array<(userId: string, username: string) => void>>([]);
    const friendRequestAcceptedCallbacks = React.useRef<Array<(userId: string, username: string) => void>>([]);
    const friendsListUpdateCallbacks = React.useRef<Array<() => void>>([]);
    const gameInviteCallbacks = React.useRef<Array<(userId: string, username: string) => void>>([]);
    const gameInitCallbacks = React.useRef<Array<(gameInitData: GameInit) => void>>([]);

    const { token } = useAuth();
    const socketRef = React.useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) {
            console.log('Token is not available yet. Waiting...');
            return;
        }
        console.log(`Attempting to connect to socket at: ${SOCKET_URL}, with token: ${token}`);
        const socket = io(SOCKET_URL, {
            auth: {
                token: token,
            },
        });
        socketRef.current = socket;

        socket.on('friend_request', (data: FriendRequest) => {
            console.log('Friend request event captured: ', data);
            if (data.type === 'new_request') {
                console.log('new_request');
                console.log(`attempting to invoke ${friendRequestReceivedCallbacks.current.length} callbacks`);
                friendRequestReceivedCallbacks.current.forEach(callback => {
                    callback(data.from.userId, data.from.username);
                    console.log('calling callback for request received', callback);
                });
            } else if (data.type === 'request_accepted') {
                console.log('request_accepted');
                console.log(`attempting to invoke ${friendRequestAcceptedCallbacks.current.length} callbacks`);
                friendRequestAcceptedCallbacks.current.forEach(callback => {
                    callback(data.from.userId, data.from.username);
                    console.log('calling callback for request accepted', callback);
                });
            }
        });

        socket.on('friend_status_change', () => {
            friendsListUpdateCallbacks.current.forEach(callback => callback());
        });

        socket.on('friend_list_update', () => {
            friendsListUpdateCallbacks.current.forEach(callback => callback());
        });

        socket.on('friend_removed', () => {
            friendsListUpdateCallbacks.current.forEach(callback => callback());
        });

        socket.on("game_invite", (data: GameInvite) => {
            console.log('Game invite recieved from: ', data.senderId);
            gameInviteCallbacks.current.forEach(callback => {
                callback(data.senderId, data.senderUsername);
                console.log(`callback called for game invite with data: senderId - ${data.senderId} ; username - ${data.senderUsername}`);
            })
        });

        socket.on("game_init", (data: GameInit) => {
            console.log('Game init recieved for game with: ', data.opponents[0].username);
            gameInitCallbacks.current.forEach(callback => {
                callback(data);
                console.log(`callback called for game init with: `, data);
            })
        });

        return () => {
            socket.disconnect();
        };
    }, [token]);

    const registerFriendRequestReceived = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Registering friend request received callback');
            friendRequestReceivedCallbacks.current.push(callback);
    }, []);

    const unregisterFriendRequestReceived = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Unregistering friend request received callback');
            friendRequestReceivedCallbacks.current = friendRequestReceivedCallbacks.current.filter(cb => cb !== callback);
    }, []);

    const registerFriendRequestAccepted = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Registering friend request accepted callback');
            friendRequestAcceptedCallbacks.current.push(callback);
    }, []);

    const unregisterFriendRequestAccepted = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Unregistering friend request accepted callback');
            friendRequestAcceptedCallbacks.current = friendRequestAcceptedCallbacks.current.filter(cb => cb !== callback);
    }, []);

    const registerFriendsListUpdate = useCallback((callback: () => void) => {
        console.log('Registering friends list update callback');
        friendsListUpdateCallbacks.current.push(callback);
    }, []);

    const unregisterFriendsListUpdate = useCallback((callback: () => void) => {
        console.log('Unregistering friends list update callback');
        friendsListUpdateCallbacks.current = friendsListUpdateCallbacks.current.filter(cb => cb !== callback);
    }, []);

    const triggerFriendsListUpdate = useCallback(() => {
        friendsListUpdateCallbacks.current.forEach(callback => callback());
    }, []);

    const registerGameInvite = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Registering game invite received callback');
            gameInviteCallbacks.current.push(callback);
    }, []);

    const unregisterGameInvite = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Unregistering game invite received callback');
            gameInviteCallbacks.current = gameInviteCallbacks.current.filter(cb => cb !== callback);
    }, []);

    const registerGameInit = useCallback(
        (callback: (gameInitData: GameInit) => void) => {
            console.log('Registering game init callback');
            gameInitCallbacks.current.push(callback);
    }, []);

    const unregisterGameInit = useCallback(
        (callback: (gameInitData: GameInit) => void) => {
            console.log('Unregistering game init callback');
            gameInitCallbacks.current = gameInitCallbacks.current.filter(cb => cb !== callback);
    }, []);

    const sendInvite = useCallback((targetId: string) => {
        if (socketRef.current) {
          socketRef.current.emit('game_invite', { targetId });
          //TODO: expose a function to register to the game_invite_error event
          console.log(`Sent game invite to targetId: ${targetId}`);
        } else {
          console.error("Socket not connected. Cannot send invite.");
        }
    }, []);
    
    const acceptInvite = useCallback((senderId: string) => {
        if (socketRef.current) {
          socketRef.current.emit('game_invite_accept', { senderId });
          console.log(`Accepted game invite from senderId: ${senderId}`);
        } else {
          console.error("Socket not connected. Cannot accept invite.");
        }
    }, []);

    return (
        <SocialContext.Provider
            value={{
                registerFriendRequestReceived,
                unregisterFriendRequestReceived,
                registerFriendRequestAccepted,
                unregisterFriendRequestAccepted,
                registerFriendsListUpdate,
                unregisterFriendsListUpdate,
                triggerFriendsListUpdate,
                registerGameInvite,
                unregisterGameInvite,
                registerGameInit,
                unregisterGameInit,
                acceptInvite,
                sendInvite
            }}
        >
            {children}
        </SocialContext.Provider>
    );
};

export const useSocial = (): SocialContextType => {
    const context = useContext(SocialContext);
    if (!context) {
        throw new Error('useSocial must be used within a SocialProvider');
    }
    return context;
};