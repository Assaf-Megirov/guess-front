interface GameHeaderProps {
    time: number;
}

const GameHeader: React.FC<GameHeaderProps> = ({ time }) => {
    const formattedTime = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;

    return (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-10">
            <div className="text-4xl font-bold text-red-600 bg-white rounded-b-lg shadow-md px-6 py-2 border-b-2 border-l-2 border-r-2 border-gray-300">
                {formattedTime}
            </div>
        </div>
    );
};

export default GameHeader;