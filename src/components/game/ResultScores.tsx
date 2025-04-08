interface ResultScoresProps {
    rankedPlayers: {id: string, score: {points: number}, isCurrentPlayer: boolean, username: string}[];  //TODO: create a type for this as seen in the GameResultsPanel in the getPlayersByRank function
}

const ResultScores = ({ rankedPlayers }: ResultScoresProps) => {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-center">Final Scores</h2>
        <div className="space-y-2">
          {rankedPlayers.map((player: {id: string, score: {points: number}, isCurrentPlayer: boolean, username: string}, index: number) => (
            <div 
              key={player.id} 
              className={`flex justify-between p-3 rounded-lg ${
                player.isCurrentPlayer 
                  ? 'bg-blue-100 border-2 border-blue-300' 
                  : 'bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl font-bold mr-2">#{index + 1}</span>
                <span className="font-medium">
                  {player.isCurrentPlayer ? 'You' : player.username}
                </span>
              </div>
              <div className="text-xl font-bold">
                {player.score.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

export default ResultScores;