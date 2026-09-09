// Cloudflare auto-deploy test
const APP_NAME = "Richmond AI Forex Market";

document.addEventListener("DOMContentLoaded", () => {
  console.log(`${APP_NAME} loaded successfully`);

  const scanBtn = document.getElementById("scanMarketBtn");
  const scannerBody = document.getElementById("scannerBody");
  const aiAnalysis = document.getElementById("aiAnalysis");

  if (!scanBtn || !scannerBody) return;

  scanBtn.addEventListener("click", async () => {
    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning Market...";

    aiAnalysis.textContent =
      "Richmond AI is preparing the market scan. Live forex data connection will be added next.";

    const rows = scannerBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");

      if (cells.length >= 9) {
        cells[1].textContent = "Scanning...";
        cells[2].textContent = "Scanning...";
        cells[3].textContent = "...";
        cells[4].textContent = "...";
        cells[5].textContent = "...";
        cells[6].textContent = "...";
        cells[7].textContent = "—";
        cells[8].textContent = "WAIT";
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");

      if (cells.length >= 9) {
        cells[1].textContent = "Data Required";
        cells[2].textContent = "Data Required";
        cells[3].textContent = "—";
        cells[4].textContent = "—";
        cells[5].textContent = "—";
        cells[6].textContent = "—";
        cells[7].textContent = "0";
        cells[8].textContent = "WAIT";
      }
    });

    aiAnalysis.textContent =
      "Scanner interface is working. The next step is connecting secure live forex candle data so Richmond AI can calculate real trend, structure, BOS/CHoCH, liquidity, order blocks, volatility and indicators.";

    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Market";
  });
});
