export type JourneyStage = 
  | 'home'
  | 'thought'
  | 'journey'
  | 'breath'
  | 'drift'
  | 'completion';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AnimationOptions {
  reduceMotion?: boolean;
  durationMultiplier?: number;
}
