const { DOMParser } = require("xmldom"); // Importing DOMParser from xmldom

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

  // Multiply each value by 1.255 and push it into prices array
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
  const baseDate = new Date(data.date);

  // Get the start of today's date at 00:00
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0); // Set time to 00:00

  // Pair prices with time slots (hours)
  const pairedData = data.prices
    .map((price, index) => {
      const date = new Date(baseDate.getTime() + index * 60 * 60 * 1000); // Add hours
      return { date, price };
    })
    .filter((pair) => pair.date >= startOfToday); // Filter pairs from today onwards

  return pairedData;
};

module.exports = {
  parseXMLtoObject,
};
