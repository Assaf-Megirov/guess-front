import { GameStatus } from "./GameStatus";

export interface GameState {
    id: string;
    players: string[];
    state: GameStatus;
    playerData: Map<string, {
      points: number;
      letters: string;
      written: string;
      words: string[];
      username: string;
      isPlaying: boolean;
    }>;
    elapsedTime: number;
  }