# Smart TV UI Project

## Overview
The **Smart TV UI Project** is a full-stack application for managing and streaming videos. It consists of two main parts:

- **Backend**: Built with Express.js and SQLite, it manages APIs for video data, video file serving, and dynamic transcoding using FFmpeg.
- **Frontend**: Developed with Next.js, this client application offers a responsive and interactive video library with HLS streaming and advanced playback controls.

## Project Structure
```
backend/
  ├─ .gitignore
  ├─ package.json
  ├─ server.js
  ├─ routes/
  │    └─ videos.js
  ├─ services/
  │    └─ transcoder.js
  ├─ database.sqlite
  ├─ videos/         # Original and transcoded video files
  ├─ thumbnails/     # Thumbnails generated for videos
frontend/
  ├─ .gitignore
  ├─ package.json
  ├─ next.config.ts
  ├─ postcss.config.mjs
  ├─ tsconfig.json
  ├─ public/         # Static assets (e.g., images, icons)
  ├─ src/
       └─ app/
            ├─ globals.css
            ├─ layout.tsx
            └─ page.tsx
nginx/
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (v14 or later)
- [npm](https://www.npmjs.com) or [yarn](https://yarnpkg.com)
- For video processing, FFmpeg is installed via [@ffmpeg-installer/ffmpeg](https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg)

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install the dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables (if needed) using a `.env` file.
4. Start the backend server:
   ```sh
   node server.js
   ```
   The server runs on port **5000** by default.

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install the dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Features
- **Responsive Interface**: Clean design with accessible video navigation.
- **HLS Streaming**: Adaptive video delivery with automatic quality adjustment.
- **Video Transcoding**: Backend service automatically transcodes videos into multiple qualities.
- **Keyboard Controls**: Intuitive shortcuts for play/pause, seeking, and fullscreen modes.
- **Real-Time Statistics**: (Development mode) Displays playback and network statistics.

## Environment & Git Management
- Both the **backend** and **frontend** have dedicated .gitignore files to exclude sensitive data, temporary files, and build outputs.
- Ensure you do not commit local environment files (e.g., `.env`, `.env.local`).

## Deployment
- **Backend**: Deploy using any Node.js hosting environment. Use a process manager (e.g., PM2) for production.
- **Frontend**: Deploy the Next.js application on platforms such as [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com).

## Contributing
Contributions are welcome! Follow these steps:
1. Fork the repository and create a feature branch.
2. Make your changes and ensure tests pass.
3. Open a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License.

## Acknowledgements
- **Backend**: Express.js, SQLite, Fluent-FFmpeg, and FFmpeg.
- **Frontend**: Next.js, React, Tailwind CSS.
- **Deployment**: Inspired by modern container and cloud-based deployment practices.

Happy coding!


teodorcosma: @workspace remake this. make sure you return it in one md file

Workspace: Collecting workspace information```md
# Smart TV UI Repository

This repository contains the source code for the Smart TV UI project, a full-stack application composed of a backend API and a modern frontend web application. The project is organized into two main parts:

- **Backend:** An Express.js application that uses SQLite for data storage, handles video file management (including transcoding with FFmpeg), and serves HLS streaming content.
- **Frontend:** A Next.js application that provides an interactive UI for browsing and playing videos, complete with quality selection, full-screen mode, and real-time statistics.

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

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v14 or later)
- [npm](https://www.npmjs.com) or [yarn](https://yarnpkg.com)
- [FFmpeg](https://www.ffmpeg.org) (installed automatically via [@ffmpeg-installer/ffmpeg](https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg) in the backend)

### Backend Setup

1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. (Optional) Set up your environment variables in a `.env` file.
4. Start the backend server:
   ```sh
   node server.js
   ```
   The server listens on port **5000** by default. Check out server.js for static routes and API endpoints.

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
4. Open your browser and visit [http://localhost:3000](http://localhost:3000) to see the application in action. For additional configuration details, refer to next.config.ts and tsconfig.json.

## Features

- **Video Library:** Automatically detects and manages video files located in the backend `/videos` directory.
- **Video Transcoding:** Uses FFmpeg via fluent-ffmpeg to transcode videos into multiple qualities (240p, 480p, 720p, 1080p).
- **HLS Streaming:** Serves HLS manifests and segments for smooth playback on a variety of devices.
- **Responsive UI:** Built with Next.js and TailwindCSS, providing quality selection, full-screen support, keyboard shortcuts, and real-time statistics.
- **Automatic Database Sync:** The backend populates the SQLite database (see backend/server.js) with new videos and cleans up removed files.

## Quality & Performance

- **Real-time Video Stats:** In development mode, display playback statistics and network information via an overlay in the video player (frontend/src/app/page.tsx).
- **Adaptive Streaming:** Leverages HLS via [hls.js](https://github.com/video-dev/hls.js) to select the appropriate quality level based on the network and device.

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
- **hls.js** for smooth and adaptive video streaming.

