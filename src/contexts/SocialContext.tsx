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

interface SocialContextType {
    registerFriendRequestReceived: (callback: (userId: string, username: string) => void) => void;
    unregisterFriendRequestReceived: (callback: (userId: string, username: string) => void) => void;
    registerFriendRequestAccepted: (callback: (userId: string, username: string) => void) => void;
    unregisterFriendRequestAccepted: (callback: (userId: string, username: string) => void) => void;
    registerFriendsListUpdate: (callback: () => void) => void;
    unregisterFriendsListUpdate: (callback: () => void) => void;
    triggerFriendsListUpdate: () => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const friendRequestReceivedCallbacks = React.useRef<Array<(userId: string, username: string) => void>>([]);
    const friendRequestAcceptedCallbacks = React.useRef<Array<(userId: string, username: string) => void>>([]);
    const friendsListUpdateCallbacks = React.useRef<Array<() => void>>([]);

    const { token } = useAuth();

    // Create a socket reference that persists across renders
    const socketRef = React.useRef<Socket | null>(null);

    useEffect(() => {
        // Wait until the token is available before connecting to the socket
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

        // Handle friend request events
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

        // Handle friends list update events
        socket.on('friend_status_change', () => {
            friendsListUpdateCallbacks.current.forEach(callback => callback());
        });

        socket.on('friend_list_update', () => {
            friendsListUpdateCallbacks.current.forEach(callback => callback());
        });

        socket.on('friend_removed', () => {
            friendsListUpdateCallbacks.current.forEach(callback => callback());
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [token]); // Re-run the effect when the token changes

    // Callback registration methods
    const registerFriendRequestReceived = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Registering friend request received callback');
            friendRequestReceivedCallbacks.current.push(callback);
        },
        []
    );

    const unregisterFriendRequestReceived = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Unregistering friend request received callback');
            friendRequestReceivedCallbacks.current = friendRequestReceivedCallbacks.current.filter(cb => cb !== callback);
        },
        []
    );

    const registerFriendRequestAccepted = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Registering friend request accepted callback');
            friendRequestAcceptedCallbacks.current.push(callback);
        },
        []
    );

    const unregisterFriendRequestAccepted = useCallback(
        (callback: (userId: string, username: string) => void) => {
            console.log('Unregistering friend request accepted callback');
            friendRequestAcceptedCallbacks.current = friendRequestAcceptedCallbacks.current.filter(cb => cb !== callback);
        },
        []
    );

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