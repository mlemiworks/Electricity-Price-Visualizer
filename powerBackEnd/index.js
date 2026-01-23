require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const cron = require("node-cron");
const moment = require("moment-timezone");
const NodeCache = require("node-cache");
const { formatDatesForApi } = require("./utils/dateFormatter");
const { parseData } = require("./utils/dataParser");

const app = express();

app.use(cors());
app.use(express.static("dist"));

// Cache for the data
const dataCache = new NodeCache({ stdTTL: 0 }); // 0 means infinite time to live

const fetchData = async () => {
  // empty cache, otherwise yesterday's data will be shown
  // as tomorrows data when day changes, and new data is not available yet
  dataCache.del("priceData");

  const [periodStart, periodEnd] = await formatDatesForApi();
  const apiKey = process.env.VITE_API_KEY;

  const url = `https://web-api.tp.entsoe.eu/api?documentType=A44&out_Domain=10YFI-1--------U&in_Domain=10YFI-1--------U&periodStart=${periodStart}&periodEnd=${periodEnd}&securityToken=${apiKey}`;

  const response = await fetch(url);
  const xmlData = await response.text(); // Response is XML
  const parsedData = await parseData(xmlData); // Parse XML to JS object



  console.log("Data fetched and parsed");
  console.log(parsedData);

  dataCache.set("priceData", parsedData);
};

// Initial fetch
fetchData();

cron.schedule(
  // Every day at 14:15, as new data is usually available by then
  "15 14 * * *",
  () => {
    fetchData();
  },
  {
    scheduled: true,
    timezone: "Europe/Helsinki", // Set the timezone for the schedule
  }
);

// Day changes, drop todays data and set tomorrows data to todays
cron.schedule(
  "0 0 * * *", // Every day at 00:00
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

// API endpoint, if data is not in cache, fetch it
app.get("/api", async (req, res) => {
  const cachedData = dataCache.get("priceData");

  if (cachedData) {
    res.json(cachedData);
  } else {
    await fetchData();
    res.json(cachedData);
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
