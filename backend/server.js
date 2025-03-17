const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the 'videos' directory
app.use('/videos', express.static(path.join(__dirname, 'videos')));
// Serve static files from the 'thumbnails' directory
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));
// Serve static files for the placeholder
app.use('/static', express.static(path.join(__dirname, 'static')));

const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create thumbnails directory if it doesn't exist
const thumbnailsDir = path.join(__dirname, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Create static directory if it doesn't exist
const staticDir = path.join(__dirname, 'static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
  
  // Create a simple placeholder image
  const placeholderPath = path.join(staticDir, 'placeholder.jpg');
  if (!fs.existsSync(placeholderPath)) {
    // Copy a placeholder image or create a simple one with other methods
    // For now, we'll just use a URL for a placeholder
    console.log("Please add a placeholder.jpg file to the static directory");
  }
}

// Helper function to get all videos from database
function getAllVideos() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM videos", [], (err, videos) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(videos);
    });
  });
}

// Add HLS manifest URLs to your video objects
app.get('/videos', async (req, res) => {
  try {
    const videos = await getAllVideos(); 
    
    // Add HLS URLs to each video
    const videosWithHls = videos.map(video => {
      const basename = path.basename(video.url, path.extname(video.url));
      return {
        ...video,
        hlsUrl: `/api/videos/hls/${basename}/master.m3u8`,
        qualities: [
          { label: "240p", value: "240p" },
          { label: "480p", value: "480p" },
          { label: "720p", value: "720p" },
          { label: "1080p", value: "1080p" }
        ]
      };
    });
    
    res.json(videosWithHls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Create videos table if it doesn't exist
db.serialize(() => {
  // First create the base table
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    filename TEXT,
    hlsUrl TEXT,
    views INTEGER DEFAULT 0,
    last_viewed TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
      return;
    }
    console.log("Videos table ready");
  });

  // Then check if we need to add new columns
  db.get("PRAGMA table_info(videos)", [], (err, tableInfo) => {
    if (err) {
      console.error("Error checking table structure:", err);
      return;
    }

    // Add columns if they don't exist
    db.run("ALTER TABLE videos ADD COLUMN filename TEXT DEFAULT NULL", err => {
      if (err && !err.message.includes('duplicate column')) {
        console.error("Error adding filename column:", err);
      }
    });

    db.run("ALTER TABLE videos ADD COLUMN hlsUrl TEXT DEFAULT NULL", err => {
      if (err && !err.message.includes('duplicate column')) {
        console.error("Error adding hlsUrl column:", err);
      }
    });

    db.run("ALTER TABLE videos ADD COLUMN views INTEGER DEFAULT 0", err => {
      if (err && !err.message.includes('duplicate column')) {
        console.error("Error adding views column:", err);
      }
    });

    db.run("ALTER TABLE videos ADD COLUMN last_viewed TIMESTAMP", err => {
      if (err && !err.message.includes('duplicate column')) {
        console.error("Error adding last_viewed column:", err);
      }
    });

    // After ensuring columns exist, populate the database
    populateVideosFromDirectory();
  });
});

// Function to populate videos from directory
function populateVideosFromDirectory() {
  const videosDir = path.join(__dirname, 'videos');
  
  // Check if directory exists
  if (!fs.existsSync(videosDir)) {
    console.error("Videos directory not found at:", videosDir);
    return;
  }
  
  // Get all video files from directory
  fs.readdir(videosDir, (err, files) => {
    if (err) {
      console.error("Error reading videos directory:", err);
      return;
    }
    
    // Filter for video files
    const videoFiles = files.filter(file => 
      path.extname(file).toLowerCase() === '.mp4'
    );
    
    if (videoFiles.length === 0) {
      console.log("No video files found in directory");
      return;
    }
    
    // Get existing videos from database
    db.all("SELECT id, filename FROM videos", [], (err, existingVideos) => {
      if (err) {
        console.error("Error fetching existing videos:", err);
        return;
      }
      
      // Create maps for easier lookup
      const existingFilenames = new Map(
        existingVideos.map(video => [video.filename, video])
      );
      
      const currentFilenames = new Set(videoFiles);
      
      // Find new videos to add
      const videosToAdd = videoFiles.filter(file => !existingFilenames.has(file));
      
      // Find videos to remove (in DB but no longer in directory)
      const videosToRemove = Array.from(existingFilenames.entries())
        .filter(([filename]) => !currentFilenames.has(filename))
        .map(([_, video]) => video.id);
      
      console.log(`Found ${videosToAdd.length} new videos to add`);
      console.log(`Found ${videosToRemove.length} videos to remove`);
      
      // Add new videos if any
      if (videosToAdd.length > 0) {
        const stmt = db.prepare("INSERT INTO videos (title, url, filename) VALUES (?, ?, ?)");
        
        videosToAdd.forEach(file => {
          // Create a title by removing extension and replacing underscores with spaces
          const title = path.basename(file, path.extname(file))
            .replace(/_/g, ' ')
            .replace(/-/g, ' ');
          
          const url = `/videos/${file}`;
          
          stmt.run(title, url, file, (err) => {
            if (err) console.error(`Error inserting video ${file}:`, err);
          });
        });
        
        stmt.finalize();
        console.log("New videos added to database");
      }
      
      // Remove deleted videos if any
      if (videosToRemove.length > 0) {
        const placeholders = videosToRemove.map(() => '?').join(',');
        db.run(`DELETE FROM videos WHERE id IN (${placeholders})`, videosToRemove, function(err) {
          if (err) {
            console.error("Error removing deleted videos:", err);
          } else {
            console.log(`Removed ${this.changes} videos from database`);
          }
        });
      }
      
      if (videosToAdd.length === 0 && videosToRemove.length === 0) {
        console.log("Database is already in sync with video directory");
      }
    });
  });
}

// Thumbnail API route - will return a special URL for HTML5-based thumbnails
app.get('/api/thumbnail/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, 'videos', filename);
  const thumbnailPath = path.join(thumbnailsDir, `${path.basename(filename, path.extname(filename))}.jpg`);
  
  // If video doesn't exist, return 404
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }
  
  // If thumbnail already exists, return it
  if (fs.existsSync(thumbnailPath)) {
    return res.json({ thumbnailUrl: `/thumbnails/${path.basename(thumbnailPath)}` });
  }
  
  // Return a URL that the client will use to generate a thumbnail with HTML5 Video
  res.json({ thumbnailUrl: `/videos/${filename}#t=0.1` });
});

