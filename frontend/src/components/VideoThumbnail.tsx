import React, { useEffect, useRef } from 'react';

interface VideoThumbnailProps {
  src: string | null;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Load the video and pause it at the first frame
    const video = videoRef.current;
    if (video && src) {
      // Reset the video element
      video.pause();
      video.removeAttribute('src');
      video.load();

      // Set the new source
      video.src = src;
      video.muted = true;
      video.preload = 'metadata';

      // Set a small currentTime to ensure we get the first frame not a black screen
      video.currentTime = 0.1;
      // Some browsers need this for the currentTime to take effect
      video.load();
    }
  }, [src]);

  if (!src) return (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
      <span className="text-xs text-gray-400">No preview</span>
    </div>
  );

  return (
    <video 
      ref={videoRef}
      className="w-full h-full object-cover"
      preload="metadata"
    />
  );
};

export default VideoThumbnail;
