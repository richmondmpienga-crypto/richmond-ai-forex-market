export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Check secure login session
const cookieHeader = request.headers.get("Cookie") || "";

const sessionData = new TextEncoder().encode(env.SESSION_SECRET);
const sessionHash = await crypto.subtle.digest("SHA-256", sessionData);

const expectedSessionToken = Array.from(new Uint8Array(sessionHash))
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");

const sessionCookie = cookieHeader
  .split(";")
  .map((cookie) => cookie.trim())
  .find((cookie) => cookie.startsWith("richmond_session="));

const currentSessionToken = sessionCookie
  ? sessionCookie.substring("richmond_session=".length)
  : "";

const isLoggedIn = currentSessionToken === expectedSessionToken;

const protectedPages = [
  "/",
  "/index.html",
  "/pair.html"
];

if (protectedPages.includes(url.pathname) && !isLoggedIn) {
  return Response.redirect(new URL("/login.html", request.url), 302);
}
    // Secure logout endpoint
if (url.pathname === "/api/logout" && request.method === "POST") {
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie":
          "richmond_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
      }
    }
  );
}
    // Secure login endpoint
if (url.pathname === "/api/login" && request.method === "POST") {
  try {
    const { username, password } = await request.json();

   if (
  username === env.LOGIN_USERNAME &&
  password === env.LOGIN_PASSWORD
) {
  const sessionData = new TextEncoder().encode(env.SESSION_SECRET);
  const sessionHash = await crypto.subtle.digest("SHA-256", sessionData);

  const sessionToken = Array.from(new Uint8Array(sessionHash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return Response.json(
    {
      success: true
    },
    {
      headers: {
        "Set-Cookie":
          `richmond_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
      }
    }
  );
}

    return Response.json(
      {
        success: false,
        error: "Invalid username or password"
      },
      { status: 401 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Invalid login request"
      },
      { status: 400 }
    );
  }
}
// Secure Business Quant economic calendar endpoint
if (url.pathname === "/api/calendar") {
  if (!env.BUSINESS_QUANT_API_KEY) {
    return Response.json(
      { error: "Business Quant API key is not configured" },
      { status: 500 }
    );
  }

  const apiUrl =
    "https://data.businessquant.com/calendar/economic" +
    "?api_key=" +
    encodeURIComponent(env.BUSINESS_QUANT_API_KEY);

  try {
    const cache = caches.default;
    const cacheKey = new Request(request.url, {
        method: "GET"
    });

    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
        return cachedResponse;
    }

    const response = await fetch(apiUrl);
    const data = await response.text();

    // Never cache provider errors or rate-limit responses
    if (!response.ok) {
        return new Response(data, {
            status: response.status,
            headers: {
                "Content-Type":
                    response.headers.get("Content-Type") || "application/json",
                "Cache-Control": "no-store"
            }
        });
    }

    const workerResponse = new Response(data, {
        status: 200,
        headers: {
            "Content-Type":
                response.headers.get("Content-Type") || "application/json",
            "Cache-Control": "public, max-age=3600"
        }
    });

    await cache.put(cacheKey, workerResponse.clone());

    return workerResponse;
} catch (error) {
    return Response.json(
        {
            error: "Unable to retrieve Business Quant economic calendar",
            details: error.message
        },
        { status: 500 }
    );
}
  }
}
    // Secure market-data endpoint
    if (url.pathname === "/api/forex") {
      const symbol = url.searchParams.get("symbol") || "EUR/USD";
const interval = url.searchParams.get("interval") || "15min";
      if (!env.TWELVE_DATA_API_KEY) {
        return Response.json(
          { error: "Twelve Data API key is not configured" },
          { status: 500 }
        );
      }

      const apiUrl =
        "https://api.twelvedata.com/time_series" +
        "?symbol=" + encodeURIComponent(symbol) +
        "&interval=" + encodeURIComponent(interval) +
        "&outputsize=200" +
        "&apikey=" + encodeURIComponent(env.TWELVE_DATA_API_KEY);

     try {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);

    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
        return cachedResponse;
    }

    const response = await fetch(apiUrl);
const data = await response.json();

if (
    !response.ok ||
    data.status === "error" ||
    data.error ||
    !Array.isArray(data.values)
) {
    return Response.json(
        {
            error: data.message || data.error || "Market data provider unavailable",
            providerStatus: response.status
        },
        {
            status: response.status === 429 ? 429 : 502,
            headers: {
                "Cache-Control": "no-store"
            }
        }
    );
}

    const workerResponse = Response.json(data, {
        headers: {
            "Cache-Control": "public, max-age=60"
        }
    });

    await cache.put(cacheKey, workerResponse.clone());

    return workerResponse;
} catch (error) {
    return Response.json(
        {
            error: "Unable to retrieve market data",
            details: error.message
        },
        { status: 500 }
    );
}
    }

    // Everything else continues to load the website normally.
    return env.ASSETS.fetch(request);
  }
};
