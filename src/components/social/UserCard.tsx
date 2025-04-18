import React from 'react';
import { User } from '@/types/User';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { sendFriendRequest, removeFriend } from '@/api/friends';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSocial } from '@/contexts/SocialContext';
 
interface UserCardProps {
  user: User;
  isFriend: boolean;
  imageUrl?: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, isFriend, imageUrl }) => {

  const {token} = useAuth();
  const {triggerFriendsListUpdate, sendInvite} = useSocial();

  const handleAddToFriends = async () => {
    try {
      if(!token){
        console.log('Attempting to add friends while token is not set.');
        return;
      }
      const res = await sendFriendRequest(user.id, token);
      if(!res.success){
        toast(res.message, {
          className:
            "bg-red-500 text-white p-4 rounded shadow-lg",
          duration: 5000,
        });
      }else{
        toast(`Friend Requset sent!`, {dismissible: true});
        triggerFriendsListUpdate();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Internal Error!');
    }
  };

  const handleRemoveFromFriends = async () => {
    try {
      if(!token){
        alert('Attempting to remove friends while token is not set.');
        return;
      }
      const res = await removeFriend(user.id, token);
      if(!res.success){
        toast(res.message, {
          className:
            "bg-red-500 text-white p-4 rounded shadow-lg",
          duration: 5000,
        });
      }else{
        toast(`Friend removed!`, {dismissible: true});
        triggerFriendsListUpdate();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend.');
    }
  };

  const handleInviteToGame = async () => {
    sendInvite(user.id);
  }

  return (
    <div className="flex items-center border border-gray-300 rounded-lg p-4 max-w-md shadow-md bg-white">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${user.username}'s avatar`}
          className="w-10 h-10 rounded-full object-cover mr-4"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-black mr-4"></div>
      )}
      <h2 className="text-xl font-semibold text-gray-800 mr-4">{user.username}</h2>
      <div className="flex items-center gap-2 ml-auto">
        {isFriend ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 text-sm text-black bg-gray-300 rounded hover:bg-gray-400">
                Actions
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alert('Chat feature not implemented yet.')}>
                Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!user.isOnline}
                onClick={handleInviteToGame}
              >
                Invite to Game
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRemoveFromFriends}>
                Remove from friends
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={handleAddToFriends}
            
            className="px-2 py-1 text-sm text-white rounded bg-green-800 hover:bg-green-600"
          >
            Add to Friends
          </button>
        )}
        <div
          className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
        ></div>
      </div>
    </div>
  );
};

export default UserCard;
