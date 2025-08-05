const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FRIENDS_API = API_BASE_URL + '/friends';

export const getFriends = async (token: string) => {
    try {
        const response = await fetch(`${FRIENDS_API}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error fetching friends');
        console.log('response:', response);
        return await response.json();
    } catch (error) {
        console.error('Error fetching friends:', error);
        throw error;
    }
};

export const getIncomingFriendRequests = async (token: string) => {
    try {
        const response = await fetch(`${FRIENDS_API}/requests/incoming`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error fetching incoming friend requests');
        return await response.json();
    } catch (error) {
        console.error('Error fetching incoming friend requests:', error);
        throw error;
    }
};

export const getOutgoingFriendRequests = async (token: string) => {
    try {
        const response = await fetch(`${FRIENDS_API}/requests/outgoing`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error fetching outgoing friend requests');
        return await response.json();
    } catch (error) {
        console.error('Error fetching outgoing friend requests:', error);
        throw error;
    }
};

export const findUser = async (username: string, token: string, page = 1, limit = 10) => {
    try {
        console.log('finding user:', username);
        const response = await fetch(`${FRIENDS_API}/find?username=${username}&page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error finding user');
        const data = await response.json();
        return { success: true, users: data.users, pagination: data.pagination };
    } catch (error) {
        console.error('Error finding user:', error);
        throw error;
    }
}

interface ApiResponse {
    success: boolean;
    message: string;
}

/**
 * Send a friend request to another user
 * @param {string} userId - ID of the user to send the friend request to
 * @param {string} token - Authorization token
 * @returns {Promise<ApiResponse>} Object containing success status and message
 */
export const sendFriendRequest = async (userId: string, token: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${FRIENDS_API}/add/${userId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            let errorMessage = 'Error sending friend request';
            if (response.status === 400) {
                errorMessage = 'Bad request. You might already have a pending request or are already friends.';
            } else if (response.status === 404) {
                errorMessage = 'User not found.';
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            return { success: false, message: errorMessage };
        }

        const data = await response.json();
        return { success: true, message: data.message || 'Friend request sent successfully' };
    } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
};

/**
 * Accept a friend request
 * @param {string} userId - ID of the user whose friend request to accept
 * @param {string} token - Authorization token
 * @returns {Promise<ApiResponse>} Object containing success status and message
 */
export const acceptFriendRequest = async (userId: string, token: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${FRIENDS_API}/accept/${userId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            let errorMessage = 'Error accepting friend request';
            if (response.status === 400) {
                errorMessage = 'No friend request from this user.';
            } else if (response.status === 404) {
                errorMessage = 'User not found.';
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            return { success: false, message: errorMessage };
        }

        const data = await response.json();
        return { success: true, message: data.message || 'Friend request accepted successfully' };
    } catch (error) {
        console.error('Error accepting friend request:', error);
        return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
};

/**
 * Decline a friend request
 * @param {string} userId - ID of the user whose friend request to decline
 * @param {string} token - Authorization token
 * @returns {Promise<ApiResponse>} Object containing success status and message
 */
export const declineFriendRequest = async (userId: string, token: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${FRIENDS_API}/decline/${userId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            let errorMessage = 'Error declining friend request';
            if (response.status === 400) {
                errorMessage = 'No friend request from this user.';
            } else if (response.status === 404) {
                errorMessage = 'User not found.';
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            return { success: false, message: errorMessage };
        }

        const data = await response.json();
        return { success: true, message: data.message || 'Friend request declined successfully' };
    } catch (error) {
        console.error('Error declining friend request:', error);
        return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
};

/**
 * Cancel an outgoing friend request
 * @param {string} userId - ID of the user to cancel the friend request to
 * @param {string} token - Authorization token
 * @returns {Promise<ApiResponse>} Object containing success status and message
 */
export const cancelFriendRequest = async (userId: string, token: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${FRIENDS_API}/cancel/${userId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            let errorMessage = 'Error canceling friend request';
            if (response.status === 400) {
                errorMessage = 'No outgoing friend request to this user.';
            } else if (response.status === 404) {
                errorMessage = 'User not found.';
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            return { success: false, message: errorMessage };
        }

        const data = await response.json();
        return { success: true, message: data.message || 'Friend request canceled successfully' };
    } catch (error) {
        console.error('Error canceling friend request:', error);
        return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
};

export const removeFriend = async (userId: string, token: string): Promise<ApiResponse> => {
    try {
        const response = await fetch(`${FRIENDS_API}/remove/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            let errorMessage = 'Error removing friend';
            if (response.status === 400) {
                errorMessage = 'You are not friends with this user.';
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            return { success: false, message: errorMessage };
        }

        const data = await response.json();
        return { success: true, message: data.message || 'Friend removed successfully' };
    } catch (error) {
        console.error('Error removing friend:', error);
        return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
};

export const getFriendSuggestions = async (token: string, page = 1, limit = 10) => {
    try {
        const response = await fetch(`${FRIENDS_API}/suggestions?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error fetching friend suggestions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching friend suggestions:', error);
        throw error;
    }
};

export const getOnlineFriends = async (token: string) => {
    try {
        const response = await fetch(`${FRIENDS_API}/online`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error fetching online friends');
        return await response.json();
    } catch (error) {
        console.error('Error fetching online friends:', error);
        throw error;
    }
};