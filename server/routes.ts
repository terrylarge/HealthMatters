import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { healthProfiles } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Health Profile routes
  app.get("/api/health-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const [profile] = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, req.user!.id))
      .limit(1);

    res.json(profile || null);
  });

  app.post("/api/health-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const [existing] = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, req.user!.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(healthProfiles)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(healthProfiles.id, existing.id))
        .returning();
      return res.json(updated);
    }

    const [profile] = await db
      .insert(healthProfiles)
      .values({
        ...req.body,
        userId: req.user!.id
      })
      .returning();

    res.json(profile);
  });

  const httpServer = createServer(app);
  return httpServer;
}