require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const cron = require("node-cron");
const NodeCache = require("node-cache");
const { formatDatesForApi } = require("./utils/dateFormatter");
const { parseXMLtoObject } = require("./utils/dataParser");

const app = express();

app.use(cors());
app.use(express.static("dist"));

// Cache for the data, 60 minutes, scheduled to fetch new data every hour
const dataCache = new NodeCache({ stdTTL: 3600 }); // 60 minutes cache

const fetchData = async () => {
  const [periodStart, periodEnd] = await formatDatesForApi();
  const apiKey = process.env.VITE_API_KEY;

  const url = `https://web-api.tp.entsoe.eu/api?documentType=A44&out_Domain=10YFI-1--------U&in_Domain=10YFI-1--------U&periodStart=${periodStart}&periodEnd=${periodEnd}&securityToken=${apiKey}`;

  const response = await fetch(url);
  const xmlData = await response.text(); // Response is XML
  const parsedData = await parseXMLtoObject(xmlData); // Parse XML to JS object

  dataCache.set("priceData", parsedData);
};

// Initial fetch
fetchData();

// Scheduler to fetch data every hour
cron.schedule("0 * * * *", fetchData);

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
