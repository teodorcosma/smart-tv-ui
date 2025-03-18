import { useEffect } from 'react';
import { Video } from '../types';

interface UseKeyboardNavigationProps {
  focusedIndex: number;
  videosLength: number;
  isPlaying: boolean;
  isFullscreen: boolean;
  videos: Video[];
  setFocusedIndex: (index: number) => void;
  togglePlay: () => void;
  seekVideo: (seconds: number) => void;
  toggleFullscreen: (enter: boolean) => void;
  setSelectedVideo: (video: Video) => void;
  setCurrentTime: (time: number) => void;
}

export function useKeyboardNavigation({
  focusedIndex,
  videosLength,
  isPlaying,
  isFullscreen,
  videos,
  setFocusedIndex,
  togglePlay,
  seekVideo,
  toggleFullscreen,
  setSelectedVideo,
  setCurrentTime
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If in fullscreen or playing mode, handle playback controls
      if (isFullscreen || isPlaying) {
        switch (e.key) {
          case "f":
            e.preventDefault();
            toggleFullscreen(true);
            break;
          case "Escape":
            e.preventDefault();
            toggleFullscreen(false);
            break;
          case "k":
          case " ":
            e.preventDefault();
            togglePlay();
            break;
          case "l":
            e.preventDefault();
            seekVideo(10);
            break;
          case "j":
            e.preventDefault();
            seekVideo(-10);
            break;
        }
        return;
      }
      
      // If not in playback mode, handle navigation
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
        case "Enter":
          e.preventDefault();
          if (videos[focusedIndex]) {
            setSelectedVideo(videos[focusedIndex]);
            setCurrentTime(0); // Reset time when changing videos
          }
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen(true);
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
    videos,
    setFocusedIndex,
    togglePlay,
    seekVideo,
    toggleFullscreen,
    setSelectedVideo,
    setCurrentTime
  ]);
}
