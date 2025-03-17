import React, { useState, useEffect } from 'react';
import StatsOverlay from './StatsOverlay';
import { VideoStats, NetworkInfo } from '../types';

// Mock data for testing
const mockVideoStats: VideoStats = {
  currentLevel: 2,
  levels: [
    { height: 240, bitrate: 400000 },
    { height: 360, bitrate: 800000 },
    { height: 480, bitrate: 1200000 },
    { height: 720, bitrate: 2500000 },
    { height: 1080, bitrate: 5000000 }
  ],
  bufferLength: 3.5,
  bandwidth: 3200000,
  loadLatency: 150,
  droppedFrames: 12,
  totalFrames: 1200
};

const mockNetworkInfo: NetworkInfo = {
  effectiveType: '4g',
  downlink: 5.2,
  rtt: 32
};

const TestStatsOverlay: React.FC = () => {
  const [showStats, setShowStats] = useState(true);
  const [stats, setStats] = useState<VideoStats>(mockVideoStats);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(mockNetworkInfo);

  // Optional: simulate changing stats over time
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        bufferLength: Math.max(0, prev.bufferLength + (Math.random() - 0.5)),
        droppedFrames: prev.droppedFrames + (Math.random() > 0.8 ? 1 : 0),
        totalFrames: prev.totalFrames + 5
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* Video placeholder */}
      <div className="absolute inset-0 flex items-center justify-center text-white">
        <div className="text-2xl">Video Content Area</div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 z-10">
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>

      {/* Stats overlay */}
      {showStats && <StatsOverlay stats={stats} networkInfo={networkInfo} />}
    </div>
  );
};

export default TestStatsOverlay;
