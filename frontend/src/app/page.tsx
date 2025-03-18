"use client";

import { useEffect } from "react";
import VideoList from "../components/VideoList";
import VideoPlayer from "../components/VideoPlayer";
import { useVideoState } from "../hooks/useVideoState";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";

export default function Home() {
  const {
    videos,
    selectedVideo,
    focusedIndex,
    isPlaying,
    isFullscreen,
    currentTime,
    videoRefs,
    setVideos,
    setSelectedVideo,
    setFocusedIndex,
    setCurrentTime,
    togglePlay,
    seekVideo,
    toggleFullscreen,
    handlePlayerReady,
    getVideoSource
  } = useVideoState();

  // Set up keyboard navigation
  useKeyboardNavigation({
    focusedIndex,
    videosLength: videos.length,
    isPlaying,
    isFullscreen,
    videos,
    setFocusedIndex,
    togglePlay,
    seekVideo,
    toggleFullscreen,
    setSelectedVideo,
    setCurrentTime
  });

  // Fetch videos from API
  useEffect(() => {
    fetch("/api/videos")
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Just use the direct URL, no HLS
          const enhancedVideos = data.map(video => ({
            ...video,
            url: video.url
          }));
          setVideos(enhancedVideos);
          if (enhancedVideos.length > 0) {
            setSelectedVideo(enhancedVideos[0]); // Auto-select first video
          }
        }
      })
      .catch(error => console.error("Error fetching videos:", error));
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (videoRefs.current[focusedIndex]) {
      videoRefs.current[focusedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [focusedIndex, videoRefs]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Instructions Bar */}
      <div className="bg-gray-800 p-2 text-sm text-center">
        <p>Use arrow keys to navigate, Enter to select, Space/K to play/pause, J/L to seek, F for fullscreen</p>
      </div>

      {/* Main Content */}
      {isFullscreen ? (
        // Fullscreen Video Player
        <div className="flex-1 bg-black">
          {selectedVideo && getVideoSource(selectedVideo.url) && (
            <VideoPlayer
              src={getVideoSource(selectedVideo.url) || ''}
              poster=""
              autoplay={true}
              controls={true}
              width="100%"
              height="100%"
              className="w-full h-full"
              currentTime={currentTime}
              onReady={handlePlayerReady}
            />
          )}
        </div>
      ) : (
        // Normal View with List and Player
        <div className="flex-1 flex">
          {/* Video List */}
          <VideoList
            videos={videos}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
            setSelectedVideo={setSelectedVideo}
            videoRefs={videoRefs}
            getVideoSource={getVideoSource}
          />
          
          {/* Video Player */}
          <div className="w-3/5 bg-black h-full">
            {selectedVideo ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 relative">
                  {selectedVideo && getVideoSource(selectedVideo.url) && (
                    <VideoPlayer
                      src={getVideoSource(selectedVideo.url) || ''}
                      poster=""
                      autoplay={isPlaying}
                      controls={true}
                      width="100%"
                      height="100%"
                      className="w-full h-full"
                      currentTime={currentTime}
                      onReady={handlePlayerReady}
                    />
                  )}
                </div>
                
                {/* Simple Playback Controls */}
                <div className="p-4 bg-gray-800">
                  <div className="flex justify-center space-x-4">
                    <button
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium"
                      onClick={() => seekVideo(-10)}
                    >
                      -10s (J)
                    </button>
                    <button
                      className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-medium"
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