// API route to get all videos
app.get("/api/videos", (req, res) => {
  db.all("SELECT * FROM videos", [], async (err, videos) => {
    if (err) {
      console.error("Error fetching videos:", err);
      return res.status(500).json({ error: 'Failed to fetch videos' });
    }
    
    // Instead of HLS URLs (which don't exist yet), provide direct MP4 URLs
    const processedVideos = videos.map(video => {
      return {
        ...video,
        // Keep the direct mp4 URL as the main source
        directUrl: video.url,
        // Set a flag to indicate we're using direct playback instead of HLS
        useDirectPlayback: true,
        // We'll keep the HLS properties but mark them as not available
        hlsAvailable: false
      };
    });
    
    res.json(processedVideos);
  });
});

// Record video view statistics
app.post("/api/videos/:id/view", (req, res) => {
  const videoId = req.params.id;
  
  db.run(
    "UPDATE videos SET views = views + 1, last_viewed = CURRENT_TIMESTAMP WHERE id = ?",
    [videoId],
    function(err) {
      if (err) {
        console.error("Error updating view count:", err);
        return res.status(500).json({ error: "Failed to update view count" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      res.json({ success: true, message: "View recorded" });
    }
  );
});

// Get video statistics
app.get("/api/statistics", (req, res) => {
  db.all(
    "SELECT id, title, views, last_viewed FROM videos ORDER BY views DESC", 
    [],
    (err, videos) => {
      if (err) {
        console.error("Error fetching video statistics:", err);
        return res.status(500).json({ error: "Failed to fetch statistics" });
      }
      
      const stats = {
        mostViewed: videos.slice(0, 5),
        recentlyViewed: [...videos].sort((a, b) => {
          if (!a.last_viewed) return 1;
          if (!b.last_viewed) return -1;
          return new Date(b.last_viewed) - new Date(a.last_viewed);
        }).slice(0, 5),
        totalViews: videos.reduce((sum, video) => sum + (video.views || 0), 0)
      };
      
      res.json(stats);
    }
  );
});

// Fallback route for HLS requests - this will inform the client that HLS isn't available
app.get('/api/videos/hls/:filename/master.m3u8', (req, res) => {
  const filename = req.params.filename;
  
  // Find the original video from the database
  db.get("SELECT * FROM videos WHERE filename LIKE ?", [`%${filename}%`], (err, video) => {
    if (err || !video) {
      console.error("Error fetching video for HLS:", err);
      return res.status(404).json({ 
        error: 'HLS stream not found',
        message: 'HLS streaming is not available for this video'
      });
    }
    
    // Redirect to the direct MP4 URL instead
    res.redirect(video.url);
  });
});

// Mock endpoint for different bitrates (in a real app, you'd have different encodings)
app.get('/api/bitrateInfo', (req, res) => {
    res.json({
      available: [
        { bitrate: 'auto', label: 'Auto' },
        { bitrate: '1000', label: 'Low (1 Mbps)' },
        { bitrate: '3000', label: 'Medium (3 Mbps)' },
        { bitrate: '5000', label: 'High (5 Mbps)' },
        { bitrate: '8000', label: 'Ultra (8 Mbps)' }
      ],
      defaultBitrate: 'auto'
    });
  });

// Export video metadata in JSON format
app.get('/api/export/metadata', async (req, res) => {
  try {
    const videos = await getAllVideos();
    res.json(videos);
  } catch (error) {
    console.error("Error exporting metadata:", error);
    res.status(500).json({ error: "Failed to export metadata" });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'up',
    database: true,
    videoCount: 0 // Will be populated in the next middleware
  });
});

// Middleware to count videos
app.use('/api/health', (req, res, next) => {
  db.get("SELECT COUNT(*) as count FROM videos", [], (err, row) => {
    if (!err && res.locals.responseBody) {
      res.locals.responseBody.videoCount = row.count;
    }
    next();
  });
});

app.listen(5000, () => console.log("Backend running on port 5000"));