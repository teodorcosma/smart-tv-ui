import React from 'react';
// Update imports to use relative paths
import { VideoStats, NetworkInfo } from '../types';

interface StatsOverlayProps {
  stats: VideoStats;
  networkInfo: NetworkInfo;
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({
  stats,
  networkInfo,
}) => {
  // Safe access functions with defaults
  const getResolution = () => {
    const level = stats?.levels?.[stats?.currentLevel];
    return level?.height ? `${level.height}p` : 'Auto';
  };

  const getBitrate = () => {
    const level = stats?.levels?.[stats?.currentLevel];
    return ((level?.bitrate || 0) / 1000000).toFixed(2);
  };

  const getDropRate = () => {
    if (!stats?.totalFrames || stats.totalFrames === 0) return '0.0';
    return ((stats.droppedFrames || 0) / stats.totalFrames * 100).toFixed(1);
  };

  // Check if we have valid data
  const hasStats = !!stats;
  const hasNetwork = !!networkInfo;

  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-80 p-3 rounded text-xs font-mono text-white space-y-1">
      <div className="text-blue-400 font-semibold mb-2">Video Statistics</div>
      
      {/* Playback Quality */}
      <div className="border-b border-gray-700 pb-1 mb-1">
        <div>Resolution: {hasStats ? getResolution() : 'N/A'}</div>
        <div>Bitrate: {hasStats ? getBitrate() : '0.00'} Mbps</div>
        <div>Level: {hasStats && stats.currentLevel !== undefined ? (stats.currentLevel === -1 ? 'Auto' : stats.currentLevel) : 'N/A'}</div>
      </div>
      
      {/* Network Stats */}
      <div className="border-b border-gray-700 pb-1 mb-1">
        <div>Network: {hasNetwork ? networkInfo.effectiveType || 'Unknown' : 'N/A'}</div>
        <div>Bandwidth: {hasNetwork && networkInfo.downlink ? networkInfo.downlink.toFixed(1) : '0.0'} Mbps</div>
        <div>RTT: {hasNetwork && networkInfo.rtt !== undefined ? networkInfo.rtt : '0'}ms</div>
      </div>
      
      {/* Buffer Health */}
      <div className="border-b border-gray-700 pb-1 mb-1">
        <div>Buffer: {hasStats && stats.bufferLength !== undefined ? stats.bufferLength.toFixed(1) : '0.0'}s</div>
        <div>Network BW: {hasStats && stats.bandwidth ? (stats.bandwidth / 1000000).toFixed(2) : '0.00'} Mbps</div>
        <div>Load Time: {hasStats && stats.loadLatency !== undefined ? stats.loadLatency : '0'}ms</div>
      </div>
      
      {/* Frame Stats */}
      <div>
        <div>Dropped Frames: {hasStats ? stats.droppedFrames || 0 : 0}</div>
        <div>Total Frames: {hasStats ? stats.totalFrames || 0 : 0}</div>
        <div>Drop Rate: {hasStats ? getDropRate() : '0.0'}%</div>
      </div>
    </div>
  );
};

export default StatsOverlay;
