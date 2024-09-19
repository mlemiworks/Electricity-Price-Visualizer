const { DOMParser } = require("xmldom"); // Importing DOMParser from xmldom
const moment = require("moment-timezone"); // Importing moment-timezone

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

  // Multiply each value by 1.255, which is the VAT in Finland
  for (let i = 0; i < points.length; i++) {
    const price = parseFloat(
      points[i].getElementsByTagName("price.amount")[0].textContent
    );
    const priceWithTax = parseFloat(((price * 1.255) / 10).toFixed(2));
    result.prices.push(priceWithTax);
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
  console.log(startOfToday);

  // Pair prices with time slots (hours)
  const pairedData = data.prices
    .map((price, index) => {
      // Add hours to the base date
      const date = baseDate.clone().add(index, "hours");
      return { date: date.toDate(), price }; // Convert to native Date object
    })
    .filter((pair) => pair.date >= startOfToday.toDate()); // Filter pairs from today onwards

  return pairedData;
};

module.exports = {
  parseXMLtoObject,
};
