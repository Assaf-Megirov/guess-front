import React, { useState, useEffect } from 'react';
import DynamicTextarea from './DynamicTextArea';
import { validateWord, getNextTierCombos } from '../../api/game';
import { toast } from 'sonner';
const POINTS_PER_WORD = 1;

enum GameStatus {
    SETTINGS = 'SETTINGS',
    PLAYING = 'PLAYING',
    GAME_OVER = 'GAME_OVER',
}

interface MoveResponse {
    success: boolean;
    reason?: string;
}

interface Settings {
    gameDuration: number;
    letterAddFrequency: number; //how many letters to add every x points
}

const SingleGame: React.FC = () => {
    const [written, setWritten] = useState('');
    const [letters, setLetters] = useState('');
    const [points, setPoints] = useState(0);
    const [time, setTime] = useState(0); //in seconds
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [gameStatus, setGameStatus] = useState(GameStatus.SETTINGS);
    const [settings, setSettings] = useState<Settings>({gameDuration: 5*60, letterAddFrequency: 10}); // 5 minutes in seconds
    const [animation, setAnimation] = useState({
        valid: false,
        invalid: false,
        points: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [words, setWords] = useState<string[]>([]);

    useEffect(() => {
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            try {
                const settingsObj = JSON.parse(savedSettings);
                setSettings(settingsObj);
            } catch(e) {
                console.error(`Couldn't load settings from local storage: ${e}`);
            }
        }
    }, []);

    useEffect(() => {
        if (gameStatus !== GameStatus.PLAYING) {
            if (intervalId) {
                clearInterval(intervalId);
                setIntervalId(null);
            }
            return;
        }

        const id = setInterval(() => {
            setTime((prevTime) => {
                const newTime = prevTime + 1;
                if (newTime >= settings.gameDuration) {
                    setGameStatus(GameStatus.GAME_OVER);
                    clearInterval(id);
                    return settings.gameDuration;
                }
                return newTime;
            });
        }, 1000);
        setIntervalId(id);
        return () => clearInterval(id);
    }, [gameStatus, settings.gameDuration]);

    const remainingTime = settings.gameDuration - time;
    const formattedRemainingTime = `${Math.floor(remainingTime / 60)}:${String(remainingTime % 60).padStart(2, '0')}`;

    const triggerAnimation = (type: 'valid' | 'invalid' | 'points') => {
        setAnimation(prev => ({
            ...prev,
            [type]: true
        }));
        
        setTimeout(() => {
            setAnimation(prev => ({
                ...prev,
                [type]: false
            }));
        }, 1000);
    };

    const handleMove = async (word: string) => {
        if (!word.trim()) return false;
        console.log(`frequency when moving: ${settings.letterAddFrequency}`);
        try {
            const res: MoveResponse = await validateWord(word, letters);
            if (res.success) {
                triggerAnimation('points');
                triggerAnimation('valid');
                setError(null);
                setWords(prev => [...prev, word]);
                setWritten('');
                setPoints(points + POINTS_PER_WORD);
                return true;
            } else {
                triggerAnimation('invalid');
                setError(res.reason || 'Invalid word');
                setTimeout(() => setError(null), 3000);
                return false;
            }
        } catch (err) {
            console.error('Error validating word:', err);
            //show destructive toast to the user and add button to retry or refresh page
            toast.error(
                <div className="toast-message">
                    {err instanceof Error ? err.message : 'An error occurred while validating word'}, you can try again or:
                </div>,
                {
                    action: {
                        label: 'Refresh Page',
                        onClick: () => window.location.reload()
                    },
                    style: {
                        maxWidth: '100%',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word'
                    }
                }
            );
            return false;
        }
    }

    const handleWrite = (word: string) => {
        setWritten(word);
        if (error) {
            setError(null);
        }
    }

    const handleStartGame = async () => {
        localStorage.setItem('settings', JSON.stringify(settings));
        //reset game state
        setTime(0);
        setPoints(0);
        setWords([]);
        setWritten('');
        setLetters(await getLetters(''));
        setGameStatus(GameStatus.PLAYING);
    }

    const handlePlayAgain = () => {
        setGameStatus(GameStatus.SETTINGS);
    }

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const minutes = parseInt(e.target.value);
        setSettings(prev => ({
            ...prev,
            gameDuration: minutes * 60
        }));
    }

    const handleLetterFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const frequency = parseInt(e.target.value);
        setSettings(prev => ({
            ...prev,
            letterAddFrequency: frequency
        }));
    }

    useEffect(() => {
        const addLettersIfNeeded = async () => {
            if (!settings?.letterAddFrequency) {
                console.warn('Letter add frequency is not set');
                return;
            }
            if(gameStatus !== GameStatus.PLAYING) return;
            const requiredLetters = Math.floor((points) / settings.letterAddFrequency) + 1;
            console.log(`requiredLetters: ${requiredLetters}, points: ${points}, letterAddFrequency: ${settings.letterAddFrequency}`);
            console.log(`points / settings.letterAddFrequency: ${points / settings.letterAddFrequency}`);
            const currentLetters = letters.length;
            
            if (requiredLetters > currentLetters) {
                try {
                    const newLetters = await getLetters(letters);
                    setLetters(newLetters);
                } catch (error) {
                    console.error('Failed to get new letters:', error);
                    setError('Failed to get new letters');
                }
            }
        };

        addLettersIfNeeded();
    }, [points, settings?.letterAddFrequency, letters]);

    const renderSettingsScreen = () => (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">Game Settings</h1>
                
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gameDuration">
                        Game Duration
                    </label>
                    <select 
                        id="gameDuration"
                        value={settings.gameDuration / 60}
                        onChange={handleDurationChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="1">1 minute</option>
                        <option value="2">2 minutes</option>
                        <option value="3">3 minutes</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                    </select>
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="letterAddFrequency">
                        Letter Add Frequency
                    </label>
                    <select 
                        id="letterAddFrequency"
                        value={settings.letterAddFrequency}
                        onChange={handleLetterFrequencyChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="5">Every 5 points</option>
                        <option value="10">Every 10 points</option>
                        <option value="15">Every 15 points</option>
                        <option value="20">Every 20 points</option>
                        <option value="30">Every 30 points</option>
                        <option value="40">Every 40 points</option>
                        <option value="50">Every 50 points</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        New letters will be added after you score {settings.letterAddFrequency} points
                    </p>
                </div>
                
                <button 
                    onClick={handleStartGame}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                    Start Game
                </button>
            </div>
        </div>
    );

    const renderPlayingScreen = () => (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-10">
                <div className="text-4xl font-bold text-red-600 bg-white rounded-b-lg shadow-md px-6 py-2 border-b-2 border-l-2 border-r-2 border-gray-300">
                    {formattedRemainingTime}
                </div>
            </div>
            
            <div className="pt-24 px-4 flex flex-col items-center">
                <div className="w-full max-w-2xl bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                    <div className={`text-3xl font-bold text-center text-blue-600 mb-4 transition-all duration-300 ${
                        animation.points ? 'scale-150 text-green-600' : ''
                    }`}>
                        {points || 0}
                        {animation.points && <span className="animate-ping absolute text-green-500">+1</span>}
                    </div>
                    
                    <div className="text-2xl font-bold text-center text-blue-600 mb-4">
                        {letters || ''}
                    </div>
                    
                    {error && (
                        <div className="mb-4 px-3 py-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className={`w-full ${animation.invalid ? 'animate-shake' : ''}`}>
                        <DynamicTextarea
                            onChange={handleWrite}
                            onEnter={handleMove}
                            placeholder="Type here..."
                            value={written}
                            className={`border-2 ${
                                animation.valid 
                                    ? 'border-green-500' 
                                    : animation.invalid 
                                        ? 'border-red-500' 
                                        : 'border-blue-300'
                            }`}
                            disabled={gameStatus !== GameStatus.PLAYING}
                        />
                    </div>
                </div>
                
                <div className="w-full max-w-2xl bg-white border-2 border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-600 mb-2">Your Words:</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {words.map((word, index) => (
                            <span key={index} className="text-sm font-medium bg-blue-100 rounded px-2 py-1 truncate">
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGameOverScreen = () => (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                <h1 className="text-4xl font-bold mb-6 text-center text-indigo-600">
                    Game Over!
                </h1>
                
                <div className="mb-6 text-center">
                    <div className="text-2xl mb-2">Your Score</div>
                    <div className="text-5xl font-bold text-indigo-600">{points}</div>
                </div>
                
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3">Words Found ({words.length})</h2>
                    <div className="max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                            {words.map((word, index) => (
                                <span key={index} className="text-sm font-medium bg-blue-100 rounded px-2 py-1 truncate">
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={handlePlayAgain}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                    Play Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {gameStatus === GameStatus.SETTINGS && renderSettingsScreen()}
            {gameStatus === GameStatus.PLAYING && renderPlayingScreen()}
            {gameStatus === GameStatus.GAME_OVER && renderGameOverScreen()}

            <style>{`
                @keyframes shake {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    50% { transform: translateX(5px); }
                    75% { transform: translateX(-5px); }
                    100% { transform: translateX(0); }
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                .toast-message {
                    white-space: normal;
                    word-break: break-word;
                    word-wrap: break-word;
                }

                @media (max-width: 450px) {
                    :root {
                        --width: calc(100% - 16px) !important;
                    }
                    
                    [data-sonner-toast] {
                        max-width: 100% !important;
                        width: calc(100% - 16px) !important;
                    }
                    
                    [data-sonner-toast] [data-content] {
                        white-space: normal !important;
                        word-break: break-word !important;
                    }
                    
                    [data-sonner-toast] [data-button] {
                        white-space: nowrap !important;
                    }
                }
            `}</style>
        </div>
    );
};

const getLetters = async (letters: string) => {
    try{
        const possibleCombos = await getNextTierCombos(letters);
        const randomCombo = possibleCombos[Math.floor(Math.random() * possibleCombos.length)];
        return randomCombo;
    }catch(err){
        console.error('Error getting next tier combos:', err);
        toast.error(
            <div className="toast-message">
                Couldn't get your next letters boss, you can restart the game by refreshing the page or continue playing with the letters you have:
            </div>,
            {
                style: {
                    maxWidth: '100%',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                }
            }
        );
        if(letters.length > 0){
            return letters;
        }
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        return alphabet.split('')[Math.floor(Math.random() * alphabet.length)];
    }
}

export default SingleGame;