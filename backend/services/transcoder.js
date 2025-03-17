// filepath: backend/services/transcoder.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const qualities = [
  { name: '240p', bitrate: '400k', resolution: '426x240' },
  { name: '480p', bitrate: '1000k', resolution: '854x480' },
  { name: '720p', bitrate: '3000k', resolution: '1280x720' },
  { name: '1080p', bitrate: '5000k', resolution: '1920x1080' }
];

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function transcodeVideo(videoPath, outputDir) {
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const videoDir = path.join(outputDir, videoName);
  
  ensureDirectoryExists(videoDir);
  
  // Create HLS master playlist
  const masterPlaylist = `#EXTM3U\n#EXT-X-VERSION:3\n`;
  let masterPlaylistContent = masterPlaylist;
  
  // Process each quality
  for (const quality of qualities) {
    const qualityDir = path.join(videoDir, quality.name);
    ensureDirectoryExists(qualityDir);
    
    const segmentDir = path.join(qualityDir, 'segments');
    ensureDirectoryExists(segmentDir);
    
    // Add entry to master playlist
    masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate) * 1000},RESOLUTION=${quality.resolution}\n`;
    masterPlaylistContent += `${quality.name}/playlist.m3u8\n`;
    
    // Create HLS segments for this quality
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-c:v h264',
          '-c:a aac',
          `-b:v ${quality.bitrate}`,
          `-s ${quality.resolution}`,
          '-hls_time 10',
          '-hls_playlist_type vod',
          '-hls_segment_filename',
          path.join(segmentDir, 'segment_%03d.ts')
        ])
        .output(path.join(qualityDir, 'playlist.m3u8'))
        .on('end', () => {
          console.log(`Finished transcoding ${videoName} to ${quality.name}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error transcoding ${videoName} to ${quality.name}:`, err);
          reject(err);
        })
        .run();
    });
  }
  
  // Write master playlist
  fs.writeFileSync(path.join(videoDir, 'master.m3u8'), masterPlaylistContent);
  
  return {
    originalVideo: videoPath,
    manifestPath: path.join(videoDir, 'master.m3u8')
  };
}

module.exports = { transcodeVideo };