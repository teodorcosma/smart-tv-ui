import React, { MutableRefObject } from 'react';
// Update imports to use relative paths
import { Video } from '../types';
import VideoThumbnail from './VideoThumbnail';

interface VideoListProps {
  videos: Video[];
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  setSelectedVideo: (video: Video) => void;
  videoRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  getVideoSource: (url: string) => string | null;
}

const VideoList: React.FC<VideoListProps> = ({
  videos,
  focusedIndex,
  setFocusedIndex,
  setSelectedVideo,
  videoRefs,
  getVideoSource
}) => {
  return (
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
            }}
            tabIndex={0}
          >
            <div className="flex items-center">
              <div
                className={`bg-black rounded overflow-hidden flex-shrink-0 mr-3 transition-all duration-300 ${
                  focusedIndex === index ? "w-28 h-16" : "w-16 h-12"
                }`}
              >
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
  );
};

export default VideoList;
