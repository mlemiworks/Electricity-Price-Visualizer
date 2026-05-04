const xml2js = require('xml2js');
const moment = require('moment-timezone');

const fillMissingPricePoints = (timeSeriesData) => {
  const expectedPoints = 96;

  for (let i = 0; i < timeSeriesData.length; i++) {
    const period = timeSeriesData[i].Period[0];
    const existingPoints = period.Point;

    // Create a map of existing positions to their values
    const pointMap = {};
    for (let p of existingPoints) {
      pointMap[parseInt(p.position)] = p["price.amount"][0];
    }

    const filledPoints = [];
    let lastKnownValue = null;

    for (let pos = 1; pos <= expectedPoints; pos++) {
      if (pointMap[pos] !== undefined) {
        lastKnownValue = pointMap[pos];
        filledPoints.push({
          position: pos,
          "price.amount": [lastKnownValue]
        });
      } else if (lastKnownValue !== null) {
        filledPoints.push({
          position: pos,
          "price.amount": [lastKnownValue]
        });
      } else {
        filledPoints.push({
          position: pos,
          "price.amount": ["0.00"]
        });
      }
    }

    period.Point = filledPoints;
  }

  return timeSeriesData;
};

// Each TimeSeries in the API response can have its own start date.
// Extract it per-series to avoid wrong timestamps when multiple series are returned.
const convertToDataPoints = (timeSeriesDataRaw) => {
  let dataPoints = [];

  const timeSeriesData = fillMissingPricePoints(timeSeriesDataRaw);

  for (let i = 0; i < timeSeriesData.length; i++) {
    const seriesStart = timeSeriesData[i].Period[0].timeInterval[0].start;
    let date = new Date(seriesStart);

    const periodPoints = timeSeriesData[i].Period[0].Point;
    for (let j = 0; j < periodPoints.length; j++) {
      const pricePerMwh = parseFloat(periodPoints[j]["price.amount"][0]) * 1.255;
      const pricePerKwh = pricePerMwh / 10;
      const finalPrice = Math.round(pricePerKwh * 100) / 100;

      dataPoints.push({
        ts: date.toISOString(),
        price: finalPrice
      });

      date.setMinutes(date.getMinutes() + 15);
    }
  }

  return dataPoints;
};

const calculateHourlyRates = (dataPoints) => {
  let hourlyRate = [];

  for (let i = 0; i <= dataPoints.length - 4; i += 4) {
    let average = (
      parseFloat(dataPoints[i]["price"]) +
      parseFloat(dataPoints[i + 1]["price"]) +
      parseFloat(dataPoints[i + 2]["price"]) +
      parseFloat(dataPoints[i + 3]["price"])) / 4;

    hourlyRate.push({
      ts: dataPoints[i]["ts"],
      price: Math.round(average * 100) / 100
    });
  }

  return hourlyRate;
};

const setStartDateToToday = (dataPoints) => {
  // Get today's midnight in Helsinki local time
  const helsinkiMidnight = moment.tz("Europe/Helsinki").startOf('day');

  // Convert to a regular Date object in UTC
  const utcMidnight = helsinkiMidnight.toDate();

  // Filter all data points from that UTC timestamp onward
  return dataPoints.filter(p => new Date(p.ts) >= utcMidnight);
};

const parseData = async (rawXml) => {
  const parsedXml = await xml2js.parseStringPromise(rawXml);

  if (!parsedXml?.Publication_MarketDocument?.TimeSeries) {
    throw new Error("Unexpected API response: missing Publication_MarketDocument.TimeSeries");
  }

  const timeSeriesData = parsedXml.Publication_MarketDocument.TimeSeries;

  const tempDataPoints = convertToDataPoints(timeSeriesData);

  const dataPointsQuarterly = setStartDateToToday(tempDataPoints);
  const dataPointsHourly = calculateHourlyRates(dataPointsQuarterly);

  // Use Helsinki time for today/tomorrow boundary to match the cron schedule timezone.
  // Using system local time would be wrong on a UTC server (off by 2-3 hours).
  const startOfDay = moment.tz("Europe/Helsinki").startOf("day").valueOf();
  const endOfDay = moment.tz("Europe/Helsinki").startOf("day").add(1, "day").valueOf();

  const todaysPrices = {
    hourly: dataPointsHourly.filter(e => {
      const ts = new Date(e.ts).getTime();
      return ts >= startOfDay && ts < endOfDay;
    }),
    quarterly: dataPointsQuarterly.filter(e => {
      const ts = new Date(e.ts).getTime();
      return ts >= startOfDay && ts < endOfDay;
    })
  };

  // Tomorrow's prices are used for the "next 24h" view, so we include all points from the next day.
  const tomorrowsPrices = {
    hourly: dataPointsHourly.filter(e => new Date(e.ts).getTime() >= endOfDay && new Date(e.ts).getTime() < endOfDay + 24 * 60 * 60 * 1000),
    quarterly: dataPointsQuarterly.filter(e => new Date(e.ts).getTime() >= endOfDay && new Date(e.ts).getTime() < endOfDay + 24 * 60 * 60 * 1000)
  };


  return { todaysPrices, tomorrowsPrices };
};

module.exports = { parseData };
