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

    console.log(sortedJsonResult)

    // Total number of expected positions (hours) in the data
    const totalPositions = 24;

    // Create a new object to hold filled price points for each date
    const filledPricePointsByDate = {};
    let lastprice = 0.0;

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
            : lastprice, // Ensure price is a float
        });

        lastprice = existingPoint
          ? parseFloat(((existingPoint.price * 1.255) / 10).toFixed(2))
          : lastprice;
      }
      filledPricePointsByDate[date] = filledPricePoints;
    }

    console.log(filledPricePointsByDate)

    // Now call the shift and pair functions in the correct order
    finalData = pairPricesWithDate(filledPricePointsByDate);

  });



  return finalData;
};


// Check if daylight saving time is active in Helsinki. 
function isDaylightSavingTimeHelsinki() {
  const jan = new Date(`January 1 ${new Date().getFullYear()} 00:00:00`).toLocaleString("en-US", { timeZone });
  const jul = new Date(`July 1 ${new Date().getFullYear()} 00:00:00`).toLocaleString("en-US", { timeZone });

  const janOffset = new Date(jan).getTimezoneOffset();
  const julOffset = new Date(jul).getTimezoneOffset();
  const isDST = janOffset !== julOffset && new Date().getTimezoneOffset() === Math.min(janOffset, julOffset);

  return isDST ? true : false;
}


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

function isLastSundayOfMarch(date = new Date()) {
  if (date.getMonth() !== 2) return false; // March is month index 2 in JS (0-based index)
  if (date.getDay() !== 0) return false; // Sunday is 0 in JS Date API

  const lastDayOfMarch = new Date(date.getFullYear(), 2, 31); // March 31st
  const lastSunday = lastDayOfMarch.getDate() - lastDayOfMarch.getDay(); // Go back to the last Sunday

  return date.getDate() === lastSunday;
}

function adjustForDST(prices) {
  if (!isLastSundayOfMarch(new Date())) return prices; // No changes if not DST transition day

  // Create a new array for modified prices
  let newPrices = [];

  for (let entry of prices) {
    let hour = entry.date.getUTCHours();

    if (hour < 3) {
      newPrices.push(entry); // Keep entries before 03:00 unchanged
    } else {
      // Shift entries from 03:00 onwards by +1 hour
      let newEntry = {
        date: new Date(entry.date.getTime() + 60 * 60 * 1000), // Add 1 hour
        price: entry.price
      };
      newPrices.push(newEntry);
    }
  }

  // Insert the DST entry at 03:00
  const dstEntry = {
    date: new Date(Date.UTC(2025, 2, 30, 3, 0, 0)), // 03:00 UTC
    price: "DST"
  };

  newPrices.push(dstEntry);

  // Sort to maintain correct order
  return newPrices.sort((a, b) => a.date - b.date);
}


// Creates two arrays, one for today's prices and one for tomorrow's prices
// The prices are paired with the correct time slots (hours)
const pairPricesWithDate = (data) => {
  let todaysPrices = [];
  let tomorrowsPrices = [];

  //const shift = isDaylightSavingTimeHelsinki() ? 3 : 2;
  const shift = 3;


  // Get the start of today's date at 00:00 in Helsinki time
  const startOfToday = moment.tz(timeZone).startOf("day").add(shift, "hours");
  console.log("start of today", startOfToday);

  // Get the start of tomorrow's date at 00:00 in Helsinki time
  const startOfTomorrow = moment
    .tz(timeZone)
    .startOf("day")
    .add(1, "days")
    .add(shift, "hours");

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
