// Types for the Smart TV UI application

// Video item structure
export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  thumbnail?: string;
}

// Player event structure
export interface PlayerEvent {
  player: HTMLVideoElement;
  event?: 'play' | 'pause' | 'timeupdate' | 'error';
}

// Video player props
export interface VideoPlayerProps {
  src: string;
  poster?: string;
  onReady?: (event: PlayerEvent) => void;
  autoplay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  currentTime?: number;
}
