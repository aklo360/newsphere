import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check if already subscribed
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existing) {
      // If unsubscribed, re-subscribe
      if (existing.unsubscribed) {
        await ctx.db.patch(existing._id, { 
          unsubscribed: false,
          subscribedAt: Date.now(),
        });
      }
      return { success: true, existing: true };
    }
    
    // New subscriber
    await ctx.db.insert("waitlist", {
      email,
      subscribedAt: Date.now(),
    });
    
    return { success: true, existing: false };
  },
});

export const unsubscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, { unsubscribed: true });
    }
    
    return { success: true };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("waitlist")
      .filter((q) => q.neq(q.field("unsubscribed"), true))
      .collect();
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("waitlist")
      .filter((q) => q.neq(q.field("unsubscribed"), true))
      .collect();
    return all.length;
  },
});
