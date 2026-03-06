import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    tagline: v.optional(v.string()),
    bible: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const brandId = await ctx.db.insert("brands", {
      userId,
      name: args.name,
      tagline: args.tagline,
      status: "active",
      bible: args.bible,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return brandId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("brands")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const brand = await ctx.db.get(args.id);
    if (!brand || brand.userId !== userId) return null;

    return brand;
  },
});

export const update = mutation({
  args: {
    id: v.id("brands"),
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    bible: v.optional(v.any()),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const brand = await ctx.db.get(args.id);
    if (!brand || brand.userId !== userId) throw new Error("Brand not found");

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const brand = await ctx.db.get(args.id);
    if (!brand || brand.userId !== userId) throw new Error("Brand not found");

    await ctx.db.delete(args.id);
    return true;
  },
});
