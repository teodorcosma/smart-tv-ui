// filepath: backend/routes/videos.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { transcodeVideo } = require('../services/transcoder');

// Your existing video endpoints

// Endpoint to transcode a video
router.post('/transcode/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    // Find the video in your database
    const video = await getVideoById(videoId); // Implement this function
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const originalPath = path.join(__dirname, '../videos', video.filename);
    const outputDir = path.join(__dirname, '../videos/transcoded');
    
    // Start transcoding
    const result = await transcodeVideo(originalPath, outputDir);
    
    // Update video record with manifest path
    await updateVideoWithManifest(videoId, result.manifestPath); // Implement this function
    
    res.json({
      message: 'Transcoding started',
      manifestUrl: `/videos/transcoded/${path.basename(originalPath, path.extname(originalPath))}/master.m3u8`
    });
  } catch (error) {
    console.error('Transcoding error:', error);
    res.status(500).json({ error: 'Failed to transcode video' });
  }
});

// Endpoint to serve HLS manifests and segments
router.get('/hls/*', (req, res) => {
  // Extract the path after /hls/
  const requestPath = req.path.replace('/hls/', '');
  const filePath = path.join(__dirname, '../videos/transcoded', requestPath);
  
  // Set appropriate content type based on file extension
  if (requestPath.endsWith('.m3u8')) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  } else if (requestPath.endsWith('.ts')) {
    res.setHeader('Content-Type', 'video/MP2T');
  }
  
  // Stream the file
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

module.exports = router;