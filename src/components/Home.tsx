import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { declineFriendRequest, getFriends, getFriendSuggestions } from '@/api/friends';
import UserList from './social/UserList';
import { User } from '@/types/User';
import { useSocial } from '@/contexts/SocialContext';
import { toast } from 'sonner';
import { acceptFriendRequest } from '@/api/friends';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<User[]>();
  const [suggestions, setSuggestions] = useState<User[]>();

  const { registerFriendRequestAccepted, registerFriendRequestReceived, registerFriendsListUpdate,
          unregisterFriendRequestAccepted, unregisterFriendRequestReceived, unregisterFriendsListUpdate
   } = useSocial();
  const handleAdd = async (userId: string) => {
    if(!token){
      console.log("Attempting to accept friend request with no token");
      return;
    }
    const res = await acceptFriendRequest(userId, token);
    if(!res.success){
      toast(res.message, {
        className:
          "bg-red-500 text-white p-4 rounded shadow-lg",
        duration: 5000,
      });
    }else{
      toast('Added to friends');
      onUpdate();
    }
  }
  const handleReject = async (userId: string) => {
    if(!token){
      console.log("Attempting to accept friend request with no token");
      return;
    }
    const res = await declineFriendRequest(userId, token);
    if(!res.success){
      toast(res.message, {
        className:
          "bg-red-500 text-white p-4 rounded shadow-lg",
        duration: 5000,
      });
    }else{
      toast('Request declined');
      onUpdate();
    }
  }
  const onUpdate = () => {
    getUserFriends();
    getUserFriendSuggestions();
  }
  const onFriendRequestAccepted = (userId: string, username: string) =>{
    const toastId = toast(`Friend request to ${username} accepted.`, {
      duration: 5000,
      action: {
        label: 'Dismiss',
        onClick: () => {
          toast.dismiss(toastId);
        },
      },
    });
    console.log('friend request accepted from: ' + userId + ', ' + username);
  }
  const onFriendRequestRecieved = (userId: string, username: string) =>{
    const toastId = toast(`Friend request from ${username} received.`, {
        duration: 5000,
        action: (
            <div className="flex gap-2">
                <button
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    onClick={() => handleAdd(userId)}
                >
                    Accept
                </button>
                <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    onClick={() => handleReject(userId)}
                >
                    Reject
                </button>
                <button
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    onClick={() => toast.dismiss(toastId)}
                >
                    Dismiss
                </button>
            </div>
        ),
    });
    console.log('Friend request received from: ' + userId + ', ' + username);
  }

  useEffect(() => {
    registerFriendsListUpdate(onUpdate);
    registerFriendRequestAccepted(onFriendRequestAccepted);
    registerFriendRequestReceived(onFriendRequestRecieved);

    return () => {
      unregisterFriendsListUpdate(onUpdate);
      unregisterFriendRequestAccepted(onFriendRequestAccepted);
      unregisterFriendRequestReceived(onFriendRequestRecieved);
    };
  }, [registerFriendsListUpdate, registerFriendRequestAccepted, registerFriendRequestReceived]);

  if (!user || !token) {
    return null;
  }

  const getUserFriends = async () => {
    const tempFriends = await getFriends(token);
    const mapped = tempFriends.map((friend: any) => ({
      id: friend._id,
      email: friend.email,
      username: friend.username,
      isOnline: friend.isOnline,
    }));
    setFriends(mapped);
    console.log(mapped);
  };

  const getUserFriendSuggestions = async () => {
    const tempSuggestions = await getFriendSuggestions(token, 1, 10);
    const mapped = tempSuggestions.suggestions.map((suggestion: any) => ({
      id: suggestion._id,
      email: suggestion.email,
      username: suggestion.username,
      isOnline: suggestion.isOnline,
    }));
    setSuggestions(mapped);
    console.log(mapped);
  };

  useEffect(() => {
    getUserFriends();
    getUserFriendSuggestions();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome, {user.username}!
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-600 text-base">
          This is your personalized home page. More content coming soon!
        </p>
      </div>
      {user.isOnline = true}
      <UserList users={friends || []} areFriends={true} />
      <UserList users={suggestions || []} areFriends={false} />
    </div>
  );
};

export default Home;