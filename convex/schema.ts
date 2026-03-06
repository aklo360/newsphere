import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  
  // User profiles
  profiles: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    company: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Waitlist signups
  waitlist: defineTable({
    email: v.string(),
    subscribedAt: v.number(),
    unsubscribed: v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  // Brand Bibles
  brands: defineTable({
    userId: v.id("users"),
    name: v.string(),
    tagline: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    bible: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["userId", "status"]),
});
