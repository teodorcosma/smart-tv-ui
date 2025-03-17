import { useEffect, useState, useRef } from "react";
import Hls, { Events, FragLoadedData } from 'hls.js';
// Update imports to use relative paths
import { VideoPlayerProps, VideoStats, NetworkInfo } from "../types";
import StatsOverlay from "./StatsOverlay";

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
  selectedQuality = "auto",
  showStats = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    downlink: 0,
    effectiveType: '',
    rtt: 0
  });

  const [videoStats, setVideoStats] = useState<VideoStats>({
    droppedFrames: 0,
    totalFrames: 0,
    bufferLength: 0,
    bandwidth: 0,
    loadLatency: 0,
    currentLevel: -1,
    levels: [],
  });

  // Monitor network conditions
  useEffect(() => {
    if (!navigator.connection) return;
    
    const connection = navigator.connection;
    
    // Initial network info
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
        hlsRef.current.currentLevel = -1;
      }
    };
    
    connection.addEventListener('change', updateNetworkInfo);
    
    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, [selectedQuality]);
  
  // Update video stats regularly
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
        loadLatency: lastLoadTime,
        currentLevel: hls.currentLevel,
        levels: hls.levels || [],
      });
    };

    const statsInterval = setInterval(updateStats, 1000);
    
    // Add HLS stats listeners
    hls.on(Events.FRAG_LOADED, (_, data: FragLoadedData) => {
      const loadingTime = data.frag.stats.loading.end - data.frag.stats.loading.start;
      setLastLoadTime(loadingTime);
    });

    return () => {
      clearInterval(statsInterval);
    };
  }, [isInitialized, lastLoadTime]);
  
  // Initialize HLS or native player
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !src) return;
    
    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Reset state when source changes
    setIsInitialized(false);
    setErrorMessage('');
    setRetryCount(0);
    
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
        if (process.env.NODE_ENV === 'development') {
          console.log('HLS manifest parsed, available levels:', hls.levels);
        }
        
        // Set specific quality level if selected
        if (selectedQuality !== 'auto') {
          const levelIndex = getQualityLevel(selectedQuality);
          if (levelIndex !== -1) {
            hls.currentLevel = levelIndex;
          }
        }
        
        handleInitialization();
      });
      
      // Log quality level changes in development
      if (process.env.NODE_ENV === 'development') {
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          console.log(`HLS quality changed to level ${data.level} (${hls.levels[data.level]?.bitrate / 1000} kbps)`);
        });
      }
      
      // Handle HLS errors
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('HLS error:', data);
        }
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover network error
              hls.startLoad();
              break;
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
              
            default:
              // Cannot recover
              hls.destroy();
              
              // Show error and retry
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
      
      hlsRef.current = hls;
    } else {
      // Use native video player for non-HLS sources
      videoElement.src = src;
      videoElement.load();
      
      videoElement.addEventListener('loadedmetadata', handleInitialization, { once: true });
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoElement.removeEventListener('loadedmetadata', handleInitialization);
    };
  }, [src, selectedQuality, retryCount]);
  
  // Helper function to get quality level index
  const getQualityLevel = (quality: string): number => {
    if (quality === 'auto') return -1; // Auto level
    
    if (!hlsRef.current || !hlsRef.current.levels) return -1;
    
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
    
    // If still no match, return the lowest quality level
    return 0;
  };
  
  // Handler for video initialization
  const handleInitialization = () => {
    const videoElement = videoRef.current;
    if (!videoElement || isInitialized) return;
    
    // Register the player with parent
    onReady?.({ player: videoElement });
    
    // Set initial position
    if (currentTime > 0) {
      videoElement.currentTime = currentTime;
    }
    
    // Handle autoplay
    if (autoplay) {
      const playPromise = videoElement.play();
      if (playPromise) {
        playPromise.catch(e => {
          if (process.env.NODE_ENV === 'development') {
            console.error("Autoplay failed:", e);
          }
        });
      }
    }
    
    setIsInitialized(true);
  };
  
  // Event listeners setup
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !isInitialized) return;
    
    // Define event handlers
    const handlePlay = () => onReady?.({ player: videoElement, event: 'play' });
    const handlePause = () => onReady?.({ player: videoElement, event: 'pause' });
    const handleTimeUpdate = () => onReady?.({ player: videoElement, event: 'timeupdate' });
    const handleError = (e: ErrorEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.error("Video error:", e);
      }
    };
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    
    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('error', handleError as EventListener);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    
    // Clean up
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
    
    if (selectedQuality === 'auto') {
      hlsRef.current.currentLevel = -1;
      if (process.env.NODE_ENV === 'development') {
        console.log('Switched to automatic quality level');
      }
    } else {
      const qualityLevel = getQualityLevel(selectedQuality);
      if (qualityLevel !== -1) {
        hlsRef.current.currentLevel = qualityLevel;
        if (process.env.NODE_ENV === 'development') {
          console.log(`Manually set quality level to ${qualityLevel}`);
        }
      }
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
      
      {showStats && <StatsOverlay stats={videoStats} networkInfo={networkInfo} />}
      
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

export default VideoPlayer;
