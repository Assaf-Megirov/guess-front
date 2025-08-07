import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getChats, getChatMessages } from '@/api/chats';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/User';
import { io, Socket } from 'socket.io-client';
const BASE_SOCKET_URL = import.meta.env.VITE_API_BASE_SOCKET_URL;
const CHAT_NAMESPACE = import.meta.env.VITE_API_CHAT_NAMESPACE;
const SOCKET_URL = `${BASE_SOCKET_URL}/${CHAT_NAMESPACE}`;

export interface Message {
    _id: string;
    chatId: string;
    sender: {
        _id: string;
        username: string;
        avatar: string;
    };
    content: string;
    messageType: string;
    fileUrl?: string;
    fileName?: string;
    readBy: {
        user: {
            _id: string;
            username: string;
        };
        readAt: Date;
    }[];
    edited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Chat {
    _id: string;
    participants: {
        _id: string;
        username: string;
        email: string;
        avatar: string;
    }[];
    lastMessage?: {
        content: string;
        sender: {
            _id: string;
            username: string;
            email: string;
            avatar: string;
        };
        timestamp: Date;
    };
    messageCount: number;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PopulatedMessage{
    _id: string;
    chatId: Chat;
    sender: {
        _id: string;
        username: string;
        avatar: string;
    };
    content: string;
    messageType: string;
    fileUrl?: string;
    fileName?: string;
    readBy: {
        user: {
            _id: string;
            username: string;
        };
        readAt: Date;
    }[];
    edited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface ChatContextType {
    chats: Chat[];
    setChats: (chats: Chat[]) => void;
    chat: Chat | null; //the current chat
    selectChat: (chatId: string) => void;
    chatWith: (friend: User) => void;
    messages: Message[]; //the messages in the current chat
    setMessages: (messages: Message[]) => void;
    typing: boolean;
    setTyping: (typing: boolean) => void;
    otherIsTyping: boolean;
    setOtherIsTyping: (otherIsTyping: boolean) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    error: any;
    setError: (error: any) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    sendMessage: (message: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [typing, setTyping] = useState(false);
    const [otherIsTyping, setOtherIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(true);
    const { token } = useAuth();

    const socketRef = useRef<Socket | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const chatsRef = useRef<Chat[]>([]);
    const userId = useAuth().user?.id;

    useEffect(() => {
        const fetchChats = async () => {
            console.log('fetching chats');
            if(!token) return;
            try {
                setIsLoading(true);
                setError(null);
                const chats = await getChats(token);
                setChats(chats);
                chatsRef.current = chats;
            } catch (err) {
                setError(err);
                console.error('Error fetching chats:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchChats();
    }, [token]);

    useEffect(() => {
        //whenever the current chat changes, we need to fetch the messages
        if(!chat) return;
        
        let isMounted = true;
        const currentChatId = chat._id;
        
        const fetchMessages = async () => {
            if(!token) return;
            if(!chat) return;
            
            try {
                setIsLoading(true);
                setError(null);
                console.log('Fetching messages for chat:', currentChatId);
                const incomingMessages = await getChatMessages(token, currentChatId);
                if (isMounted && chatRef.current?._id === currentChatId) {
                    console.log('Setting messages for chat:', currentChatId, 'count:', incomingMessages.length);
                    setMessages(incomingMessages);
                    console.log('incomingMessages', incomingMessages);
                    const unreadMessages = incomingMessages.filter(
                        (message: Message) => message.sender._id !== userId && 
                        !message.readBy.some((read: { user: { _id: string } }) => read.user._id === userId)
                    );
                    if (unreadMessages.length > 0) {
                        markMessagesAsRead(token, unreadMessages);
                    }
                } else {
                    console.log('Chat changed during fetch, discarding messages for:', currentChatId);
                }
            } catch (err) {
                if (isMounted && chatRef.current?._id === currentChatId) {
                    setError(err);
                    console.error('Error fetching messages:', err);
                }
            } finally {
                if (isMounted && chatRef.current?._id === currentChatId) {
                    setIsLoading(false);
                }
            }
        }
        
        fetchMessages();
        
        return () => {
            isMounted = false;
        };
    }, [chat, token]);

    useEffect(() => {
        if(!token) return;
        
        const socket = io(SOCKET_URL, {
            auth: { token }
        });
    
        socket.on('message_received', (message: PopulatedMessage) => {
            debugMessageFlow('message_received', message);
            setMessages(prevMessages => {
                console.log('message.chatId', message.chatId);
                const currentChat = chatRef.current;
                console.log('currentChat?._id', currentChat?._id);
                //if the message is for the current chat or the current chat is a temp chat and the message is for the same participants
                if(message.chatId._id === currentChat?._id || (currentChat?._id === 'temp' && message.chatId.participants.every(participant => currentChat?.participants.some(p => p._id === participant._id)))) {
                    if(!prevMessages.some(m => m._id === message._id)) {
                        console.log('Adding message to current chat:', message.content.substring(0, 50));
                        if(currentChat?._id === 'temp') { //if we dont have the chat yet, set it before returning
                            console.log('setting chat to', message.chatId);
                            setChat(message.chatId);
                        }
                        markMessagesAsRead(token, [populatedMessageToMessage(message)]); //mark the message as read as its for the current chat
                        return [...prevMessages, populatedMessageToMessage(message)];
                    } else {
                        console.log('Message already exists, skipping:', message._id);
                    }
                    if(currentChat?._id === 'temp') { //TODO: remove?
                        setChat(message.chatId);
                        //chats should be fetched in the useEffect that depends on chat because chat is changed here
                    }
                } else {
                    console.log('Message not for current chat, ignoring:', message.chatId, 'vs', currentChat?._id);
                    //refetch chats, in case the chat is not open yet thus the chat will be undefined and not temp
                    const fetchChats = async () => {
                        if(!token) return;
                        try {
                            const chats = await getChats(token);
                            setChats(chats);
                        } catch (err) {
                            console.error('Error fetching chats:', err);
                        }
                    };
                    fetchChats();
                }
                return prevMessages;
            });
        });
    
        socket.on('message_sent', (message: PopulatedMessage) => {
            debugMessageFlow('message_sent', message);
            setMessages(prevMessages => {
                const currentChat = chatRef.current;
                //if the message is for the current chat or the current chat is a temp chat and the message is for the same participants
                if(message.chatId._id === currentChat?._id || (currentChat?._id === 'temp' && message.chatId.participants.every(participant => currentChat?.participants.some(p => p._id === participant._id)))) {
                    if(!prevMessages.some(m => m._id === message._id)) {
                        console.log('Adding sent message to current chat:', message.content.substring(0, 50));
                        if(currentChat?._id === 'temp') { //if we dont have the chat yet, set it before returning
                            console.log('setting chat to', message.chatId);
                            setChat(message.chatId);
                        }
                        return [...prevMessages, populatedMessageToMessage(message)];
                    } else {
                        console.log('Sent message already exists, skipping:', message._id);
                    }
                    console.log('currentChat?._id', currentChat?._id);
                    if(currentChat?._id === 'temp') { //TODO: remove?
                        console.log('setting chat to', message.chatId);
                        setChat(message.chatId);
                        //chats should be fetched in the useEffect that depends on chat because chat is changed here
                    }
                } else {
                    console.log('Sent message not for current chat, ignoring:', message.chatId, 'vs', currentChat?._id);
                    //refetch chats, in case the chat is not open yet thus the chat will be undefined and not temp
                    const fetchChats = async () => {
                        if(!token) return;
                        try {
                            const chats = await getChats(token);
                            setChats(chats);
                        } catch (err) {
                            console.error('Error fetching chats:', err);
                        }
                    };
                    fetchChats();
                }
                return prevMessages;
            });
        });

        socket.on('friend_typing', (data: { userId: string }) => {
            console.log('friend_typing', data.userId);
            console.log('chatRef.current', chatRef.current);
            console.log('chatRef.current?.participants.find(participant => participant._id !== userId)?._id', chatRef.current?.participants.find(participant => participant._id !== userId)?._id);

            if(data.userId === chatRef.current?.participants.find(participant => participant._id !== userId)?._id) {
                setOtherIsTyping(true);
            }
        });

        socket.on('friend_stopped_typing', (data: { userId: string }) => {
            console.log('friend_stopped_typing', data.userId);
            if(data.userId === chatRef.current?.participants.find(participant => participant._id !== userId)?._id) {
                setOtherIsTyping(false);
            }
        });

        socket.on('message_read', (data: { messageId: string, readBy: string }) => {
            console.log('message_read', data);
            //mark the message as read and make sure to trigger a re-render of all clients of the messsages state
            setMessages(prevMessages => prevMessages.map(message => 
                message._id === data.messageId ? { ...message, readBy: [...message.readBy, { user: { _id: data.readBy, username: '' }, readAt: new Date() }] } : message
            ));
        });
    
        socketRef.current = socket;
    
        return () => {
            socket.disconnect();
        }
    }, [token]);

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                console.log('Cleaning up socket connection');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const sendMessage = async (message: string) => {
        if(!token) return;
        if(!chat) return;
        
        try {
            setError(null);
            socketRef.current?.emit('send_message', { 
                friendId: chat.participants.find(participant => participant._id !== userId)?._id, 
                message 
            });
        } catch (err) {
            setError(err);
            console.error('Error sending message:', err);
        }
    }

    const selectChat = (chatId: string) => {
        const chat = chats.find(chat => chat._id === chatId);
        if(!chat) return;
        
        debugMessageFlow('selectChat', { chatId, participants: chat.participants.map(p => p.username) });
        setChat(chat);
        setMessages([]);
        setIsOpen(true);
    }

    const chatWith = (friend: User) => {
        const existingChat = chatsRef.current.find(chat => chat.participants.some(participant => participant._id === friend.id)); //using ref to avoid stale closure
        console.log('chatsRef.current', chatsRef.current);
        console.log('friend.id', friend.id);
        console.log('chat', existingChat);
        
        //check if this is the same chat as currently selected
        const isSameChat = existingChat && chat && existingChat._id === chat._id;
        
        if (!existingChat) {
            const newChat = { //create a temp chat for new conversation
                _id: 'temp',
                participants: [{_id: friend.id || '', username: friend.username, email: friend.email, avatar: 'none'}, {_id: userId || '', username: '', email: '', avatar: 'none'}],
                messageCount: 0,
                unreadCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            debugMessageFlow('chatWith_temp', { friend: friend.username });
            setChat(newChat);
            setMessages([]);
        } else if (isSameChat) {
            debugMessageFlow('chatWith_same', { chatId: existingChat._id, friend: friend.username });
            setIsOpen(true);
            //don't call setChat or setMessages - keep existing state
            return;
        } else {
            debugMessageFlow('chatWith_existing', { chatId: existingChat._id, friend: friend.username });
            setChat(existingChat);
            setMessages([]);
        }
        
        setIsOpen(true);
    }

    useEffect(() => {
        chatRef.current = chat;
        console.log('chat changed', chat);
    }, [chat]);

    useEffect(() => {
        chatsRef.current = chats;
        console.log('chats changed', chats);
    }, [chats]);

    useEffect(() => {
        if(!chat) return;
        if(typing) {
            socketRef.current?.emit('typing_start', {
                //TODO: consider memoizing the friendId
                friendId: chat?.participants.find(participant => participant._id !== userId)?._id,
            });
        } else {
            socketRef.current?.emit('typing_stop', {
                friendId: chat?.participants.find(participant => participant._id !== userId)?._id,
            });
        }

        return () => {
            socketRef.current?.emit('typing_stop', {
                friendId: chat?.participants.find(participant => participant._id !== userId)?._id,
            });
        }
    }, [typing]);

    //TODO: this function assumes that the messages are all from the same chat, either enforece this or make it more robust
    const markMessagesAsRead = async (token: string, messages: Message[]) => {
        console.log('markMessagesAsRead is called');
        if(!token) return;
        if(!messages) return;
        console.log('marking messages as read', messages);
        let markedMessagesNumber = 0;
        for(const message of messages) {
            //if the message is not from the user and not read by the user, mark it as read
            if(message.sender._id !== userId && !message.readBy.some((read: { user: { _id: string } }) => read.user._id === userId)) {
                console.log('marking message as read', message._id);
                socketRef.current?.emit('mark_message_as_read', {
                    messageId: message._id
                });
                //because we checked in the if statement, we know that the message is not read by the user, therefore we decrement the unread count
                markedMessagesNumber++;
            }
        }
        if(messages.length > 0) {
            const chat = chatsRef.current.find(chat => chat._id === messages[0].chatId); // the chat that we assume all of the messages in the array are from
            if(chat) {
                setChats(prevChats => prevChats.map(c => 
                    c._id === chat._id 
                        ? { ...c, unreadCount: Math.max(0, c.unreadCount - markedMessagesNumber) }
                        : c
                ));
            } else {
                console.error('Couldn\'t find chat to update unread count for marked messages: ', messages);
            }
        }
    }

    const debugMessageFlow = (action: string, message?: any) => {
        const currentChat = chatRef.current;
        console.log(`[DEBUG] ${action}:`, {
            currentChatId: currentChat?._id,
            currentChatParticipants: currentChat?.participants.map(p => p.username),
            messageCount: messages.length,
            message: message ? {
                id: message._id,
                chatId: message.chatId,
                content: message.content?.substring(0, 30),
                sender: message.sender?.username
            } : null
        });
    };

    //internal
    const populatedMessageToMessage = (populatedMessage: PopulatedMessage): Message => {
        return {
            _id: populatedMessage._id,
            chatId: populatedMessage.chatId._id,
            content: populatedMessage.content,
            sender: populatedMessage.sender,
            messageType: populatedMessage.messageType,
            readBy: populatedMessage.readBy,
            edited: populatedMessage.edited,
            editedAt: populatedMessage.editedAt,
            createdAt: populatedMessage.createdAt,
            updatedAt: populatedMessage.updatedAt
        }
    }

    return <ChatContext.Provider value={{ chats, setChats, chat, selectChat, chatWith, messages, setMessages, typing, setTyping, otherIsTyping, setOtherIsTyping, isLoading, setIsLoading, error, setError, isOpen, setIsOpen, sendMessage }}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if(!context){
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}

export default ChatContext;