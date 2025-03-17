"use client";

import { useEffect, useState, useRef } from "react";
// Update imports to use relative paths
import VideoPlayer from "../components/VideoPlayer";
import VideoList from "../components/VideoList";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useVideoState } from "../hooks/useVideoState";
import { Video, PlayerEvent } from "../types";

export default function Home() {
  const {
    videos,
    selectedVideo,
    focusedIndex,
    isPlaying,
    isFullscreen,
    selectedQuality,
    currentTime,
    showStats,
    playerRef,
    videoRefs,
    
    setVideos,
    setSelectedVideo,
    setFocusedIndex,
    setIsPlaying,
    setShowStats,
    setCurrentTime,
    
    togglePlay,
    seekVideo,
    toggleFullscreen,
    enterNativeFullscreen,
    handleQualityChange,
    handlePlayerReady,
  } = useVideoState();

  // Set up keyboard navigation
  useKeyboardNavigation({
    focusedIndex,
    videosLength: videos.length,
    isPlaying,
    isFullscreen,
    setFocusedIndex,
    togglePlay,
    seekVideo,
    toggleFullscreen,
    setShowStats,
    showStats,
    videos,
    setSelectedVideo,
    setCurrentTime: (time) => setCurrentTime(time),
  });

  // Fetch videos from API
  useEffect(() => {
    fetch("http://localhost:5000/api/videos")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const enhancedVideos = data.map(video => ({
            ...video,
            url: video.hlsUrl || video.url // Prefer HLS URL if available
          }));
          setVideos(enhancedVideos);
          setSelectedVideo(enhancedVideos[0]); // Auto-select first video
        }
      })
      .catch((error) => console.error("Error fetching videos:", error));
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (videoRefs.current[focusedIndex]) {
      videoRefs.current[focusedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [focusedIndex]);

  // Helper function to get full video URL
  const getVideoSource = (url: string): string | null => {
    if (!url) return null;
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
              selectedQuality={selectedQuality}
              onReady={handlePlayerReady}
              showStats={showStats}
            />
          )}
          
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
          <VideoList 
            videos={videos}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
            setSelectedVideo={setSelectedVideo}
            videoRefs={videoRefs}
            getVideoSource={getVideoSource}
          />

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
                    
                    <div className="flex items-center">
                      <label htmlFor="quality-select" className="mr-2 text-sm">Quality:</label>
                      <select 
                        id="quality-select"
                        value={selectedQuality}
                        onChange={handleQualityChange}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
                      >
                        {[
                          { label: "Auto", value: "auto" },
                          { label: "Low (1 Mbps)", value: "1000" },
                          { label: "Medium (3 Mbps)", value: "3000" },
                          { label: "High (5 Mbps)", value: "5000" },
                          { label: "Ultra (8 Mbps)", value: "8000" }
                        ].map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-grow bg-black rounded-lg overflow-hidden">
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
                      selectedQuality={selectedQuality}
                      onReady={handlePlayerReady}
                      showStats={showStats}
                    />
                  )}
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