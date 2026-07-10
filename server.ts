import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import apiRouter from './server/routes.js';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and connect database (connects Mongo if MONGO_URI is found, else falls back to Local JSON DB)
  await db.connect();

  // Middleware
  app.use(cors());
  // Set payload size limits high enough for Base64 profile and post image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Mount backend API routes under /api
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: db.isMongo() ? 'MongoDB Atlas' : 'Local JSON DB Fallback',
      time: new Date().toISOString()
    });
  });

  // Vite development middleware vs. Production static serving
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Vite in development middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in production mode. Serving static assets from dist/');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Fallback for single page applications
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===========================================================`);
    console.log(`🚀 ymedia Social Media Platform is running successfully!`);
    console.log(`🌐 Host: 0.0.0.0 | Port: ${PORT}`);
    console.log(`💾 Database: ${db.isMongo() ? 'MongoDB Atlas (Connected)' : 'Local JSON DB (Active Fallback)'}`);
    console.log(`===========================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting full-stack server:', err);
});
