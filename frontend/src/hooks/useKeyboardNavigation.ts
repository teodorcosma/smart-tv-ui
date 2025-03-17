import { useEffect } from 'react';
// Update imports to use relative paths
import { Video } from '../types';

interface KeyboardNavigationProps {
  focusedIndex: number;
  videosLength: number;
  isPlaying: boolean;
  isFullscreen: boolean;
  showStats: boolean;
  videos: Video[];
  setFocusedIndex: (index: number) => void;
  togglePlay: () => void;
  seekVideo: (seconds: number) => void;
  toggleFullscreen: (enter: boolean) => void;
  setShowStats: (show: boolean) => void;
  setSelectedVideo: (video: Video) => void;
  setCurrentTime: (time: number) => void;
}

export function useKeyboardNavigation({
  focusedIndex,
  videosLength,
  isPlaying,
  isFullscreen,
  showStats,
  videos,
  setFocusedIndex,
  togglePlay,
  seekVideo,
  toggleFullscreen,
  setShowStats,
  setSelectedVideo,
  setCurrentTime,
}: KeyboardNavigationProps) {
  useEffect(() => {
    // Set up keyboard event listener for the entire document
    const handleKeyDown = (e: KeyboardEvent) => {
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
          if (focusedIndex < videosLength - 1) {
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
        case "s": // Toggle stats
          e.preventDefault();
          setShowStats(!showStats);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    focusedIndex, 
    videosLength, 
    isPlaying, 
    isFullscreen, 
    showStats,
    videos,
    setFocusedIndex,
    togglePlay,
    seekVideo,
    toggleFullscreen,
    setShowStats,
    setSelectedVideo,
    setCurrentTime
  ]);
}
