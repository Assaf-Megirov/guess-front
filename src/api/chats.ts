const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CHATS_API = API_BASE_URL + '/chats';

/**
 * Get all chats for the authenticated user
 * @param {string} token - The user's token
 * @returns {Promise<Chat[]>} A promise that resolves to an array of chats, the participants are populated with username, email, avatar and _id
 */
export const getChats = async (token: string) => {
    try{
        const response = await fetch(`${CHATS_API}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if(!response.ok) throw new Error('Error fetching chats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching chats:', error);
        throw error;
    }
}

/**
 * Get messages for a chat
 * @param {string} token - The user's token
 * @param {string} chatId - The id of the chat
 * @param {number} page - The page number
 * @param {number} limit - The number of messages per page
 * @returns {Promise<Message[]>} A promise that resolves to an array of messages
 */
export const getChatMessages = async (token: string, chatId: string, page: number = 1, limit: number = 50) => {
    try{
        const response = await fetch(`${CHATS_API}/messages?chatId=${chatId}&page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if(!response.ok) throw new Error('Error fetching messages');
        return await response.json();
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}