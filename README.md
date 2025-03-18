# Smart TV UI

A simple Smart TV UI for browsing and playing videos.

## System Components

This application consists of two main components:

1. Backend server (serves video files and API)
2. Frontend (React-based UI for browsing and playback)

## Setup and Running

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

This will start the backend server on port 5000.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open your browser and visit [http://localhost:3000](http://localhost:3000) to see the application.

## Adding Videos

To add videos to the application, simply place MP4 or WebM video files in the `backend/videos` directory. The server will automatically scan this directory and update the database.

## Usage

- Use arrow keys to navigate through the video list
- Press Enter to select a video
- Press Space or K to play/pause
- Press J to seek backward 10 seconds
- Press L to seek forward 10 seconds
- Press F to toggle fullscreen
- Press Escape to exit fullscreen

## Features

- Video library browsing
- Playback of MP4 and WebM videos
- Keyboard navigation optimized for TV remotes
- Automatic video detection and indexing
- Responsive UI

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v14 or later)
- [npm](https://www.npmjs.com) or [yarn](https://yarnpkg.com)

### Backend Setup

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the backend server:
   ```sh
   npm run dev
   ```
   
   The server will run on port 5000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

4. Open your browser and visit [http://localhost:3000](http://localhost:3000) to see the application.

### Download Sample Videos

To download some sample videos, you can run:

```bash
cd backend
npm run download-samples
```

This will download a few sample videos from the internet into your videos directory.

## Repository Structure

```
.
├── backend
│   ├── .gitignore             // .gitignore
│   ├── database.sqlite
│   ├── package.json           // package.json
│   ├── server.js              // server.js
│   ├── db/
│   │    └── database.sqlite
│   ├── routes/
│   │    └── videos.js         // videos.js
│   ├── services/
│   │    └── transcoder.js     // transcoder.js
│   ├── static/
│   ├── thumbnails/
│   └── videos/
│       ├── 13138827_1280_720_30fps.mp4
│       ├── 13203001_3840_2160_30fps.mp4
│       ├── 13311083_1920_1080_30fps.mp4
│       ├── 13317794_1080_1920_30fps.mp4
│       └── ... (other video files)
└── frontend
    ├── .gitignore             // .gitignore
    ├── next-env.d.ts
    ├── next.config.ts         // next.config.ts
    ├── package.json           // package.json
    ├── postcss.config.mjs      // postcss.config.mjs
    ├── README.md
    ├── tsconfig.json          // tsconfig.json
    ├── .next/
    ├── public/
    └── src
         └── app
              ├── globals.css   // globals.css
              ├── layout.tsx    // layout.tsx
              └── page.tsx      // page.tsx
```

## Quality & Performance

- **Real-time Video Stats:** In development mode, display playback statistics and network information via an overlay in the video player (frontend/src/app/page.tsx).

## Git & Environment Management

- **Gitignore Configuration:** Both the backend and frontend directories have dedicated .gitignore files (backend/.gitignore, frontend/.gitignore) to ensure sensitive environment files, logs, build directories, and temporary files are not committed.
  
## Deployment

- **Backend:** Deploy the Express.js server on any Node.js hosting platform. Consider using a process manager like PM2 for production.
- **Frontend:** Deploy the Next.js app on platforms like [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com).

## Contributing

Contributions are welcome! To propose changes:
1. Fork the repository and create a feature branch.
2. Make your updates, ensuring all tests pass.
3. Submit a pull request with a detailed explanation of your changes.

## License

This project is licensed under the MIT License.

## Acknowledgements

- **Express.js & SQLite** for backend server and data management.
- **Next.js & TailwindCSS** for modern, responsive frontend development.
- **FFmpeg & fluent-ffmpeg** for robust video transcoding capabilities.

