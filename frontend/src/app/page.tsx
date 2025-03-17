"use client";

import { useEffect, useState, useRef } from "react";
import React from 'react';
import Hls, { Events, FragLoadedData } from 'hls.js';

type Video = {
  id: number;
  title: string;
  url: string;
  hlsUrl?: string;
  thumbnail?: string;
  qualities?: { label: string; value: string }[];
};
type VideoStats = {
  droppedFrames: number;
  totalFrames: number;
  bufferLength: number;
  bandwidth: number;
  loadLatency: number;
  currentLevel: number;
  levels: any[];
};
// Player event type
type PlayerEvent = {
  player: HTMLVideoElement;
  event?: string;
};

// NetworkInformation API interface
interface NetworkInformation extends EventTarget {
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

// Network info type
type NetworkInfo = {
  downlink: number;
  effectiveType: string;
  rtt: number;
};

// Quality options
const QualityOptions = [
  { label: "Auto", value: "auto" },
  { label: "Low (1 Mbps)", value: "1000" },
  { label: "Medium (3 Mbps)", value: "3000" },
  { label: "High (5 Mbps)", value: "5000" },
  { label: "Ultra (8 Mbps)", value: "8000" }
];

// Video player props type
interface VideoPlayerProps {
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
}

// Thumbnail component that uses the video itself to show the first frame
const VideoThumbnail: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Load the video and pause it at the first frame
    const video = videoRef.current;
    if (video) {
      // Set a small currentTime to ensure we get the first frame not a black screen
      video.currentTime = 0.1;
      // Some browsers need this for the currentTime to take effect
      video.load();
    }
  }, [src]);

  return (
    <video 
      ref={videoRef}
      className="w-full h-full object-cover"
      src={src}
      preload="metadata"
      muted
      playsInline
    />
  );
};
// Add this component before the VideoPlayer component
const StatsOverlay: React.FC<{ stats: VideoStats; networkInfo: NetworkInfo }> = ({
  stats,
  networkInfo,
}) => {
  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-80 p-3 rounded text-xs font-mono text-white space-y-1">
      <div className="text-blue-400 font-semibold mb-2">Video Statistics</div>
      
      {/* Playback Quality */}
      <div className="border-b border-gray-700 pb-1 mb-1">
        <div>Resolution: {stats.levels[stats.currentLevel]?.height || 'Auto'}p</div>
        <div>Bitrate: {((stats.levels[stats.currentLevel]?.bitrate || 0) / 1000000).toFixed(2)} Mbps</div>
        <div>Level: {stats.currentLevel === -1 ? 'Auto' : stats.currentLevel}</div>
      </div>
      
      {/* Network Stats */}
      <div className="border-b border-gray-700 pb-1 mb-1">
        <div>Network: {networkInfo.effectiveType}</div>
        <div>Bandwidth: {networkInfo.downlink.toFixed(1)} Mbps</div>
        <div>RTT: {networkInfo.rtt}ms</div>
      </div>
      
      {/* Buffer Health */}
      <div className="border-b border-gray-700 pb-1 mb-1">
        <div>Buffer: {stats.bufferLength.toFixed(1)}s</div>
        <div>Network BW: {(stats.bandwidth / 1000000).toFixed(2)} Mbps</div>
        <div>Load Time: {stats.loadLatency}ms</div>
      </div>
      
      {/* Frame Stats */}
      <div>
        <div>Dropped Frames: {stats.droppedFrames}</div>
        <div>Total Frames: {stats.totalFrames}</div>
        <div>Drop Rate: {((stats.droppedFrames / stats.totalFrames) * 100 || 0).toFixed(1)}%</div>
      </div>
    </div>
  );
};

// Enhanced Video Player with HLS support
const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  onReady, 
  autoplay = false, 
  controls = true, 
  width = "100%", 
  height = "100%", 
  className = "", 
  currentTime = 0,
  selectedQuality = "auto"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
const [isBuffering, setIsBuffering] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
const [retryCount, setRetryCount] = useState(0);
const [lastLoadTime, setLastLoadTime] = useState(0);
const [showStats, setShowStats] = useState(false); // Add this line here
const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
  downlink: 0,
  effectiveType: '',
  rtt: 0
});
  // Add this state to your VideoPlayer component
const [videoStats, setVideoStats] = useState<VideoStats>({
  droppedFrames: 0,
  totalFrames: 0,
  bufferLength: 0,
  bandwidth: 0,
  loadLatency: 0,
  currentLevel: -1,
  levels: [],
});

