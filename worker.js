export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Secure market-data endpoint
    if (url.pathname === "/api/forex") {
      const symbol = url.searchParams.get("symbol") || "EUR/USD";

      if (!env.TWELVE_DATA_API_KEY) {
        return Response.json(
          { error: "Twelve Data API key is not configured" },
          { status: 500 }
        );
      }

      const apiUrl =
        "https://api.twelvedata.com/time_series" +
        "?symbol=" + encodeURIComponent(symbol) +
        "&interval=15min" +
        "&outputsize=100" +
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
