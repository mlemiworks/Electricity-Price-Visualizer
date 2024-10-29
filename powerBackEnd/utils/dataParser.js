const moment = require("moment-timezone"); // Importing moment-timezone
const xml2js = require("xml2js");

//Timezone has to be set to Helsinki, because the prices are in Helsinki timezone.

// Timezone for Helsinki
const timeZone = "Europe/Helsinki";
let finalData = [];

// Function to parse XML to Object for better manipulation
const parseXMLtoObject = (rawXml) => {
  const xmlData = rawXml;
  //console.log(xmlData);

  xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    const timeSeries = result["Publication_MarketDocument"]["TimeSeries"];
    const jsonResult = {};

    timeSeries.forEach((series) => {
      const period = series["Period"]["timeInterval"];
      const start = period["start"];
      const pricePoints = series["Period"]["Point"].map((point) => ({
        position: point.position,
        price: parseFloat(point["price.amount"]), // Ensure price is a float here
      }));

      // Initialize the date entry if it doesn't exist
      if (!jsonResult[start]) {
        jsonResult[start] = [];
      }

      jsonResult[start].push(...pricePoints);
    });

    // Convert keys to an array, sort the dates, and build a new object
    const sortedDates = Object.keys(jsonResult).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    // Create a new sorted object.
    // Sometimes the dates in data are not in order, so we need to sort it.
    const sortedJsonResult = {};
    sortedDates.forEach((date) => {
      sortedJsonResult[date] = jsonResult[date];
    });

    // Total number of expected positions (hours) in the data
    const totalPositions = 24;

    // Create a new object to hold filled price points for each date
    const filledPricePointsByDate = {};

    // Fill missing positions with default price 0 for each date.
    // Sometimes, if there are consecutive 0 prices, it skips the position in the xml.
    // These skipped positions seem to be often zeros, so we fill them with zeros.
    for (const date in sortedJsonResult) {
      const filledPricePoints = [];
      for (let i = 1; i <= totalPositions; i++) {
        const positionStr = i.toString();
        const existingPoint = sortedJsonResult[date].find(
          (point) => point.position === positionStr
        );

        // If point exists, use its price; otherwise, use the default price of 0
        filledPricePoints.push({
          position: positionStr,
          price: existingPoint
            ? parseFloat(((existingPoint.price * 1.255) / 10).toFixed(2))
            : 0.0, // Ensure price is a float
        });
      }
      filledPricePointsByDate[date] = filledPricePoints;
    }

    // If in summer time, shift the prices by one position to the left
    if (isDaylightSavingTimeHelsinki()) {
      shiftPrices(filledPricePointsByDate); // Shift the prices
      console.log("this is shifted data", filledPricePointsByDate);
    } else {
      console.log("unshifted: ", filledPricePointsByDate)
    }

    

    // Now call the shift and pair functions in the correct order
    finalData = pairPricesWithDate(filledPricePointsByDate);

    //console.log(finalData);
  });

  return finalData;
};

// We shift the prices to the left by one position to match the correct time slots
// this way we move the last price of the previous day to the first position of the current day
// for example, the price at 00:00 is now for the 00:00-01:00 time slot
function shiftPrices(data) {
  let lastPriceOfPreviousDay = 0;


  Object.keys(data).forEach((date) => {
    const prices = data[date].map((item) => item.price);
    prices.unshift(lastPriceOfPreviousDay);
    lastPriceOfPreviousDay = prices.pop();

    data[date] = data[date].map((item, index) => ({
      position: item.position,
      price: prices[index],
    }));
  });
}

// Check if daylight saving time is active in Helsinki. 
function isDaylightSavingTimeHelsinki() {
  const jan = new Date(`January 1 ${new Date().getFullYear()} 00:00:00`).toLocaleString("en-US", { timeZone });
  const jul = new Date(`July 1 ${new Date().getFullYear()} 00:00:00`).toLocaleString("en-US", { timeZone});
  
  const janOffset = new Date(jan).getTimezoneOffset();
  const julOffset = new Date(jul).getTimezoneOffset();
  const isDST = janOffset !== julOffset && new Date().getTimezoneOffset() === Math.min(janOffset, julOffset);

  return isDST ? true : false;
}

// Creates two arrays, one for today's prices and one for tomorrow's prices
// The prices are paired with the correct time slots (hours)
const pairPricesWithDate = (data) => {
  let todaysPrices = [];
  let tomorrowsPrices = [];

  // Get the start of today's date at 00:00 in Helsinki time
  const startOfToday = moment.tz(timeZone).startOf("day").add(3, "hours");
  console.log("start of today", startOfToday);

  // Get the start of tomorrow's date at 00:00 in Helsinki time
  const startOfTomorrow = moment
    .tz(timeZone)
    .startOf("day")
    .add(1, "days")
    .add(3, "hours");

  // Process each date in the data object
  Object.keys(data).forEach((dateKey) => {
    // Parse the base date key and add two hours in Helsinki time
    const baseDate = moment.tz(dateKey, timeZone).add(2, "hours");

    // Pair prices with time slots (hours) based on the base date
    const pairedData = data[dateKey].map((item, index) => {
      const date = baseDate.clone().add(index, "hours");
      return { date: date.toDate(), price: item.price };
    });

    // Separate today's and tomorrow's prices based on the Helsinki time zone
    pairedData.forEach((item) => {
      const itemDate = moment(item.date);

      if (itemDate.isBetween(startOfToday, startOfTomorrow, null, "[)")) {
        todaysPrices.push(item);
      } else if (itemDate.isSameOrAfter(startOfTomorrow)) {
        tomorrowsPrices.push(item);
      }
    });
  });

  return { todaysPrices, tomorrowsPrices };
};

module.exports = {
  parseXMLtoObject,
};