// Add this useEffect after your existing effects in VideoPlayer
useEffect(() => {
  const videoElement = videoRef.current;
  const hls = hlsRef.current;
  if (!videoElement || !isInitialized || !hls) return;

  const updateStats = () => {
    const quality = videoElement.getVideoPlaybackQuality?.();
    setVideoStats({
      droppedFrames: quality?.droppedVideoFrames || 0,
      totalFrames: quality?.totalVideoFrames || 0,
      bufferLength: hls.media?.buffered && hls.media.buffered.length > 0 
        ? hls.media.buffered.end(hls.media.buffered.length - 1) - hls.media.currentTime 
        : 0,
      bandwidth: hls.bandwidthEstimate,
      loadLatency: lastLoadTime, // Use the state instead of direct access
      currentLevel: hls.currentLevel,
      levels: hls.levels || [],
    });
  };

  const statsInterval = setInterval(updateStats, 1000);
  
  // Add HLS stats listeners
  hls.on(Events.FRAG_LOADED, (_, data: FragLoadedData) => {
    const loadingTime = data.frag.stats.loading.end - data.frag.stats.loading.start;
    setLastLoadTime(loadingTime);
    setVideoStats(prev => ({
      ...prev,
      loadLatency: loadingTime,
    }));
  });

  return () => {
    clearInterval(statsInterval);
  };
}, [isInitialized, lastLoadTime]);

