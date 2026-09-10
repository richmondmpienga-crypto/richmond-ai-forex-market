const APP_NAME = "Richmond AI Forex Market";

document.addEventListener("DOMContentLoaded", () => {
  console.log(`${APP_NAME} loaded successfully`);

  const scanBtn = document.getElementById("scanMarketBtn");
  const scannerBody = document.getElementById("scannerBody");
  const aiAnalysis = document.getElementById("aiAnalysis");

  if (!scanBtn || !scannerBody) return;

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  function ema(values, period) {
    if (!values || values.length < period) return null;

    const multiplier = 2 / (period + 1);

    let result =
      values.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < values.length; i++) {
      result =
        (values[i] - result) * multiplier + result;
    }

    return result;
  }

  function calculateRSI(values, period = 14) {
    if (!values || values.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = values.length - period; i < values.length; i++) {
      const change = values[i] - values[i - 1];

      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    if (losses === 0) return 100;

    const rs = gains / losses;
    return 100 - 100 / (1 + rs);
  }

  function analyzeMarket(candles) {
    if (!candles || candles.length < 25) {
      throw new Error("Not enough candle data");
    }

    // Twelve Data sends newest candle first.
    // Reverse so analysis runs oldest -> newest.
    const ordered = [...candles].reverse();

    const closes = ordered.map((c) => Number(c.close));
    const highs = ordered.map((c) => Number(c.high));
    const lows = ordered.map((c) => Number(c.low));
    const opens = ordered.map((c) => Number(c.open));

    const lastIndex = closes.length - 1;

    const currentClose = closes[lastIndex];
    const previousClose = closes[lastIndex - 1];

    const ema20 = ema(closes, 20);
    const ema50 =
      closes.length >= 50 ? ema(closes, 50) : null;

    const rsi = calculateRSI(closes, 14);

    let score = 50;

    // TREND
    let trend = "NEUTRAL";

    if (ema20 && currentClose > ema20) {
      trend = "BULLISH";
      score += 10;
    } else if (ema20 && currentClose < ema20) {
      trend = "BEARISH";
      score -= 10;
    }

    if (ema20 && ema50) {
      if (ema20 > ema50) {
        score += 10;
      } else if (ema20 < ema50) {
        score -= 10;
      }
    }

    // MARKET STRUCTURE
    const recentHighs = highs.slice(-6);
    const recentLows = lows.slice(-6);

    const previousHigh = Math.max(...recentHighs.slice(0, -1));
    const previousLow = Math.min(...recentLows.slice(0, -1));

    const currentHigh = highs[lastIndex];
    const currentLow = lows[lastIndex];

    let structure = "RANGING";
    let bos = "NONE";

    if (
      currentHigh > previousHigh &&
      currentClose > previousClose
    ) {
      structure = "HH / HL";
      bos = "BULLISH BOS";
      score += 15;
    } else if (
      currentLow < previousLow &&
      currentClose < previousClose
    ) {
      structure = "LH / LL";
      bos = "BEARISH BOS";
      score -= 15;
    }

    // LIQUIDITY
    const lookbackHigh = Math.max(...highs.slice(-20, -1));
    const lookbackLow = Math.min(...lows.slice(-20, -1));

    let liquidity = "NORMAL";

    if (
      currentHigh > lookbackHigh &&
      currentClose < currentHigh
    ) {
      liquidity = "BUY-SIDE SWEEP";
      score -= 5;
    }

    if (
      currentLow < lookbackLow &&
      currentClose > currentLow
    ) {
      liquidity = "SELL-SIDE SWEEP";
      score += 5;
    }

    // ORDER BLOCK / CANDLE PRESSURE
    const currentOpen = opens[lastIndex];

    let orderBlock = "NONE";

    if (
      currentClose > currentOpen &&
      currentClose > previousClose
    ) {
      orderBlock = "BULLISH";
      score += 5;
    } else if (
      currentClose < currentOpen &&
      currentClose < previousClose
    ) {
      orderBlock = "BEARISH";
      score -= 5;
    }

    // RSI MOMENTUM
    if (rsi > 55 && rsi < 75) {
      score += 10;
    }

    if (rsi < 45 && rsi > 25) {
      score -= 10;
    }

    if (rsi >= 75) {
      score -= 5;
    }

    if (rsi <= 25) {
      score += 5;
    }

    // VOLATILITY
    const ranges = ordered
      .slice(-14)
      .map((c) => Number(c.high) - Number(c.low));

    const avgRange =
      ranges.reduce((a, b) => a + b, 0) / ranges.length;

    const latestRange = currentHigh - currentLow;

    let volatility = "NORMAL";

    if (latestRange > avgRange * 1.5) {
      volatility = "HIGH";
    } else if (latestRange < avgRange * 0.6) {
      volatility = "LOW";
    }

    // Prevent score exceeding 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    let signal = "WAIT";

    if (score >= 70) {
      signal = "BUY";
    } else if (score <= 30) {
      signal = "SELL";
    }

    return {
      trend,
      structure,
      bos,
      liquidity,
      orderBlock,
      volatility,
      score,
      signal,
      rsi: rsi.toFixed(1),
      price: currentClose
    };
  }

  async function scanPair(symbol, row) {
    const cells = row.querySelectorAll("td");

    cells[1].textContent = "Scanning...";
    cells[2].textContent = "Scanning...";
    cells[3].textContent = "...";
    cells[4].textContent = "...";
    cells[5].textContent = "...";
    cells[6].textContent = "...";
    cells[7].textContent = "...";
    cells[8].textContent = "WAIT";

    try {
      const response = await fetch(
        `/api/forex?symbol=${encodeURIComponent(symbol)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "error" || data.error) {
        throw new Error(
          data.message || data.error || "Market data error"
        );
      }

      if (!Array.isArray(data.values)) {
        throw new Error("No candle data returned");
      }

      const analysis = analyzeMarket(data.values);

      cells[1].textContent = analysis.trend;
      cells[2].textContent = analysis.structure;
      cells[3].textContent = analysis.bos;
      cells[4].textContent = analysis.liquidity;
      cells[5].textContent = analysis.orderBlock;
      cells[6].textContent = analysis.volatility;
      cells[7].textContent = analysis.score;
      cells[8].textContent = analysis.signal;

      if (analysis.signal === "BUY") {
        cells[8].style.color = "#00d084";
      } else if (analysis.signal === "SELL") {
        cells[8].style.color = "#ff4d4d";
      } else {
        cells[8].style.color = "#ffb000";
      }

      return {
        symbol,
        ...analysis
      };
    } catch (error) {
      console.error(`${symbol} scan failed:`, error);

      cells[1].textContent = "ERROR";
      cells[2].textContent = "No Data";
      cells[3].textContent = "—";
      cells[4].textContent = "—";
      cells[5].textContent = "—";
      cells[6].textContent = "—";
      cells[7].textContent = "0";
      cells[8].textContent = "WAIT";

      return {
        symbol,
        error: error.message
      };
    }
  }

  scanBtn.addEventListener("click", async () => {
    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning Market...";

    if (aiAnalysis) {
      aiAnalysis.textContent =
        "Richmond AI is downloading live 15-minute candles and analysing market structure, trend, liquidity and momentum...";
    }

    const rows = Array.from(
      scannerBody.querySelectorAll("tr")
    );

    const results = [];

    for (const row of rows) {
      const cells = row.querySelectorAll("td");

      if (!cells.length) continue;

      const symbol = cells[0].textContent.trim();

      const result = await scanPair(symbol, row);
      results.push(result);

      // Small delay between API requests
      await sleep(500);
    }

    const buySignals = results.filter(
      (r) => r.signal === "BUY"
    );

    const sellSignals = results.filter(
      (r) => r.signal === "SELL"
    );

    const errors = results.filter((r) => r.error);

    if (aiAnalysis) {
      if (errors.length === results.length) {
        aiAnalysis.textContent =
          "Richmond AI could not retrieve market data. Check the market-data connection.";
      } else if (buySignals.length || sellSignals.length) {
        const signals = [
          ...buySignals.map(
            (r) => `${r.symbol} BUY (${r.score}%)`
          ),
          ...sellSignals.map(
            (r) => `${r.symbol} SELL (${r.score}%)`
          )
        ];

        aiAnalysis.textContent =
          `Scan complete. Richmond AI detected: ${signals.join(
            " • "
          )}. Confirm signals with risk management before trading.`;
      } else {
        aiAnalysis.textContent =
          "Scan complete. No high-confidence trade setup is currently confirmed. Richmond AI recommends WAIT.";
      }
    }

    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Market";
  });
});
