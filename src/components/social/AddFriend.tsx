//this component has a search field to allow for searching for users by username
import { useState, useEffect } from "react";
import { findUser, getFriends } from "../../api/friends";
import { useAuth } from "../../contexts/AuthContext";
import UserList from "./UserList";
import { User } from "../../types/User";
import { toast } from "sonner";

export const AddFriend: React.FC = () => {
    const [username, setUsername] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            getUserFriends();
        }
    }, [token]);

    const getUserFriends = async () => {
        if (!token) return;
        
        try {
            const tempFriends = await getFriends(token);
            const mapped = tempFriends.map((friend: any) => ({
                id: friend._id,
                email: friend.email,
                username: friend.username,
                isOnline: friend.isOnline,
            }));
            setFriends(mapped);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const handleSearch = async () => {
        if (!username.trim()) {
            toast("Please enter a username to search", {
                className: "bg-yellow-500 text-white p-4 rounded shadow-lg",
                duration: 3000,
            });
            return;
        }

        if (!token) {
            toast("Authentication required", {
                className: "bg-red-500 text-white p-4 rounded shadow-lg",
                duration: 3000,
            });
            return;
        }

        setIsSearching(true);
        try {
            const response = await findUser(username, token);
            if (response.success) {
                const mappedUsers = response.users.map((user: any) => ({
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    isOnline: user.isOnline,
                }));
                setUsers(mappedUsers);
                
                if (mappedUsers.length === 0) {
                    toast("No users found with that username", {
                        className: "bg-blue-500 text-white p-4 rounded shadow-lg",
                        duration: 3000,
                    });
                }
            } else {
                toast("Search failed", {
                    className: "bg-red-500 text-white p-4 rounded shadow-lg",
                    duration: 5000,
                });
                setUsers([]);
            }
        } catch (error) {
            console.error('Error searching for users:', error);
            toast("An error occurred while searching", {
                className: "bg-red-500 text-white p-4 rounded shadow-lg",
                duration: 5000,
            });
            setUsers([]);
        } finally {
            setIsSearching(false);
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    const separateUsersByFriendship = () => {
        const friendsInResults: User[] = [];
        const nonFriends: User[] = [];
        
        users.forEach(user => {
            const isFriend = friends.some(friend => friend.id === user.id);
            if (isFriend) {
                friendsInResults.push(user);
            } else {
                nonFriends.push(user);
            }
        });
        
        return { friendsInResults, nonFriends };
    }

    const { friendsInResults, nonFriends } = separateUsersByFriendship();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-4">Add Friend</h1>
                    <p className="text-gray-600 mb-4">Search for users by username to add them as friends</p>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter username to search..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button 
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                {users.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Search Results ({users.length} found)
                        </h2>
                        
                        {/* Display non-friends first */}
                        {nonFriends.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-md font-medium text-gray-700 mb-3">
                                    Users to Add ({nonFriends.length})
                                </h3>
                                <UserList users={nonFriends} areFriends={false} />
                            </div>
                        )}
                        
                        {/* Display existing friends */}
                        {friendsInResults.length > 0 && (
                            <div>
                                <h3 className="text-md font-medium text-gray-700 mb-3">
                                    Already Friends ({friendsInResults.length})
                                </h3>
                                <UserList users={friendsInResults} areFriends={true} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddFriend;