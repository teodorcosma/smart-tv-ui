// Video data structure
export type Video = {
  id: number;
  title: string;
  url: string;
  hlsUrl?: string;
  thumbnail?: string;
  qualities?: QualityOption[];
};

// Video statistics information
export type VideoStats = {
  droppedFrames: number;
  totalFrames: number;
  bufferLength: number;
  bandwidth: number;
  loadLatency: number;
  currentLevel: number;
  levels: any[];
};

// Player event data structure
export type PlayerEvent = {
  player: HTMLVideoElement;
  event?: string;
};

// Network information API definition
export interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly effectiveType: string;
  readonly rtt: number;
  onchange: ((this: NetworkInformation, ev: Event) => any) | null;
}

// Extend Navigator type globally
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

// Network info data structure
export type NetworkInfo = {
  downlink: number;
  effectiveType: string;
  rtt: number;
};

// Quality option for video streams
export type QualityOption = {
  label: string;
  value: string;
};

// Video player props definition
export interface VideoPlayerProps {
  src: string;
  poster?: string;
  onReady?: (event: PlayerEvent) => void;
  autoplay?: boolean;
  controls?: boolean;
  width?: string;
  height?: string;
  className?: string;
  currentTime?: number;
  selectedQuality?: string;
  showStats?: boolean;
}

// Standard quality options
export const QUALITY_OPTIONS: QualityOption[] = [
  { label: "Auto", value: "auto" },
  { label: "Low (1 Mbps)", value: "1000" },
  { label: "Medium (3 Mbps)", value: "3000" },
  { label: "High (5 Mbps)", value: "5000" },
  { label: "Ultra (8 Mbps)", value: "8000" }
];
