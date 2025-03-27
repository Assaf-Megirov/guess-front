import { useGame } from "@/contexts/GameContext";
import { useSocial } from "@/contexts/SocialContext";
import React from "react";

const GameInvites: React.FC = ({ }) => {
    const {gameInvites} = useGame();
    const { acceptInvite } = useSocial();
    const handleAccept = (senderId: string) => {
        acceptInvite(senderId);
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Incoming Game invites</h2>
            {gameInvites && gameInvites.length > 0 ? (
                <ul className="space-y-4">
                    {gameInvites.map((invite) => (
                        <li
                            key={invite.senderId}
                            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-gray-200"
                        >
                            <div>
                                <p className="text-lg font-medium text-gray-800">{invite.senderUsername}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                    onClick={() => handleAccept(invite.senderId)}
                                >
                                    Accept
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                    onClick={() => alert('Not implemented!')}
                                >
                                    Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-600">No incoming game invites.</p>
            )}
        </div>
    );
};

export default GameInvites