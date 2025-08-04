import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300`}
      >
        <div className="p-4 text-lg font-bold border-b border-gray-700">
          Simple Word Guesser
        </div>
        <nav className="flex-1 p-4">
          {/* Game Section */}
          <div>
            <h3 className="px-4 py-2 text-md font-bold uppercase">Game</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/singleGame"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  Single Game
                </Link>
              </li>
            </ul>
          </div>
          {/* Social Section */}
          <div className="mt-6">
            <h3 className="px-4 py-2 text-md font-bold uppercase">Social</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/home"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/addFriend"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  Add Friend
                </Link>
              </li>
              <li>
                <Link
                  to="/incoming"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  Incoming friend requests
                </Link>
              </li>
              <li>
                <Link
                  to="/outgoing"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  Outgoing friend requests
                </Link>
              </li>
              <li>
                <Link
                  to="/gameInvites"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  Incoming game invites
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-500 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      </div>

      <button
        className={`fixed top-4 left-0 transform ${
          isOpen ? 'translate-x-64' : 'translate-x-0'
        } transition-transform duration-300 z-50 p-2 bg-gray-700 text-white rounded-r-lg shadow-lg`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 transform scale-x-[-1]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>
    </div>
  );
};

export default Sidebar;
