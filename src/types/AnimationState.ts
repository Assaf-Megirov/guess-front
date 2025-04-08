interface AnimationState {
    [playerId: string]: {
      valid: boolean;
      invalid: boolean;
      points: boolean;
    };
  }

export default AnimationState;