import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import { User } from '@/types/User';
import { getOutgoingFriendRequests } from '@/api/friends';
import { useAuth } from '@/contexts/AuthContext';

interface UserListProps {
    users: User[];
    areFriends: boolean;
}

const UserList: React.FC<UserListProps> = ({ users, areFriends }) => {
    const [outgoingRequests, setOutgoingRequests] = useState<string[]>([]);
    const { token } = useAuth();

    const fetchOutgoingRequests = async () => {
        if (!token || areFriends) return;
        
        try {
            const requests = await getOutgoingFriendRequests(token);
            const requestIds = requests.map((req: any) => req._id);
            setOutgoingRequests(requestIds);
        } catch (error) {
            console.error('Error fetching outgoing requests:', error);
        }
    };

    useEffect(() => {
        fetchOutgoingRequests();
    }, [token, areFriends]);

    return (
        <div className="flex flex-col gap-4">
            {users.map((user) => (
                <UserCard
                    key={user.id}
                    user={user}
                    isFriend={areFriends}
                    hasOutgoingRequest={outgoingRequests.includes(user.id)}
                    onRequestSent={fetchOutgoingRequests}
                />
            ))}
        </div>
    );
};

export default UserList;