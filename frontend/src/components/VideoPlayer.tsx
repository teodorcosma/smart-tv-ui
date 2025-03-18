import { useEffect, useState, useRef } from "react";
import { VideoPlayerProps } from "../types";

// Simplified Video Player focused on basic playback
const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  onReady, 
  autoplay = false, 
  controls = true, 
  width = "100%", 
  height = "100%", 
  className = "", 
  currentTime = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

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
          console.error("Autoplay failed:", e);
        });
      }
    }
    
    setIsInitialized(true);
  };
  
  // Initialize player
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !src) return;
    
    // Reset state when source changes
    setIsInitialized(false);
    setErrorMessage('');
    setRetryCount(0);
    
    // Use native video API
    console.log('Playing video:', src);
    videoElement.src = src;
    videoElement.load();
    videoElement.addEventListener('loadedmetadata', handleInitialization, { once: true });
    
    // Handle errors
    const handleError = () => {
      console.error('Video playback error');
      setErrorMessage('Video playback error. Trying to recover...');
      
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          videoElement.src = src;
          videoElement.load();
          videoElement.addEventListener('loadedmetadata', handleInitialization, { once: true });
        }, 2000);
      } else {
        setErrorMessage('Unable to play this video. Please try again later.');
      }
    };
    
    videoElement.addEventListener('error', handleError);
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleInitialization);
      videoElement.removeEventListener('error', handleError);
    };
  }, [src, retryCount, autoplay, currentTime]);
  
  // Event listeners setup
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !isInitialized) return;
    
    // Define event handlers
    const handlePlay = () => onReady?.({ player: videoElement, event: 'play' });
    const handlePause = () => onReady?.({ player: videoElement, event: 'pause' });
    const handleTimeUpdate = () => onReady?.({ player: videoElement, event: 'timeupdate' });
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    
    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    
    // Clean up
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
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
  
  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        controls={controls}
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
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
    </div>
  );
};

export default VideoPlayer;
