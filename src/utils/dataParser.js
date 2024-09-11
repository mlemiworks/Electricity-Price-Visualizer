const parseXMLtoObject = (text) => {
  // Parse the XML
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

  // Multiply each value by 1.24
  for (let i = 0; i < points.length; i++) {
    const price = parseFloat(
      points[i].getElementsByTagName("price.amount")[0].textContent
    );
    const priceWithTax = parseFloat(((price * 1.255) / 10).toFixed(2));
    result.prices.push(priceWithTax);
  }

  const finalData = pairPricesWithDate(result);

  console.log(finalData);

  return finalData;
};

const pairPricesWithDate = (data) => {
  const baseDate = new Date(data.date);

  // Get the start of today's date at 00:00
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0); // Set time to 00:00

  const pairedData = data.prices
    .map((price, index) => {
      const date = new Date(baseDate.getTime() + index * 60 * 60 * 1000);
      return { date, price };
    })
    .filter((pair) => pair.date >= startOfToday);

  console.log("pairedData", pairedData);
  return pairedData;
};

export { parseXMLtoObject };
