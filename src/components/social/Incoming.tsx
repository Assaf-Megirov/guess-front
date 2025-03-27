import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { acceptFriendRequest, declineFriendRequest, getIncomingFriendRequests } from '@/api/friends';
import { toast } from 'sonner';
import { User } from '@/types/User';

const Incoming: React.FC = () => {
    const [requests, setRequests] = useState<User[]>([])
    const {token} = useAuth();
    const {registerFriendsListUpdate, unregisterFriendsListUpdate} = useSocial();

    const fetchRequests = async (authToken: string) => {
        try {
            const incomingRequests = await getIncomingFriendRequests(authToken);
            setRequests(incomingRequests.map((req: any) => ({
                id: req._id,
                email: req.email,
                username: req.username,
                isOnline: req.isOnline,
                lastActive: req.lastActive ? new Date(req.lastActive) : undefined,
            })));
        } catch (error) {
            console.error('Failed to fetch incoming friend requests:', error);
            toast('Failed to fetch incoming friend requests.', { dismissible: true });
        }
    };

    const update = () =>{
        if(!token){
            console.log('Attempting to update incoming friend requsets without token present!');
            return;
        }
        fetchRequests(token);
    }

    const handleAccept = async(id: string) => {
        if(!token){
            console.log('Attempting to accept incoming friend requset without token present!');
            return;
        }
        const res = await acceptFriendRequest(id, token);
        if(!res.success){
            toast(`Something went wrong: ${res.message}`, {dismissible: true});
        }else{
            toast('friend was added successfully!', {dismissible: true});
            update();
        }
    }

    const handleReject = async(id: string) => {
        if(!token){
            console.log('Attempting to reject incoming friend requset without token present!');
            return;
        }
        const res = await declineFriendRequest(id, token);
        if(!res.success){
            toast(`Something went wrong: ${res.message}`, {dismissible: true});
        }else{
            toast('friend was removed successfully!', {dismissible: true});
            update();
        }
    }

    useEffect(() => {
        if(!token){
            console.log('trying to fetch friend requests without tokens.');
            return;
        }
        fetchRequests(token);
    }, [token]);

    useEffect(() => {
        registerFriendsListUpdate(update);

        return () => {
            unregisterFriendsListUpdate(update);
        }
    }, [registerFriendsListUpdate])

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Incoming Friend Requests</h2>
            {requests && requests.length > 0 ? (
                <ul className="space-y-4">
                    {requests.map((sender) => (
                        <li
                            key={sender.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-gray-200"
                        >
                            <div>
                                <p className="text-lg font-medium text-gray-800">{sender.username}</p>
                                <p className="text-sm text-gray-500">{sender.email}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                    onClick={() => handleAccept(sender.id)}
                                >
                                    Accept
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                    onClick={() => handleReject(sender.id)}
                                >
                                    Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-600">No incoming friend requests.</p>
            )}
        </div>
    );
};

export default Incoming;