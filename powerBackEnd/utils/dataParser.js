const { DOMParser } = require("xmldom"); // Importing DOMParser from xmldom
const moment = require("moment-timezone"); // Importing moment-timezone

//Timezone has to be set to Helsinki, because the prices are in Helsinki timezone.

// Timezone for Helsinki
const timeZone = "Europe/Helsinki";

// Function to parse XML to Object
const parseXMLtoObject = (text) => {
  // Parse the XML using xmldom
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  // Extract the start date
  const startDate = xmlDoc.getElementsByTagName("start")[0].textContent;

  // Extract the points
  const points = xmlDoc.getElementsByTagName("Point");

  // Create the result object
  const result = {
    date: startDate,
    prices: [],
  };

  let expectedPosition = 1; // Start with the first position (hour 1)

  for (let i = 0; i < points.length; i++) {
    const price = parseFloat(
      points[i].getElementsByTagName("price.amount")[0].textContent
    );
    const position = parseInt(
      points[i].getElementsByTagName("position")[0].textContent
    );

    // Fill in missing positions
    if (position !== expectedPosition) {
      while (expectedPosition !== position) {
        result.prices.push(0); // Fill gap with "0", temporary solution
        expectedPosition++;
        if (expectedPosition > 24) {
          expectedPosition = 1; // Reset after 24 hours
        }
      }
    }

    // Add the price with VAT
    const priceWithTax = parseFloat(((price * 1.255) / 10).toFixed(2));
    result.prices.push(priceWithTax);

    // Move to the next expected position
    expectedPosition++;
    if (expectedPosition > 24) {
      expectedPosition = 1; // Reset after 24 hours
    }
  }

  // Call function to pair prices with dates
  const finalData = pairPricesWithDate(result);

  return finalData;
};

// Function to pair prices with dates
const pairPricesWithDate = (data) => {
  // Parse the base date in Helsinki timezone
  const baseDate = moment.tz(data.date, timeZone);

  // Get the start of today's date at 00:00 in Helsinki time
  const startOfToday = moment.tz(timeZone).startOf("day");

  // Get the start of tomorrow's date at 00:00 in Helsinki time
  const startOfTomorrow = moment.tz(timeZone).startOf("day").add(1, "days");

  // Pair prices with time slots (hours)
  const pairedData = data.prices.map((price, index) => {
    // Add hours to the base date
    const date = baseDate.clone().add(index, "hours");
    return { date: date.toDate(), price }; // Convert to native Date object
  });

  const todaysPrices = pairedData.filter(
    (item) => item.date >= startOfToday && item.date <= startOfTomorrow
  );
  const tomorrowsPrices = pairedData.filter(
    (item) => item.date >= startOfTomorrow
  );

  return { todaysPrices, tomorrowsPrices };
};

module.exports = {
  parseXMLtoObject,
};
