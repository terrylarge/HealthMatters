import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { setupAuth } from "./auth";
import { db } from "@db";
import { healthProfiles, labResults } from "@db/schema";
import { eq } from "drizzle-orm";
import { analyzePDFText, calculateBMI, getBMICategory } from "./openai";
import { PDFExtract } from "pdf.js-extract";

const pdfExtract = new PDFExtract();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

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
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(healthProfiles.id, existing.id))
        .returning();
      return res.json(updated);
    }

    const [profile] = await db
      .insert(healthProfiles)
      .values({ ...req.body, userId: req.user!.id })
      .returning();

    res.json(profile);
  });

  // Lab Results routes
  app.post("/api/lab-results", upload.single("pdf"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (!req.file) {
      return res.status(400).send("No PDF file uploaded");
    }

    let pdfPath = req.file.path;

    try {
      const data = await pdfExtract.extract(pdfPath);
      const text = data.pages.map(page => page.content).join(" ");

      const [profile] = await db
        .select()
        .from(healthProfiles)
        .where(eq(healthProfiles.userId, req.user!.id))
        .limit(1);

      if (!profile) {
        throw new Error("Please complete your health profile first");
      }

      const bmi = calculateBMI(profile.weightPounds, profile.heightFeet, profile.heightInches);
      const analysis = await analyzePDFText(text, {
        ...profile,
        bmi,
        bmiCategory: getBMICategory(bmi),
        medicalConditions: profile.medicalConditions || [],
        medications: profile.medications || [],
      });

      if (!analysis || typeof analysis !== 'object') {
        throw new Error('Invalid analysis response from OpenAI');
      }

      const [result] = await db
        .insert(labResults)
        .values({
          userId: req.user!.id,
          pdfPath,
          analysis
        })
        .returning();

      console.log('Lab result analysis:', JSON.stringify(analysis, null, 2));
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).send(`Error processing PDF: ${message}`);
    } finally {
      // Clean up uploaded file after processing or in case of error
      await fs.unlink(pdfPath).catch(console.error);
    }
  });

  app.get("/api/lab-results", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const results = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, req.user!.id))
      .orderBy(labResults.uploadedAt);

    res.json(results);
  });

  const httpServer = createServer(app);
  return httpServer;
}