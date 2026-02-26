import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const SCOPES = "read_orders";

export async function GET(request: NextRequest) {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const shop = request.nextUrl.searchParams.get("shop");

  if (!apiKey) {
    return NextResponse.json(
      { error: "SHOPIFY_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!shop || !/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop)) {
    return NextResponse.json(
      { error: "Missing or invalid shop parameter" },
      { status: 400 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${request.nextUrl.origin}/api/shopify/callback`;

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", apiKey);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
