import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 md:py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 px-2 md:px-4">
        {/* About Section */}
        <div className="flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-center">About</h2>
          <p className="text-sm md:text-base text-center">
            This is just a fun project, dont take it too seriously. you can contact me at awindyendprod@gmail.com
          </p>
        </div>
        {/* How To Section */}
        <div className="flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-center">How To</h2>
          <div className="text-sm md:text-base max-w-lg">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">1</div>
              <div>Enter a username and create a game (lobby); an invite code will be displayed above.</div>
              
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">2</div>
              <div>To join a game, enter a username and the invite code, then click "Join Game".</div>
              
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">3</div>
              <div>When you're ready, press "Ready".</div>
              
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">4</div>
              <div>The game starts when either all players are ready or the game creator presses "Start".</div>
              
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">5</div>
              <div>Every player gets a letter and must type words (press Enter to submit) that include that letter.</div>
              
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">6</div>
              <div>Earn points for every valid word you submit.</div>
              
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">7</div>
              <div>If a player scores more than 10 points, everyone gets an additional letter to use.</div>
              
              <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium">8</div>
              <div>The game ends when the timer runs out, and the player with the most points wins.</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
