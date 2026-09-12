export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Secure login endpoint
if (url.pathname === "/api/login" && request.method === "POST") {
  try {
    const { username, password } = await request.json();

    if (
      username === env.LOGIN_USERNAME &&
      password === env.LOGIN_PASSWORD
    ) {
      return Response.json({
        success: true
      });
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
        const response = await fetch(apiUrl);
        const data = await response.json();

        return Response.json(data, {
          headers: {
            "Cache-Control": "no-store"
          }
        });
      } catch (error) {
        return Response.json(
          { error: "Unable to retrieve market data" },
          { status: 500 }
        );
      }
    }

    // Everything else continues to load the website normally.
    return env.ASSETS.fetch(request);
  }
};
