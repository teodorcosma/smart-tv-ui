const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create videos directory if it doesn't exist
const videosDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Setup database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create videos table if it doesn't exist
// Update the db.serialize section to add the column if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      thumbnail TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Fix: Check if created_at column exists
  db.all("PRAGMA table_info(videos)", (err, rows) => {
    if (!err) {
      // Check if created_at column exists
      const hasCreatedAt = rows.some(row => row.name === 'created_at');
      if (!hasCreatedAt) {
        // Add the column without the DEFAULT constraint
        db.run("ALTER TABLE videos ADD COLUMN created_at TIMESTAMP");
        console.log("Added created_at column to videos table");
        
        // Then update all existing rows to set a value
        db.run("UPDATE videos SET created_at = CURRENT_TIMESTAMP");
        console.log("Updated all existing rows with current timestamp");
      }
    }
  });
});

// Modify getAllVideos function to be resilient to missing column
function getAllVideos() {
  return new Promise((resolve, reject) => {
    // First check if created_at column exists
    db.all("PRAGMA table_info(videos)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const hasCreatedAt = rows.some(row => row.name === 'created_at');
      const query = hasCreatedAt 
        ? 'SELECT * FROM videos ORDER BY created_at DESC'
        : 'SELECT * FROM videos ORDER BY id DESC'; // Fallback to ordering by ID
        
      db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });
}

// Function to scan the videos directory and sync with database
async function syncVideosWithDatabase() {
  try {
    // Get all video files in the directory
    const files = fs.readdirSync(videosDir);
    const videoFiles = files.filter(file => 
      file.endsWith('.mp4') || file.endsWith('.webm')
    );
    
    // Get all videos from database
    const dbVideos = await getAllVideos();
    const dbVideoUrls = dbVideos.map(video => path.basename(video.url));
    
    // Add new videos to database
    for (const file of videoFiles) {
      if (!dbVideoUrls.includes(file)) {
        const videoPath = path.join(videosDir, file);
        const title = path.basename(file, path.extname(file))
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        const id = uuidv4();
        const url = `/videos/${file}`;
        
        db.run(
          'INSERT INTO videos (id, title, description, url, duration) VALUES (?, ?, ?, ?, ?)',
          [id, title, `Description for ${title}`, url, 0]
        );
        console.log(`Added new video: ${title}`);
      }
    }
    
    // Remove videos from database that no longer exist in directory
    for (const dbVideo of dbVideos) {
      const fileName = path.basename(dbVideo.url);
      if (!videoFiles.includes(fileName)) {
        db.run('DELETE FROM videos WHERE id = ?', [dbVideo.id]);
        console.log(`Removed video: ${dbVideo.title}`);
      }
    }
    
    console.log('Video database sync complete');
  } catch (error) {
    console.error('Error syncing videos with database:', error);
  }
}

// API endpoint to get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await getAllVideos();
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Serve video files with proper content-type headers
app.use('/videos', (req, res, next) => {
  const filePath = path.join(videosDir, path.basename(req.path));
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Set content type based on file extension
    if (ext === '.mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (ext === '.webm') {
      res.setHeader('Content-Type', 'video/webm');
    }
    
    // Stream the file
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handling range requests for video seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);
      res.status(206);
      
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // For non-range requests
      res.setHeader('Content-Length', fileSize);
      res.status(200);
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    next(); // If file doesn't exist, proceed to next middleware
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'up', version: '1.0.0' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Sync videos with database on startup
  syncVideosWithDatabase();
});

// Re-sync videos with database every hour
setInterval(syncVideosWithDatabase, 60 * 60 * 1000);