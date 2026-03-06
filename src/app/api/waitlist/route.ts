import { NextRequest, NextResponse } from "next/server";

// ConvertKit API
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // If ConvertKit is configured, subscribe to form
    if (CONVERTKIT_API_KEY && CONVERTKIT_FORM_ID) {
      const res = await fetch(
        `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: CONVERTKIT_API_KEY,
            email,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        console.error("[waitlist] ConvertKit error:", error);
        return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
      }

      console.log(`[waitlist] Subscribed: ${email}`);
    } else {
      // Fallback: just log the email (you can store in Convex later)
      console.log(`[waitlist] Email collected (no ConvertKit): ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[waitlist] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
