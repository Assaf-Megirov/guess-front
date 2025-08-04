import React from 'react';

export interface GameSettings{
    gameDuration: number;
    letterAddFrequency: number;
    victoryThreshold: number;
}

export interface GameSettingsMenuProps{
    gameSettings?: GameSettings; //this is used to see the current settings
    onGameSettingsChange: (gameSettings: GameSettings) => void; // this is called when the user changes the settings
    isAdmin?: boolean; // optional prop to show if user is admin and can change settings
}

//shows dropdown for the game duration, letter add frequency, and a number text input for the victory threshold
export const GameSettingsMenu: React.FC<GameSettingsMenuProps> = ({ 
    gameSettings, 
    onGameSettingsChange, 
    isAdmin = true 
}) => {
    const settings = gameSettings || { //revert to default settings if no settings are provided
        gameDuration: 2 * 60 * 1000,
        letterAddFrequency: 10,
        victoryThreshold: 100
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDuration = parseInt(e.target.value);
        if (!isNaN(newDuration)) {
            onGameSettingsChange({...settings, gameDuration: newDuration});
        }
    };

    const handleLetterFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newFrequency = parseInt(e.target.value);
        if (!isNaN(newFrequency)) {
            onGameSettingsChange({...settings, letterAddFrequency: newFrequency});
        }
    };

    const handleVictoryThresholdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newThreshold = parseInt(e.target.value);
        if (!isNaN(newThreshold)) {
            onGameSettingsChange({...settings, victoryThreshold: newThreshold});
        }
    };

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!isAdmin) {
        return (
            <div className="p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Game Settings</h2>
                <div className="space-y-3 text-sm text-gray-600">
                    <div>Duration: {formatDuration(settings.gameDuration)}</div>
                    <div>Letter Frequency: {settings.letterAddFrequency}</div>
                    <div>Victory Threshold: {settings.victoryThreshold}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Game Settings</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="game-duration" className="block text-sm font-medium text-gray-700 mb-1">
                        Game Duration
                    </label>
                    <select 
                        id="game-duration"
                        value={settings.gameDuration} 
                        onChange={handleDurationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={60 * 1000}>1 minute</option>
                        <option value={120 * 1000}>2 minutes</option>
                        <option value={300 * 1000}>5 minutes</option>
                        <option value={600 * 1000}>10 minutes</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="letter-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                        Letter Add Frequency
                    </label>
                    <select 
                        id="letter-frequency"
                        value={settings.letterAddFrequency} 
                        onChange={handleLetterFrequencyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={0}>0 (No letters added)</option>
                        <option value={5}>5 points</option>
                        <option value={10}>10 points</option>
                        <option value={15}>15 points</option>
                        <option value={20}>20 points</option>
                        <option value={30}>30 points</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="victory-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                        Victory Threshold
                    </label>
                    <select 
                        id="victory-threshold"
                        value={settings.victoryThreshold} 
                        onChange={handleVictoryThresholdChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={0}>0 (Time-based only)</option>
                        <option value={10}>10 points</option>
                        <option value={20}>20 points</option>
                        <option value={30}>30 points</option>
                        <option value={40}>40 points</option>
                        <option value={50}>50 points</option>
                        <option value={60}>60 points</option>
                        <option value={70}>70 points</option>
                        <option value={80}>80 points</option>
                        <option value={90}>90 points</option>
                        <option value={100}>100 points</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

export default GameSettingsMenu;