import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { healthProfiles, labResults } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { analyzePDFText, type HealthProfileWithBMI, calculateBMI, getBMICategory } from "./openai";
import { PDFExtract } from "pdf.js-extract";
import {randomUUID} from 'crypto';
import { sendPasswordResetEmail } from './email';
import { users, passwordResetTokens } from "@db/schema";


const pdfExtract = new PDFExtract();
const upload = multer({
  dest: "uploads/",
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Health Profile routes
  app.get("/api/health-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
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
      return res.status(401).json({ message: "Not authenticated" });
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

  // Lab Results routes
  app.get("/api/lab-results", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const results = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, req.user!.id))
      .orderBy(labResults.uploadedAt);

    res.json(results);
  });

  app.post("/api/lab-results", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      // Get user's health profile for BMI calculation
      const [profile] = await db
        .select()
        .from(healthProfiles)
        .where(eq(healthProfiles.userId, req.user!.id))
        .limit(1);

      if (!profile) {
        return res.status(400).json({ message: "Please complete your health profile first" });
      }

      // Extract text from PDF
      const data = await pdfExtract.extract(req.file.path);
      const pdfText = data.pages.map(page => page.content.map(item => item.str).join(" ")).join("\n");

      // Calculate BMI
      const bmi = calculateBMI(profile.weightPounds, profile.heightFeet, profile.heightInches);
      const bmiCategory = getBMICategory(bmi);

      // Prepare health profile with BMI for analysis
      const healthProfile: HealthProfileWithBMI = {
        ...profile,
        bmi,
        bmiCategory,
      };

      // Analyze the PDF text with OpenAI
      const analysis = await analyzePDFText(pdfText, healthProfile);

      // Save the results
      const [result] = await db
        .insert(labResults)
        .values({
          userId: req.user!.id,
          pdfPath: req.file.path,
          analysis,
        })
        .returning();

      res.json(result);
    } catch (error) {
      console.error('Lab results upload error:', error);
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
      return res.status(500).json({ message: "Failed to process lab results" });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // For security reasons, always return success even if the email doesn't exist
      res.json({ 
        message: "If an account exists with that email, you will receive password reset instructions."
      });

      // Only proceed with sending email if user exists
      if (user) {
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Save the reset token
        await db.insert(passwordResetTokens).values({
          userId: user.id,
          token,
          expiresAt,
        });

        // Send the reset email
        await sendPasswordResetEmail(email, token);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      // Only send response if one hasn't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "An error occurred while processing your request"
        });
      }
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}