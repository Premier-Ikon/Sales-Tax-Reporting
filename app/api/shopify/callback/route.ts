import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

function validateHmac(
  params: Record<string, string>,
  secret: string,
  receivedHmac: string
): boolean {
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "hmac" && k !== "signature")
    .sort();

  const queryString = sortedKeys
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const hmac = createHmac("sha256", secret);
  hmac.update(queryString);
  const computed = hmac.digest("hex");

  if (computed.length !== receivedHmac.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(receivedHmac, "utf8")
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Shopify API credentials are not configured" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const hmac = searchParams.get("hmac");
  const shop = searchParams.get("shop");

  if (!code || !hmac || !shop) {
    return NextResponse.json(
      { error: "Missing code, hmac, or shop in callback" },
      { status: 400 }
    );
  }

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (!validateHmac(params, apiSecret, hmac)) {
    return NextResponse.json({ error: "HMAC validation failed" }, { status: 400 });
  }

  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  const body = JSON.stringify({
    client_id: apiKey,
    client_secret: apiSecret,
    code,
  });

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    return NextResponse.json(
      { error: "Failed to exchange code for token", details: errText },
      { status: 502 }
    );
  }

  const data = (await tokenResponse.json()) as { access_token: string };
  const accessToken = data.access_token;

  console.log("Access token (logged for install success):", accessToken);

  return NextResponse.json({
    success: true,
    message: "App installed successfully",
  });
}
