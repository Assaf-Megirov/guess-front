interface WordsListProps {
    words: string[];
    isCurrentPlayer: boolean;
    textColor: string;
    borderColor: string;
}

const WordsList = ({ words, isCurrentPlayer, textColor, borderColor }: WordsListProps) => {
    if (!words || words.length === 0) {
        return (
            <div className="w-full p-2 my-2 max-h-28 overflow-y-auto border-2 border-opacity-70 rounded-lg bg-white text-sm"
                style={{ borderColor: borderColor.replace('border-', '') }}>
                <h3 className={`font-bold ${textColor} mb-1`}>
                    {isCurrentPlayer ? 'Your' : 'Their'} Words:
                </h3>
                <p className="text-gray-500 italic text-center py-2">
                    No words played yet
                </p>
            </div>
        );
    }

    return (
        <div className="w-full p-2 my-2 max-h-28 overflow-y-auto border-2 border-opacity-70 rounded-lg bg-white text-sm"
            style={{ borderColor: borderColor.replace('border-', '') }}>
            <h3 className={`font-bold ${textColor} mb-1`}>
                {isCurrentPlayer ? 'Your' : 'Their'} Words:
            </h3>
            <div className="grid grid-cols-2 gap-1">
                {words.map((word, index) => (
                    <span
                        key={index}
                        className={`text-sm font-medium ${isCurrentPlayer ? 'bg-blue-100' : 'bg-red-100'
                            } rounded px-1 py-0.5 truncate`}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default WordsList;