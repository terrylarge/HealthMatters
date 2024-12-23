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

  // Increase max listeners to handle multiple error handlers
  server.setMaxListeners(20);

  // Kill any existing process on port 5000 and retry starting the server
  const startServer = async (retries = 3) => {
    try {
      await new Promise<void>((resolve, reject) => {
        if (server.listening) {
          server.close();
        }
        
        const listener = server.listen(5000, "0.0.0.0", () => {
          log(`serving on port 5000`);
          resolve();
        });

        listener.on('error', async (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE' && retries > 0) {
            log(`Port 5000 in use, retrying in 1s... (${retries} attempts left)`);
            await new Promise(r => setTimeout(r, 1000));
            try {
              await startServer(retries - 1);
              resolve();
            } catch (e) {
              reject(e);
            }
          } else {
            reject(err);
          }
        });
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      if (retries === 0) {
        process.exit(1);
      }
      throw err;
    }
  };

  process.on('SIGTERM', () => {
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });

  await startServer();
})();
