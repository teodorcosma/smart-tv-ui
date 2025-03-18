import React from 'react';

interface VideoUrlSelectorProps {
  currentUrl: string;
  onChange: (url: string) => void;
}

const VideoUrlSelector: React.FC<VideoUrlSelectorProps> = ({ currentUrl, onChange }) => {
  // Add all your available video URLs here
  const videoOptions = [
    { 
      value: "http://localhost:5000/api/videos/hls/13138827_1280_720_30fps/master.m3u8", 
      label: "Local HLS: 13138827_1280_720_30fps" 
    },
    { 
      value: "http://localhost:5000/videos/13138827_1280_720_30fps.mp4", 
      label: "Local MP4: 13138827_1280_720_30fps" 
    },
    { 
      value: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", 
      label: "Public HLS: Mux test stream" 
    },
    { 
      value: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8", 
      label: "Public HLS: Bitmovin test stream" 
    }
  ];

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-white mb-2">Select Video Source</h3>
      <select 
        className="w-full p-2 rounded bg-gray-700 text-white"
        value={currentUrl}
        onChange={(e) => onChange(e.target.value)}
      >
        {videoOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VideoUrlSelector;
