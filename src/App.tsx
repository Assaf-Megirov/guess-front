import AuthPage from './components/auth/AuthPage';
import Home from './components/Home';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameInit, SocialProvider, useSocial } from './contexts/SocialContext';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Incoming from './components/social/Incoming';
import Outgoing from './components/social/Outgoing';
import PrivateRoute from './components/auth/PrivateRoute';
import { toast, Toaster } from 'sonner';
import { useEffect } from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import Game from './components/game/Game';
import GameInvites from './components/game/GameInvites';

function App() {
  return (
    <AuthProvider>
      <Toaster/>
      <SocialProvider>
        <GameProvider>
          <Router>
          <AuthRedirect />
          <GameRedirect />
            <div className="flex">
              <Sidebar/>

              <div className="flex-1 p-6 bg-gray-100">
                <Routes>
                  <Route path='/auth' element={<AuthPage/>} />
                  <Route path='/' element={
                    <PrivateRoute>
                      <Home />
                    </PrivateRoute>
                  }/>
                  <Route path='/incoming' element={
                    <PrivateRoute>
                      <Incoming />
                    </PrivateRoute>
                  }/>
                  <Route path='/outgoing' element={
                    <PrivateRoute>
                      <Outgoing />
                    </PrivateRoute>
                  }/>
                  <Route path='/game' element={
                    <PrivateRoute>
                      <Game />
                    </PrivateRoute>
                  }/>
                  <Route path='/gameInvites' element={
                    <PrivateRoute>
                      <GameInvites />
                    </PrivateRoute>
                  }/>
                </Routes>
              </div>
            </div>
          </Router>
        </GameProvider>
      </SocialProvider>
    </AuthProvider>
  );
}

function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/auth') {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return null;
}

function GameRedirect() {
  const navigate = useNavigate();
  const { registerGameInit, unregisterGameInit, registerGameInvite, unregisterGameInvite, acceptInvite} = useSocial();
  const { setGameData, gameInitToGameData } = useGame();

  const handleGameInit = (data: GameInit) => {
    console.log('game init in App.tsx');
    console.log('Data recieved:', data);

    try{
      const gData = gameInitToGameData(data);
      console.log('Game data created:', gData);
      setGameData(gData);
      console.log('Attempting to show toast');
      setTimeout(() => {
        toast("Start Game?", {
          duration: 0,
          action: (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                console.log('Toast action clicked');
                toast.dismiss();
                navigate("/game");
              }}
            >
              Start
            </button>
          ),
        });
      }, 1);
      console.log('Toast method called');
    }catch (error) {
      console.error('Error in handleGameInit:', error);
    }

  };

  const handleGameInvite = (userId: string, username: string) => {
    toast(`Recieved game invite from: ${username}`, {
      duration: 0,
      action: (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            toast.dismiss();
            acceptInvite(userId);
          }}
        >
          Accept
        </button>
      ),
    });
  }

  useEffect(() => {
    registerGameInit(handleGameInit);
    registerGameInvite(handleGameInvite);
    console.log('In game redirect registering to the game init and game invite callback');
    return () => {
      unregisterGameInit(handleGameInit);
      unregisterGameInvite(handleGameInvite);
    }
  }, [registerGameInit]);
  
  return null;
}

export default App;