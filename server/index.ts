import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs/promises";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ensure required directories exist
(async () => {
  try {
    await fs.access("uploads");
    await fs.access("client/public/images");
  } catch {
    await fs.mkdir("uploads", { recursive: true });
    await fs.mkdir("client/public/images", { recursive: true });
  }
})();

// Configure and serve static files
const staticOptions = {
  maxAge: '1h',
  etag: true,
  lastModified: true,
};

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), "client/public"), staticOptions));

// Fallback for images with error handling
app.use('/images', (req, res, next) => {
  express.static(path.join(process.cwd(), "client/public/images"), staticOptions)(req, res, (err) => {
    if (err) {
      console.error('Error serving static file:', err);
      res.status(404).send('Image not found');
    } else {
      next();
    }
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const tryPort = (port: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      server.listen(port, "0.0.0.0")
        .once('listening', () => {
          resolve(port);
        })
        .once('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            tryPort(port + 1).then(resolve, reject);
          } else {
            reject(err);
          }
        });
    });
  };

  tryPort(5000).then(port => {
    log(`serving on port ${port}`);
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
})();
