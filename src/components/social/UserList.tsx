import React from 'react';
import UserCard from './UserCard';
import { User } from '@/types/User';

interface UserListProps {
    users: User[];
    areFriends: boolean;
}

const UserList: React.FC<UserListProps> = ({ users, areFriends }) => {
    return (
        <div className="flex flex-col gap-4">
            {users.map((user) => (
                <UserCard
                    key={user.id}
                    user={user}
                    isFriend={areFriends}
                />
            ))}
        </div>
    );
};

export default UserList;