// Add the StatsOverlay to your VideoPlayer JSX, right after the error message component
{showStats && <StatsOverlay stats={videoStats} networkInfo={networkInfo} />}  
  // Monitor network conditions
  useEffect(() => {
    // @ts-ignore - TS doesn't recognize navigator.connection but it exists in modern browsers
    if (!navigator.connection) return;
    
    const connection = navigator.connection as any;
    
    // Initial value
    setNetworkInfo({
      downlink: connection.downlink || 0,
      effectiveType: connection.effectiveType || '',
      rtt: connection.rtt || 0
    });
    
    // Update when network changes
    const updateNetworkInfo = () => {
      setNetworkInfo({
        downlink: connection.downlink || 0,
        effectiveType: connection.effectiveType || '',
        rtt: connection.rtt || 0
      });
      
      // Optionally adjust HLS level based on network conditions
      if (hlsRef.current && selectedQuality === 'auto') {
        // Set currentLevel to -1 to enable automatic quality selection
        hlsRef.current.currentLevel = -1;
      }
    };
    
    connection.addEventListener('change', updateNetworkInfo);
    
    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, [selectedQuality]);
  
  // Initialize HLS or native player
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !src) return;
    
    // Clean up previous HLS instance if it exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Reset state when source changes
    setIsInitialized(false);
    setErrorMessage('');
    setRetryCount(0);
    
    // Check if the source is an HLS stream
    const isHlsSource = src.includes('.m3u8');
    
    if (isHlsSource && Hls.isSupported()) {
      // Use HLS.js for HLS streams
      const hls = new Hls({
        debug: false,
        startLevel: selectedQuality === 'auto' ? -1 : getQualityLevel(selectedQuality),
        capLevelToPlayerSize: selectedQuality === 'auto',
        maxBufferLength: 30
      });
      
      hls.loadSource(src);
      hls.attachMedia(videoElement);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, available levels:', hls.levels);
        
        // Set specific quality level if selected
        if (selectedQuality !== 'auto') {
          const levelIndex = getQualityLevel(selectedQuality);
          if (levelIndex !== -1) {
            hls.currentLevel = levelIndex;
          }
        }
        
        // Continue with video initialization
        handleInitialization();
      });
      
      // Log quality level changes in development
      if (process.env.NODE_ENV === 'development') {
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          console.log(`HLS quality changed to level ${data.level} (${hls.levels[data.level]?.bitrate / 1000} kbps)`);
        });
      }
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover network error
              console.log('Fatal network error, trying to recover');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error, trying to recover');
              hls.recoverMediaError();
              break;
            default:
              // Cannot recover
              console.error('Fatal error, cannot recover:', data);
              hls.destroy();
              
              // Show error and implement retry mechanism
              setErrorMessage('Video playback error. Trying to recover...');
              if (retryCount < 3) {
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                  hls.loadSource(src);
                  hls.attachMedia(videoElement);
                }, 2000);
              } else {
                setErrorMessage('Unable to play this video. Please try again later.');
              }
              break;
          }
        }
      });
      
      // Store HLS instance for later use/cleanup
      hlsRef.current = hls;
    } else {
      // Use native video player for non-HLS sources
      videoElement.src = src;
      videoElement.load();
      
      // Listen for metadata loaded
      videoElement.addEventListener('loadedmetadata', handleInitialization, { once: true });
    }
    
    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoElement.removeEventListener('loadedmetadata', handleInitialization);
    };
  }, [src, selectedQuality, retryCount]);
  
  // Helper function to get quality level index from quality string
  const getQualityLevel = (quality: string): number => {
    if (quality === 'auto') return -1; // Auto level
    
    if (!hlsRef.current || !hlsRef.current.levels) return -1;
    
    // Map quality string to level index based on bitrate ranges
    const levels = hlsRef.current.levels;
    
    switch (quality) {
      case '1000': // Low quality (up to 1 Mbps)
        return findLevelByBitrate(levels, 0, 1000000) || 0;
      case '3000': // Medium quality (1-3 Mbps)
        return findLevelByBitrate(levels, 1000001, 3000000) || 1;
      case '5000': // High quality (3-5 Mbps)
        return findLevelByBitrate(levels, 3000001, 5000000) || 2;
      case '8000': // Ultra quality (>5 Mbps)
        return findLevelByBitrate(levels, 5000001, Infinity) || 3;
      default:
        return -1; // Auto
    }
  };
  
  // Helper to find the closest level matching a bitrate range
  const findLevelByBitrate = (levels: any[], min: number, max: number): number => {
    // First try to find a level in the exact range
    const exactLevel = levels.findIndex(level => level.bitrate >= min && level.bitrate <= max);
    if (exactLevel !== -1) return exactLevel;
    
    // If no exact match, find the closest level
    if (min > 0) {
      // For non-zero min, find the lowest level above min
      const lowestAboveMin = levels.findIndex(level => level.bitrate >= min);
      if (lowestAboveMin !== -1) return lowestAboveMin;
    }
    
    // If still no match, just return the lowest quality level
    return 0;
  };
  
  // Handler for video initialization
  const handleInitialization = () => {
    const videoElement = videoRef.current;
    if (!videoElement || isInitialized) return;
    
    // Register the player with parent once it's fully loaded
    onReady?.({ player: videoElement });
    
    // Handle currentTime initialization
    if (currentTime > 0) {
      videoElement.currentTime = currentTime;
    }
    
    // Handle autoplay if specified
    if (autoplay) {
      const playPromise = videoElement.play();
      if (playPromise) {
        playPromise.catch(e => console.error("Autoplay failed:", e));
      }
    }
    
    setIsInitialized(true);
  };
  
  // Set up event listeners (after initialization)
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !isInitialized) return;
    
    // Define event handlers
    const handlePlay = () => onReady?.({ player: videoElement, event: 'play' });
    const handlePause = () => onReady?.({ player: videoElement, event: 'pause' });
    const handleTimeUpdate = () => onReady?.({ player: videoElement, event: 'timeupdate' });
    const handleError = (e: ErrorEvent) => console.error("Video error:", e);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    
    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('error', handleError as EventListener);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    
    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('error', handleError as EventListener);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
    };
  }, [onReady, isInitialized]);
  
  // Handle currentTime updates
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !isInitialized) return;
    
    if (currentTime > 0 && Math.abs(videoElement.currentTime - currentTime) > 0.5) {
      videoElement.currentTime = currentTime;
    }
  }, [currentTime, isInitialized]);
  
  // Update quality level when it changes
  useEffect(() => {
    if (!isInitialized || !hlsRef.current) return;
    
    const qualityLevel = getQualityLevel(selectedQuality);
    if (selectedQuality === 'auto') {
      hlsRef.current.currentLevel = -1;
      console.log('Switched to automatic quality level');
    } else if (qualityLevel !== -1) {
      hlsRef.current.currentLevel = qualityLevel;
      console.log(`Manually set quality level to ${qualityLevel}`);
    }
  }, [selectedQuality, isInitialized]);
  
  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        controls={controls}
        preload="metadata"
      >
        <source src={src} type={src.includes('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4'} />
        Your browser does not support HTML5 video.
      </video>
      
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white px-4 py-2 rounded bg-gray-800 bg-opacity-80">
            <div className="animate-spin inline-block w-6 h-6 border-4 border-t-blue-500 border-gray-300 rounded-full mr-2"></div>
            Buffering...
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-white p-4 bg-red-900 rounded text-center">
            <div className="text-xl mb-2">⚠️</div>
            {errorMessage}
            {retryCount < 3 && <div className="mt-2">Retrying... ({retryCount}/3)</div>}
          </div>
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && hlsRef.current && (
        <div className="absolute bottom-16 left-4 bg-black bg-opacity-70 p-2 rounded text-xs text-white">
          Network: {networkInfo.effectiveType} ({networkInfo.downlink} Mbps)
          {hlsRef.current.currentLevel >= 0 && hlsRef.current.levels && (
            <div>
              Current quality: {hlsRef.current.levels[hlsRef.current.currentLevel]?.height}p
              ({(hlsRef.current.levels[hlsRef.current.currentLevel]?.bitrate / 1000000).toFixed(1)} Mbps)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [currentTime, setCurrentTime] = useState(0);
  const [showStats, setShowStats] = useState(false);
  
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/videos")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Use HLS URLs if available in the response
          const enhancedVideos = data.map(video => ({
            ...video,
            // Prefer HLS URL if available, fallback to regular URL
            url: video.hlsUrl || video.url
          }));
          setVideos(enhancedVideos);
          setSelectedVideo(enhancedVideos[0]); // Auto-select first video
        }
      })
      .catch((error) => console.error("Error fetching videos:", error));
  }, []);

  // Function to handle player events including seeking
  const handlePlayerReady = ({ player, event }: PlayerEvent) => {
    playerRef.current = player;
    
    // Handle specific events
    if (event === 'play') {
      setIsPlaying(true);
    } else if (event === 'pause') {
      setIsPlaying(false);
    } else if (event === 'timeupdate') {
      // Only update time state occasionally to avoid too many re-renders
      if (Math.abs(player.currentTime - currentTime) > 1) {
        setCurrentTime(player.currentTime);
      }
    }
  };

  // Function to seek forward/backward by specified seconds
  const seekVideo = (seconds: number) => {
    if (playerRef.current) {
      const player = playerRef.current;
      const currentTime = player.currentTime;
      const duration = player.duration || 0;
      const newTime = Math.min(Math.max(0, currentTime + seconds), duration);
      player.currentTime = newTime;
    }
  };

  // This function handles the quality change
  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value;
    setSelectedQuality(newQuality);
    console.log(`Quality changed to: ${newQuality}`);
  };

  // Toggle play/pause with debouncing to prevent rapid toggling
  const togglePlay = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      const playPromise = playerRef.current.play();
      if (playPromise) {
        playPromise.catch(e => console.error("Play failed:", e));
      }
    }
  };

  // Enter/exit fullscreen
  const toggleFullscreen = (enter: boolean) => {
    if (selectedVideo) {
      // Save current time before switching modes
      const time = playerRef.current ? playerRef.current.currentTime : 0;
      setCurrentTime(time);
      setIsFullscreen(enter);
      
      // If entering fullscreen, wait for component to render then play
      if (enter) {
        // Short timeout to ensure the new player is mounted
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.play().catch(e => {
              console.error("Fullscreen play failed:", e);
            });
          }
        }, 200);
      }
    }
  };

  // Native fullscreen API
  const enterNativeFullscreen = () => {
    if (playerRef.current && playerRef.current.requestFullscreen) {
      playerRef.current.requestFullscreen().catch(e => {
        console.error("Fullscreen request failed:", e);
      });
    }
  };

  useEffect(() => {
    // Set up keyboard event listener for the entire document
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case "Escape":
          case "Backspace":
            e.preventDefault();
            toggleFullscreen(false);
            break;
          case "k": // k for play/pause (like YouTube)
            e.preventDefault();
            togglePlay();
            break;
          case "l": // l for forward 10 seconds (like YouTube)
            e.preventDefault();
            seekVideo(10);
            break;
          case "j": // j for backward 10 seconds (like YouTube)
            e.preventDefault();
            seekVideo(-10);
            break;
          case " ": // Space bar also for play/pause
            e.preventDefault();
            togglePlay();
            break;
            // Add this case to your handleKeyDown switch statement in the Home component
            case "s": // Toggle stats
            e.preventDefault();
            setShowStats(!showStats);
            break;
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (focusedIndex > 0) {
            setFocusedIndex(focusedIndex - 1);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (focusedIndex < videos.length - 1) {
            setFocusedIndex(focusedIndex + 1);
          }
          break;
        case "Enter": // Change to only select the video, not go fullscreen
          e.preventDefault();
          if (videos[focusedIndex]) {
            setSelectedVideo(videos[focusedIndex]);
            setCurrentTime(0); // Reset time when changing videos
          }
          break;
        case "f": // f key for fullscreen
          e.preventDefault();
          toggleFullscreen(true);
          break;
        case "k": // k for play/pause in the main view too
          e.preventDefault();
          togglePlay();
          break;
        case "l": // l for forward 10 seconds
          e.preventDefault();
          seekVideo(10);
          break;
        case "j": // j for backward 10 seconds
          e.preventDefault();
          seekVideo(-10);
          break;
        case " ": // Space bar for play/pause
          e.preventDefault();
          togglePlay();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, videos.length, isPlaying, isFullscreen, selectedVideo]);

  useEffect(() => {
    // When focused index changes, scroll the focused item into view
    if (videoRefs.current[focusedIndex]) {
      videoRefs.current[focusedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [focusedIndex]);

  // Get video source URL
  const getVideoSource = (url: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {isFullscreen && selectedVideo ? (
        // Full screen player mode
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 p-3 rounded">
            <h2 className="text-2xl font-semibold">{selectedVideo.title}</h2>
            <p className="text-sm text-gray-400">
              Press ESC to exit fullscreen • K to play/pause • J to rewind 10s • L to forward 10s
            </p>
          </div>
          
          <VideoPlayer
            src={getVideoSource(selectedVideo.url)}
            poster=""
            autoplay={true}
            controls={true}
            width="100%"
            height="100%"
            className="w-full h-full"
            currentTime={currentTime}
            selectedQuality={selectedQuality}
            onReady={handlePlayerReady}
          />
          
          {selectedQuality !== 'auto' && (
            <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-70 px-3 py-1 rounded">
              <p className="text-sm text-white">
                {selectedQuality === '1000' ? 'Low Quality' : 
                 selectedQuality === '3000' ? 'Medium Quality' : 
                 selectedQuality === '5000' ? 'High Quality' : 'Ultra Quality'}
              </p>
            </div>
          )}
        </div>
      ) : (
        // Split view with sidebar and main content
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-2/5 bg-gray-800 h-full overflow-y-auto p-4 relative">
            <h1 className="text-2xl font-bold mb-6">Smart TV Video Library</h1>

            {/* Video List */}
            <div className="space-y-3 pr-6">
              {videos.map((video, index) => (
                <div
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  key={video.id}
                  className={`p-3 rounded cursor-pointer transition-all duration-300 relative ${
                    focusedIndex === index
                      ? "bg-blue-600 shadow-lg z-10 transform"
                      : "bg-gray-700 hover:bg-gray-600 hover:scale-105"
                  }`}
                  onClick={() => {
                    setFocusedIndex(index);
                  }}
                  onDoubleClick={() => {
                    setSelectedVideo(videos[index]);
                    setCurrentTime(0); // Reset time when changing videos
                  }}
                  tabIndex={0}
                >
                  <div className="flex items-center">
                    <div
                      className={`bg-black rounded overflow-hidden flex-shrink-0 mr-3 transition-all duration-300 ${
                        focusedIndex === index ? "w-28 h-16" : "w-16 h-12"
                      }`}
                    >
                      {/* Video thumbnail using the actual video */}
                      <VideoThumbnail src={getVideoSource(video.url)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium transition-all duration-300 truncate ${
                          focusedIndex === index ? "text-base" : "text-sm"
                        }`}
                      >
                        {video.title}
                      </p>
                    </div>
                  </div>

                  {/* Focus indicator */}
                  {focusedIndex === index && (
                    <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="w-3/5 p-6">
            {selectedVideo ? (
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h2 className="text-3xl font-semibold mb-2">
                    {selectedVideo.title}
                  </h2>
                  
                  <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-400">
  Press F to play fullscreen • K to play/pause • J to rewind 10s • L to forward 10s • S to toggle stats
</p>
                    
                    {/* Quality selector */}
                    <div className="flex items-center">
                      <label htmlFor="quality-select" className="mr-2 text-sm">Quality:</label>
                      <select 
                        id="quality-select"
                        value={selectedQuality}
                        onChange={handleQualityChange}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
                      >
                        {QualityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-grow bg-black rounded-lg overflow-hidden">
<VideoPlayer
  src={getVideoSource(selectedVideo.url)}
  poster=""
  autoplay={isPlaying}
  controls={true}
  width="100%"
  height="100%"
  className="w-full h-full"
  currentTime={currentTime}
  selectedQuality={selectedQuality}
  onReady={handlePlayerReady}
/>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
                      onClick={() => toggleFullscreen(true)}
                    >
                      Play Fullscreen (F)
                    </button>
                    <button
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium"
                      onClick={enterNativeFullscreen}
                    >
                      Native Fullscreen
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium"
                      onClick={() => seekVideo(-10)}
                    >
                      -10s (J)
                    </button>
                    <button
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium"
                      onClick={togglePlay}
                    >
                      {isPlaying ? "Pause (K)" : "Play (K)"}
                    </button>
                    <button
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium"
                      onClick={() => seekVideo(10)}
                    >
                      +10s (L)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xl text-gray-400">Select a video to play</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}