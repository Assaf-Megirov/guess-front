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
          <ul className="list-disc list-inside text-s md:text-base text-center space-y-1 md:space-y-2">
            <li>Enter a username and create a game (lobby); an invite code will be displayed above.</li>
            <li>To join a game, enter a username and the invite code, then click "Join Game".</li>
            <li>When you're ready, press "Ready".</li>
            <li>The game starts when either all players are ready or the game creator presses "Start".</li>
            <li>Every player gets a letter and must type words (press Enter to submit) that include that letter.</li>
            <li>Earn points for every valid word you submit.</li>
            <li>If a player scores more than 10 points, everyone gets an additional letter to use.</li>
            <li>The game ends when the timer runs out, and the player with the most points wins.</li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
