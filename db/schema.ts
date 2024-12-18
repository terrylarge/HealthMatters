import { pgTable, text, serial, integer, boolean, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthProfiles = pgTable("health_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  birthdate: date("birthdate").notNull(),
  sex: text("sex", { enum: ["male", "female"] }).notNull(),
  heightFeet: integer("height_feet").notNull(),
  heightInches: integer("height_inches").notNull(),
  weightPounds: integer("weight_pounds").notNull(),
  medicalConditions: jsonb("medical_conditions").$type<string[]>(),
  medications: jsonb("medications").$type<string[]>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pdfPath: text("pdf_path").notNull(),
  analysis: jsonb("analysis"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertHealthProfileSchema = createInsertSchema(healthProfiles, {
  medicalConditions: z.array(z.string()),
  medications: z.array(z.string()),
});
export const selectHealthProfileSchema = createSelectSchema(healthProfiles);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type HealthProfile = typeof healthProfiles.$inferSelect;
export type InsertHealthProfile = typeof healthProfiles.$inferInsert;
export type LabResult = typeof labResults.$inferSelect;
