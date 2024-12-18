import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthProfiles = pgTable("health_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  birthdate: text("birthdate").notNull(),
  sex: text("sex", { enum: ["male", "female"] }).notNull(),
  heightFeet: integer("height_feet").notNull(),
  heightInches: integer("height_inches").notNull(),
  weightPounds: integer("weight_pounds").notNull(),
  medicalConditions: jsonb("medical_conditions").$type<string[]>().default([]).notNull(),
  medications: jsonb("medications").$type<string[]>().default([]).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export type SelectUser = User;
export type HealthProfile = typeof healthProfiles.$inferSelect;
export type InsertHealthProfile = typeof healthProfiles.$inferInsert;