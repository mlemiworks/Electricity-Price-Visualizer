require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const NodeCache = require("node-cache");
const { formatDatesForApi } = require("./utils/dateFormatter");
const { parseData } = require("./utils/dataParser");

const app = express();

app.use(cors());
app.use(express.static("dist"));

const dataCache = new NodeCache({ stdTTL: 0 }); // 0 = no expiry

const apiKey = process.env.VITE_API_KEY;
if (!apiKey) {
  console.error("VITE_API_KEY is not set. Price data cannot be fetched.");
}

const fetchData = async () => {
  if (!apiKey) return;

  try {
    const [periodStart, periodEnd] = formatDatesForApi();

    const url = `https://web-api.tp.entsoe.eu/api?documentType=A44&out_Domain=10YFI-1--------U&in_Domain=10YFI-1--------U&periodStart=${periodStart}&periodEnd=${periodEnd}&securityToken=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const xmlData = await response.text();
    const parsedData = await parseData(xmlData);

    // Only update cache after a successful fetch and parse
    dataCache.del("priceData");
    dataCache.set("priceData", parsedData);
    console.log(`Fetched ${parsedData.todaysPrices.hourly.length} hourly points for today`);
  } catch (err) {
    console.error("Failed to fetch price data:", err.message);
  }
};

// Initial fetch on startup
fetchData();

cron.schedule(
  // Every day at 14:15, as new data is usually available by then
  "15 14 * * *",
  () => {
    fetchData();
  },
  {
    scheduled: true,
    timezone: "Europe/Helsinki",
  }
);

// Day changes: drop today's data and promote tomorrow's to today
cron.schedule(
  "0 0 * * *",
  () => {
    const cachedData = dataCache.get("priceData");
    if (!cachedData) {
      fetchData();
    } else {
      const shiftedData = {
        ...cachedData,
        todaysPrices: cachedData.tomorrowsPrices,
        tomorrowsPrices: [],
      };
      dataCache.set("priceData", shiftedData);
      console.log("Shifted data for new day");
    }
  },
  {
    scheduled: true,
    timezone: "Europe/Helsinki",
  }
);

// If data is not in cache, fetch it on demand
app.get("/api", async (req, res) => {
  const cachedData = dataCache.get("priceData");

  if (cachedData) {
    res.json(cachedData);
  } else {
    await fetchData();
    const freshData = dataCache.get("priceData");
    if (freshData) {
      res.json(freshData);
    } else {
      res.status(503).json({ error: "Price data unavailable" });
    }
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
