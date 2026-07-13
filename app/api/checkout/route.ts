import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site } from "@/site.config";
import { findProduct } from "@/lib/products";

// Simple-commerce: create a Stripe Checkout session for a single product.
// Price is looked up server-side from the config (never trust a client price).
export async function POST(req: Request) {
  try {
    const { productId } = (await req.json()) as { productId?: string };
    const product = productId ? findProduct(String(productId)) : undefined;
    if (!product) {
      return NextResponse.json({ error: "Unknown product" }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      console.warn("STRIPE_SECRET_KEY not set - checkout not created:", product.id);
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const stripe = new Stripe(secret);
    const origin =
      req.headers.get("origin") ?? site.seo.domain ?? "http://localhost:3000";
    const currency = product.currency ?? site.commerce?.currency ?? "usd";

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = product.priceId
      ? [{ price: product.priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: product.priceCents ?? 0,
              product_data: {
                name: product.name,
                ...(product.description ? { description: product.description } : {}),
              },
            },
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}${site.commerce?.successPath ?? "/success"}`,
      cancel_url: `${origin}${site.commerce?.cancelPath ?? "/cancel"}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout route error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
