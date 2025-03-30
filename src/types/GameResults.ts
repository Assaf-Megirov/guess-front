export interface GameResults{
    gameId: string;
    elapsedTime: number;
    winner: string;
    scores: {
        [key: string]: number;
    };
}

