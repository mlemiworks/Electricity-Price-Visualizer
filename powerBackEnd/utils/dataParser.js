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
        // Existing value
        lastKnownValue = pointMap[pos];
        filledPoints.push({
          position: pos,
          "price.amount": [lastKnownValue]
        });
      } else if (lastKnownValue !== null) {
        // Fill missing position with last known value
        filledPoints.push({
          position: pos,
          "price.amount": [lastKnownValue]
        });
      } else {
        // No known value yet? Skip or handle error.
        // You can default to "0" or throw error
        filledPoints.push({
          position: pos,
          "price.amount": ["0.00"]
        });
      }
    }

    // Overwrite the original Point array
    period.Point = filledPoints;
  }

  return timeSeriesData;
};

const convertToDataPoints = (timeSeriesDataRaw, startDate) => {
  let dataPoints = [];
  let date = new Date(startDate); // This will be incremented

  const timeSeriesData = fillMissingPricePoints(timeSeriesDataRaw)

  for (let i = 0; i < timeSeriesData.length; i++) {
    const periodPoints = timeSeriesData[i].Period[0].Point;
    for (let j = 0; j < periodPoints.length; j++) {
      const pricePerMwh = parseFloat(periodPoints[j]["price.amount"][0]) * 1.255;
      const pricePerKwh = pricePerMwh / 10;
      const finalPrice = Math.round(pricePerKwh * 100) / 100;

      const dataPoint = {
        ts: date.toISOString(),
        price: finalPrice
      };


      dataPoints.push(dataPoint);

      date.setMinutes(date.getMinutes() + 15);
    }
  }

  return dataPoints;
}

const calculateHourlyRates = (dataPoints) => {

  let hourlyRate = []

  for (let i = 0; i <= dataPoints.length - 4; i += 4) {
    let average = (
      parseFloat(dataPoints[i]["price"]) +
      parseFloat(dataPoints[i + 1]["price"]) +
      parseFloat(dataPoints[i + 2]["price"]) +
      parseFloat(dataPoints[i + 3]["price"])) / 4;

    const dataPoint = {
      ts: dataPoints[i]["ts"],
      price: Math.round(average * 100) / 100
    }

    hourlyRate.push(dataPoint)
  }

  return hourlyRate;
}


const setStartDateToToday = (dataPoints) => {
  // Get today’s midnight in Helsinki local time
  const helsinkiMidnight = moment.tz("Europe/Helsinki").startOf('day');

  // Convert to a regular Date object in UTC
  const utcMidnight = helsinkiMidnight.toDate();

  // Filter all data points from that UTC timestamp onward
  return dataPoints.filter(p => new Date(p.ts) >= utcMidnight);
};


const parseData = async (rawXml) => {
  const parsedXml = await xml2js.parseStringPromise(rawXml);

  const timeSeriesStart = parsedXml.Publication_MarketDocument.TimeSeries[0].Period[0].timeInterval[0].start
  const timeSeriesData = parsedXml.Publication_MarketDocument.TimeSeries

  let dataPointsQuarterly = []
  let dataPointsHourly = []

  let date = new Date(timeSeriesStart)
  let hours = 0

  const tempDataPoints = convertToDataPoints(timeSeriesData, timeSeriesStart)

  dataPointsQuarterly = setStartDateToToday(tempDataPoints)
  dataPointsHourly = calculateHourlyRates(dataPointsQuarterly)

  const fmt = new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  function formatArray(arr) {
    return arr.map(p => {
      const d = new Date(p.ts);
      return {
        ts: fmt.format(d),
        price: p.price
      };
    });
  }



  let todaysPrices = dataPointsHourly.slice(0, 24)
  let tomorrowsPrices = dataPointsHourly.length >= 47 ? dataPointsHourly.slice(24, 48) : []



  return { todaysPrices, tomorrowsPrices };

}

module.exports = { parseData };
