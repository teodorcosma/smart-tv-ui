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

// Add HLS manifest URLs to your video objects
app.get('/videos', async (req, res) => {
  try {
    const videos = await getAllVideos(); // Your existing function
    
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
    hlsUrl TEXT
  )`, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
      return;
    }
    console.log("Videos table ready");
  });

  // Then check if we need to add the filename column
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
  
  // If video doesn't exist, return 404
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }
  
  // Return a URL that the client will use to generate a thumbnail with HTML5 Video
  res.json({ thumbnailUrl: `/videos/${filename}#t=0.1` });
});

// API route to get all videos
app.get("/api/videos", (req, res) => {
  db.all("SELECT id, COALESCE(filename, '') as filename FROM videos", [], (err, existingVideos) => {
    if (err) {
      console.error("Error fetching existing videos:", err);
      return;
    }
    
    res.json(existingVideos);
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

app.listen(5000, () => console.log("Backend running on port 5000"));