export interface PlayerData {
    id: string;
    username: string;
    points: number;
    letters: string;
    written: string;
    words: string[];
    previousRank?: number;
    currentRank?: number;
    isPlaying: boolean;
  }

export default PlayerData;