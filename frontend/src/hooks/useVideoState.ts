import { useState, useRef, useCallback } from 'react';
import { Video, PlayerEvent } from '../types';

export function useVideoState() {
  // State management
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Refs
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  // Function to handle player events
  const handlePlayerReady = useCallback(({ player, event }: PlayerEvent) => {
    playerRef.current = player;
    
    // Handle specific events
    if (event === 'play') {
      setIsPlaying(true);
    } else if (event === 'pause') {
      setIsPlaying(false);
    } else if (event === 'timeupdate') {
      // Only update time state occasionally to avoid too many re-renders
      if (player && Math.abs(player.currentTime - currentTime) > 1) {
        setCurrentTime(player.currentTime);
      }
    }
  }, [currentTime]);

  // Function to seek forward/backward by specified seconds
  const seekVideo = useCallback((seconds: number) => {
    if (playerRef.current) {
      const player = playerRef.current;
      const currentTime = player.currentTime;
      const duration = player.duration || 0;
      const newTime = Math.min(Math.max(0, currentTime + seconds), duration);
      player.currentTime = newTime;
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      const playPromise = playerRef.current.play();
      if (playPromise) {
        playPromise.catch((e) => {
          console.error("Play failed:", e);
        });
      }
    }
  }, [isPlaying]);

  // Enter/exit fullscreen
  const toggleFullscreen = useCallback((enter: boolean) => {
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
            playerRef.current.play().catch((e) => {
              console.error("Fullscreen play failed:", e);
            });
          }
        }, 200);
      }
    }
  }, [selectedVideo]);

  // Native fullscreen API
  const enterNativeFullscreen = useCallback(() => {
    if (playerRef.current && playerRef.current.requestFullscreen) {
      playerRef.current.requestFullscreen().catch((e) => {
        console.error("Fullscreen request failed:", e);
      });
    }
  }, []);

  // Function to get video source - simplified to return the direct URL
  const getVideoSource = useCallback((url: string): string | null => {
    if (!url) return null;
    return url;
  }, []);

  return {
    // State
    videos,
    selectedVideo,
    focusedIndex,
    isPlaying,
    isFullscreen,
    currentTime,
    playerRef,
    videoRefs,
    
    // State setters
    setVideos,
    setSelectedVideo,
    setFocusedIndex,
    setIsPlaying,
    setIsFullscreen,
    setCurrentTime,
    
    // Actions
    togglePlay,
    seekVideo,
    toggleFullscreen,
    enterNativeFullscreen,
    handlePlayerReady,
    getVideoSource
  };
}
