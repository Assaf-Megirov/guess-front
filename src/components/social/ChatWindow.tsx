import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { Link } from 'react-router-dom';
import { getFriends } from '@/api/friends';

import { User } from '@/types/User';
const ChatWindow: React.FC = () => {
    const { chat, chats, messages, sendMessage, isOpen, setIsOpen, typing, setTyping, otherIsTyping, chatWith } = useChat();
    const { user, isAuthenticated, token } = useAuth();
    const { registerFriendsListUpdate, unregisterFriendsListUpdate } = useSocial();
    const [friends, setFriends] = useState<User[]>([]);
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [showSidebar, setShowSidebar] = useState(false);
    const typingTimer = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (messageText.trim() && chat) {
            await sendMessage(messageText.trim());
            setMessageText('');
        }
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        const text = e.currentTarget.value;
        if (text.trim()) {
          if (!typing) {
            setTyping(true);
          }

          typingTimer.current && clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => {
            setTyping(false);
          }, 1000);
        } else if (typing) {
          setTyping(false); //if there was a change and it is empty, stop typing
        }
      };
    
      useEffect(() => {
        return () => { //clear the timer when the component unmounts
          typingTimer.current && clearTimeout(typingTimer.current);
        };
      }, []);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        //if enter key is pressed and shift key is not pressed, and the chat window is in focus, send the message
        if (e.key === 'Enter' && !e.shiftKey && chatWindowRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        const startX = e.clientX - position.x;
        const startY = e.clientY - position.y;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - startX,
                y: e.clientY - startY
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const friendsListUpdate = async () => {
        console.log('friendsListUpdate');
        if(!token) return;
        const friendsIncoming = await getFriends(token);
        const friendsIncomingMapped = friendsIncoming.map((incomingFriend: any) => { //this is only to map the _id property to id
            const friend = {
                id: incomingFriend._id,
                username: incomingFriend.username,
                email: incomingFriend.email,
                avatar: incomingFriend.avatar || 'none',
                isOnline: incomingFriend.isOnline || false,
                lastActive: incomingFriend.lastActive,
            }
            return friend;
        });
        setFriends(friendsIncomingMapped);
        console.log("friends in friends list update", friendsIncomingMapped);
    };

    const getFriendsWithoutChats = () => {
        return friends.filter(friend => !chats.some(chat => chat.participants.some(participant => participant._id === friend.id)));
    };

    const getFriendsWithChats = () => {
        console.log("chats at getfriendsWithChats", chats);
        console.log("friends at getfriendsWithChats", friends);
        console.log("getfriendsWithChats called, returning", friends.filter(friend => chats.some(chat => chat.participants.some(participant => participant._id === friend.id))));
        return friends.filter(friend => chats.some(chat => chat.participants.some(participant => participant._id === friend.id)));
    };

    const handleFriendClick = (friend: User) => {
        console.log("friend clicked", friend);
        chatWith(friend);
    };

    useEffect(() => {
        registerFriendsListUpdate(friendsListUpdate);
        friendsListUpdate();
        return () => {
            unregisterFriendsListUpdate(friendsListUpdate);
        };
    }, [token]);

    useEffect(() => {
        console.log("friends in chat window", friends);
    }, [friends]);

    useEffect(() => {
        console.log("chats in chat window", chats);
    }, [chats]);

    const totalUnreadCount = chats.reduce((total, chat) => total + chat.unreadCount, 0);

    if (!isOpen) { //chat is closed
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50 relative"
                title="Open Chat"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {totalUnreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border-2 border-white">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </div>
                )}
            </button>
        );
    }

    if (!isAuthenticated) { //non-authenticated user
        return (
            <div 
                className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
            >
                {/* Header */}
                <div 
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg cursor-move"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold text-sm">Chat</div>
                            <div className="text-xs opacity-75">Login to start chatting</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Login Prompt */}
                <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Login Required</h3>
                        <p className="text-gray-600 mb-4">Please log in to start chatting with friends</p>
                        <Link 
                            to="/auth"
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Login Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const friendsWithChats = getFriendsWithChats();
    const friendsWithoutChats = getFriendsWithoutChats();

    const renderFriendItem = (friend: User, hasChat: boolean = false, unreadMessageCount: number = 0) => (
        <div
            key={friend.id}
            onClick={() => handleFriendClick(friend)}
            className="flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
        >
            <div className="relative flex-shrink-0">
                {friend.avatar && friend.avatar !== 'none' ? (
                    <img 
                        src={friend.avatar} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-black"></div>
                )}
                {hasChat && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white">
                    </div>  
                )}
            </div>
            <div className="ml-3 flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                    {friend.username}
                </div>
                <div className="text-xs text-gray-500">
                    {hasChat ? (
                        unreadMessageCount > 0 ? 
                            `${unreadMessageCount} unread message${unreadMessageCount > 1 ? 's' : ''}` : 
                            'Active chat'
                    ) : 'Start chatting'}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-end space-x-2">
            {/* Sidebar */}
            {showSidebar && (
                <div className="w-64 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-t-lg border-b border-gray-200">
                        <div className="font-semibold text-sm text-gray-800">Friends</div>
                        <button 
                            onClick={() => setShowSidebar(false)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Friends with active chats */}
                        {friendsWithChats.length > 0 && (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                                    ACTIVE CHATS ({friendsWithChats.length})
                                </div>
                                {friendsWithChats.map(friend => renderFriendItem(friend, true, chats.find(chat => chat.participants.some(participant => participant._id === friend.id))?.unreadCount || 0))}
                            </div>
                        )}
                        
                        {/* Separator */}
                        {friendsWithChats.length > 0 && friendsWithoutChats.length > 0 && (
                            <div className="border-t-2 border-gray-200 mx-3"></div>
                        )}
                        
                        {/* Friends without chats */}
                        {friendsWithoutChats.length > 0 && (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                                    ALL FRIENDS ({friendsWithoutChats.length})
                                </div>
                                {friendsWithoutChats.map(friend => renderFriendItem(friend, false))}
                            </div>
                        )}
                        
                        {/* No friends message */}
                        {friends.length === 0 && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center">
                                    <div className="text-gray-400 mb-2">
                                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-sm text-gray-500">No friends yet</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Chat Window */}
            <div 
                ref={chatWindowRef}
                className="w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
            >
                {/* Header */}
                <div 
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg cursor-move"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center space-x-2">
                        {/* Friends list toggle button*/}
                        <button 
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="text-white hover:text-gray-200 transition-colors p-1"
                            title="Toggle Friends List"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        {chat ? (
                            <>
                                <div className="relative">
                                    {chat.participants.find(p => p._id !== user?.id)?.avatar && 
                                     chat.participants.find(p => p._id !== user?.id)?.avatar !== 'none' ? (
                                        <img 
                                            src={chat.participants.find(p => p._id !== user?.id)?.avatar} 
                                            alt="Avatar" 
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-black"></div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">
                                        {chat.participants.find(p => p._id !== user?.id)?.username || 'Unknown User'}
                                    </div>
                                    <div className="text-xs opacity-75">Online</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">Chat</div>
                                    <div className="text-xs opacity-75">Select a friend to start chatting</div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        {otherIsTyping && (
                            <div className="text-xs opacity-75">Typing...</div>
                        )}
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages Container or No Chat Selected */}
                {chat ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
                            <div className="space-y-3">
                                {messages.map((message) => {
                                    const isOwnMessage = message.sender._id === user?.id;
                                    return (
                                        <div 
                                            key={message._id} 
                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div 
                                                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                                    isOwnMessage 
                                                        ? 'bg-blue-500 text-white rounded-br-none' 
                                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                                                }`}
                                            >
                                                <div className="text-sm">{message.content}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-xs ${
                                                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                        {new Date(message.createdAt).toLocaleTimeString([], { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </div>
                                                    {/* Read by */}
                                                    <div className="text-xs text-black">
                                                        {/* if the message is read by the other user, show the read by */}
                                                        {message.sender._id === user?.id ? (
                                                            message.readBy.some(reader => reader.user._id === chat?.participants.find(p => p._id !== user?.id)?._id) ? '✓✓' : '✓'
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-200 rounded-b-lg">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    onInput={handleInput}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Chat Selected</h3>
                            <p className="text-gray-600 mb-3">Select a friend from your friends list to start chatting</p>
                            <button 
                                onClick={() => setShowSidebar(true)}
                                className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                View Friends
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;