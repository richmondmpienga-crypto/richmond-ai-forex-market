const params = new URLSearchParams(window.location.search);
const symbol = params.get("symbol") || "XAU/USD";

let selectedInterval = "15min";

const tradingViewSymbols = {
 "EUR/USD": "OANDA:EURUSD",
"GBP/USD": "OANDA:GBPUSD",
"USD/JPY": "OANDA:USDJPY",
"XAU/USD": "OANDA:XAUUSD"
};

const tradingViewIntervals = {
  "1min": "1",
  "5min": "5",
  "15min": "15",
  "30min": "30",
  "1h": "60",
  "4h": "240"
};

document.addEventListener("DOMContentLoaded", () => {
  const pairTitle = document.getElementById("pairTitle");
  const currentPrice = document.getElementById("currentPrice");
  const aiScore = document.getElementById("aiScore");
  const signalValue = document.getElementById("signalValue");
  const timeframeValue = document.getElementById("timeframeValue");

  const ema20Value = document.getElementById("ema20Value");
  const ema50Value = document.getElementById("ema50Value");
  const ema200Value = document.getElementById("ema200Value");

  const rsiValue = document.getElementById("pairRsiValue");
  const macdValue = document.getElementById("pairMacdValue");
  const adxValue = document.getElementById("pairAdxValue");
  const atrValue = document.getElementById("pairAtrValue");

  const bbUpperValue = document.getElementById("bbUpperValue");
  const bbMiddleValue = document.getElementById("bbMiddleValue");
  const bbLowerValue = document.getElementById("bbLowerValue");

  const trendValue = document.getElementById("trendValue");
  const structureValue = document.getElementById("structureValue");
  const bosValue = document.getElementById("bosValue");
  const liquidityValue = document.getElementById("liquidityValue");
  const orderBlockValue = document.getElementById("orderBlockValue");
  const volatilityValue = document.getElementById("volatilityValue");
const entryValue = document.getElementById("entryValue");
const stopLossValue = document.getElementById("stopLossValue");
const tp1Value = document.getElementById("tp1Value");
const tp2Value = document.getElementById("tp2Value");
const riskRewardValue = document.getElementById("riskRewardValue");
const lastUpdatedValue = document.getElementById("lastUpdatedValue");
const tradeReasonValue = document.getElementById("tradeReasonValue");

const tradeStatusValue = document.getElementById("tradeStatusValue");
const confidenceValue = document.getElementById("confidenceValue");
const directionValue = document.getElementById("directionValue");
const confirmationTimeframeValue = document.getElementById("confirmationTimeframeValue");
const confirmationReasonValue = document.getElementById("confirmationReasonValue");
  pairTitle.textContent = `${symbol} — Richmond AI Analysis`;

  function ema(values, period) {
    if (!values || values.length < period) return null;

    const multiplier = 2 / (period + 1);

    let result =
      values.slice(0, period).reduce((a, b) => a + b, 0) /
      period;

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

    for (
      let i = values.length - period;
      i < values.length;
      i++
    ) {
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

  function calculateMACD(values) {
    if (!values || values.length < 26) return 0;

    const fast = ema(values, 12);
    const slow = ema(values, 26);

    return fast - slow;
  }

  function calculateATR(candles, period = 14) {
    if (!candles || candles.length <= period) return 0;

    const ranges = [];

    for (let i = 1; i < candles.length; i++) {
      const high = Number(candles[i].high);
      const low = Number(candles[i].low);
      const prevClose = Number(candles[i - 1].close);

      ranges.push(
        Math.max(
          high - low,
          Math.abs(high - prevClose),
          Math.abs(low - prevClose)
        )
      );
    }

    const recent = ranges.slice(-period);

    return (
      recent.reduce((a, b) => a + b, 0) /
      recent.length
    );
  }

  function calculateADX(candles, period = 14) {
    if (!candles || candles.length <= period + 1) {
      return 0;
    }

    const recent = candles.slice(-(period + 1));

    let plusDM = 0;
    let minusDM = 0;
    let trTotal = 0;

    for (let i = 1; i < recent.length; i++) {
      const high = Number(recent[i].high);
      const low = Number(recent[i].low);

      const previousHigh = Number(recent[i - 1].high);
      const previousLow = Number(recent[i - 1].low);
      const previousClose = Number(recent[i - 1].close);

      const upMove = high - previousHigh;
      const downMove = previousLow - low;

      if (upMove > downMove && upMove > 0) {
        plusDM += upMove;
      }

      if (downMove > upMove && downMove > 0) {
        minusDM += downMove;
      }

      trTotal += Math.max(
        high - low,
        Math.abs(high - previousClose),
        Math.abs(low - previousClose)
      );
    }

    if (trTotal === 0) return 0;

    const plusDI = 100 * (plusDM / trTotal);
    const minusDI = 100 * (minusDM / trTotal);

    const denominator = plusDI + minusDI;

    if (denominator === 0) return 0;

    return (
      100 *
      Math.abs(plusDI - minusDI) /
      denominator
    );
  }

  function calculateBollinger(values, period = 20) {
    if (!values || values.length < period) {
      return {
        upper: 0,
        middle: 0,
        lower: 0
      };
    }

    const recent = values.slice(-period);

    const middle =
      recent.reduce((a, b) => a + b, 0) /
      period;

    const variance =
      recent.reduce(
        (sum, value) =>
          sum + Math.pow(value - middle, 2),
        0
      ) / period;

    const deviation = Math.sqrt(variance);

    return {
      upper: middle + deviation * 2,
      middle,
      lower: middle - deviation * 2
    };
  }

  function analyse(candles) {
    const ordered = [...candles].reverse();

    const closes = ordered.map((c) => Number(c.close));
    const highs = ordered.map((c) => Number(c.high));
    const lows = ordered.map((c) => Number(c.low));
    const opens = ordered.map((c) => Number(c.open));

    const last = closes.length - 1;

    const price = closes[last];
    const previousClose = closes[last - 1];

    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const ema200 = ema(closes, 200);

    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const adx = calculateADX(ordered);
    const atr = calculateATR(ordered);
    const bb = calculateBollinger(closes);

    let score = 50;

    let trend = "NEUTRAL";

    if (price > ema20) {
      trend = "BULLISH";
      score += 10;
    } else if (price < ema20) {
      trend = "BEARISH";
      score -= 10;
    }

    if (ema20 > ema50) {
      score += 10;
    } else {
      score -= 10;
    }

    if (ema50 > ema200) {
      score += 10;
    } else {
      score -= 10;
    }

    const currentHigh = highs[last];
    const currentLow = lows[last];

    const recentHighs = highs.slice(-6);
    const recentLows = lows.slice(-6);

    const previousHigh = Math.max(
      ...recentHighs.slice(0, -1)
    );

    const previousLow = Math.min(
      ...recentLows.slice(0, -1)
    );

    let structure = "RANGING";
    let bos = "NONE";

    if (
      currentHigh > previousHigh &&
      price > previousClose
    ) {
      structure = "HH / HL";
      bos = "BULLISH BOS";
      score += 15;
    } else if (
      currentLow < previousLow &&
      price < previousClose
    ) {
      structure = "LH / LL";
      bos = "BEARISH BOS";
      score -= 15;
    }

    const lookbackHigh = Math.max(
      ...highs.slice(-20, -1)
    );

    const lookbackLow = Math.min(
      ...lows.slice(-20, -1)
    );

    let liquidity = "NORMAL";

    if (
      currentHigh > lookbackHigh &&
      price < currentHigh
    ) {
      liquidity = "BUY-SIDE SWEEP";
      score -= 5;
    }

    if (
      currentLow < lookbackLow &&
      price > currentLow
    ) {
      liquidity = "SELL-SIDE SWEEP";
      score += 5;
    }

    let orderBlock = "NONE";

    const currentOpen = opens[last];

    if (
      price > currentOpen &&
      price > previousClose
    ) {
      orderBlock = "BULLISH";
      score += 5;
    } else if (
      price < currentOpen &&
      price < previousClose
    ) {
      orderBlock = "BEARISH";
      score -= 5;
    }

    if (rsi > 55 && rsi < 75) {
      score += 10;
    }

    if (rsi < 45 && rsi > 25) {
      score -= 10;
    }

    const ranges = ordered
      .slice(-14)
      .map(
        (c) =>
          Number(c.high) - Number(c.low)
      );

    const avgRange =
      ranges.reduce((a, b) => a + b, 0) /
      ranges.length;

    const latestRange =
      currentHigh - currentLow;

    let volatility = "NORMAL";

    if (latestRange > avgRange * 1.5) {
      volatility = "HIGH";
    } else if (latestRange < avgRange * 0.6) {
      volatility = "LOW";
    }

    score = Math.max(
      0,
      Math.min(100, Math.round(score))
    );

    let signal = "WAIT";

    if (score >= 70) {
      signal = "BUY";
    } else if (score <= 30) {
      signal = "SELL";
    }

    return {
      price,
      ema20,
      ema50,
      ema200,
      rsi,
      macd,
      adx,
      atr,
      bb,
      trend,
      structure,
      bos,
      liquidity,
      orderBlock,
      volatility,
      score,
      signal
    };
  }

  function formatPrice(value) {
    if (!Number.isFinite(value)) return "--";

    if (symbol === "USD/JPY") {
      return value.toFixed(3);
    }

    if (symbol === "XAU/USD") {
      return value.toFixed(2);
    }

    return value.toFixed(5);
  }

  function loadTradingView() {
  const container = document.getElementById("tradingviewChart");

  if (!container) return;

  container.innerHTML = "";

  const widgetContainer = document.createElement("div");
  widgetContainer.className = "tradingview-widget-container";
  widgetContainer.style.height = "100%";
  widgetContainer.style.width = "100%";

  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container__widget";
  widget.style.height = "100%";
  widget.style.width = "100%";

  const script = document.createElement("script");

  script.src =
    "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

  script.type = "text/javascript";
  script.async = true;

  script.innerHTML = JSON.stringify({
    autosize: true,
    symbol:
      tradingViewSymbols[symbol] ||
      "OANDA:XAUUSD",
    interval:
      tradingViewIntervals[selectedInterval] ||
      "15",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    backgroundColor: "#0d1b2f",
    allow_symbol_change: false,
    save_image: false,
    calendar: false,
    support_host: "https://www.tradingview.com"
  });

  widgetContainer.appendChild(widget);
  widgetContainer.appendChild(script);
  container.appendChild(widgetContainer);
}

  async function loadAnalysis() {
    try {
      currentPrice.textContent = "Loading...";

      const response = await fetch(
        `/api/forex?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(selectedInterval)}`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (
        data.error ||
        !Array.isArray(data.values)
      ) {
        throw new Error(
          data.error || "No market data"
        );
      }

      const result = analyse(data.values);
const entry = result.price;

let stopLoss = entry;
let tp1 = entry;
let tp2 = entry;

const riskDistance = result.atr * 1.5;

if (result.signal === "BUY") {
  stopLoss = entry - riskDistance;
  tp1 = entry + riskDistance * 1.5;
  tp2 = entry + riskDistance * 2.5;
} else if (result.signal === "SELL") {
  stopLoss = entry + riskDistance;
  tp1 = entry - riskDistance * 1.5;
  tp2 = entry - riskDistance * 2.5;
}

const riskReward =
  result.signal === "WAIT" ? "--" : "1 : 2.5";

const now = new Date();

const confirmation =
  result.signal === "BUY"
    ? `BUY setup confirmed on ${selectedInterval}. Trend: ${result.trend}, Structure: ${result.structure}, RSI: ${result.rsi.toFixed(1)}, ADX: ${result.adx.toFixed(1)}.`
    : result.signal === "SELL"
    ? `SELL setup confirmed on ${selectedInterval}. Trend: ${result.trend}, Structure: ${result.structure}, RSI: ${result.rsi.toFixed(1)}, ADX: ${result.adx.toFixed(1)}.`
    : `No confirmed trade setup on ${selectedInterval}. Richmond AI recommends waiting for stronger confirmation.`;
      currentPrice.textContent =
        formatPrice(result.price);

      aiScore.textContent =
        `${result.score} / 100`;

      signalValue.textContent =
        result.signal;

      signalValue.className = "";

      if (result.signal === "BUY") {
        signalValue.classList.add(
          "signal-buy"
        );
      } else if (result.signal === "SELL") {
        signalValue.classList.add(
          "signal-sell"
        );
      } else {
        signalValue.classList.add(
          "signal-wait"
        );
      }

      timeframeValue.textContent =
        selectedInterval;

      ema20Value.textContent =
        formatPrice(result.ema20);

      ema50Value.textContent =
        formatPrice(result.ema50);

      ema200Value.textContent =
        formatPrice(result.ema200);

      rsiValue.textContent =
        result.rsi.toFixed(1);

      macdValue.textContent =
        result.macd.toFixed(5);

      adxValue.textContent =
        result.adx.toFixed(1);

      atrValue.textContent =
        result.atr.toFixed(5);

      bbUpperValue.textContent =
        formatPrice(result.bb.upper);

      bbMiddleValue.textContent =
        formatPrice(result.bb.middle);

      bbLowerValue.textContent =
        formatPrice(result.bb.lower);

      trendValue.textContent =
        result.trend;

      structureValue.textContent =
        result.structure;

      bosValue.textContent =
        result.bos;

      liquidityValue.textContent =
        result.liquidity;

      orderBlockValue.textContent =
        result.orderBlock;

      volatilityValue.textContent =
        result.volatility;
entryValue.textContent = formatPrice(entry);

stopLossValue.textContent =
  result.signal === "WAIT"
    ? "--"
    : formatPrice(stopLoss);

tp1Value.textContent =
  result.signal === "WAIT"
    ? "--"
    : formatPrice(tp1);

tp2Value.textContent =
  result.signal === "WAIT"
    ? "--"
    : formatPrice(tp2);

riskRewardValue.textContent = riskReward;

lastUpdatedValue.textContent =
  now.toLocaleTimeString();

tradeReasonValue.textContent =
  confirmation;

tradeStatusValue.textContent =
  result.signal;

confidenceValue.textContent =
  `${result.score} / 100`;

directionValue.textContent =
  result.signal;

confirmationTimeframeValue.textContent =
  selectedInterval;

confirmationReasonValue.textContent =
  confirmation;
    } catch (error) {
      console.error(error);

      currentPrice.textContent = "Data Error";
      aiScore.textContent = "--";
      signalValue.textContent = "WAIT";
    }
  }

  document
    .querySelectorAll(".timeframe-btn")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        document
          .querySelectorAll(".timeframe-btn")
          .forEach((btn) =>
            btn.classList.remove("active")
          );

        button.classList.add("active");

        selectedInterval =
          button.dataset.interval;

        timeframeValue.textContent =
          selectedInterval;

        loadTradingView();
        await loadAnalysis();
      });
    });

  loadTradingView();
  loadAnalysis();

  // Refresh analysis every 60 seconds.
  setInterval(loadAnalysis, 60000);
});
