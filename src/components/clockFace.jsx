import { useEffect, useState } from "react";

const colorScale = [
  "rgba(34, 139, 34, 1)", // Forest Green
  "rgba(85, 170, 85, 0.9)", // Medium Sea Green
  "rgba(124, 205, 124, 0.9)", // Light Green
  "rgba(169, 235, 169, 0.9)", // Pale Green
  "rgba(211, 243, 158, 0.9)", // Light Goldenrod
  "rgba(245, 245, 122, 0.9)", // Khaki
  "rgba(255, 235, 59, 0.9)", // Mustard Yellow
  "rgba(255, 193, 59, 0.9)", // Goldenrod
  "rgba(255, 143, 59, 0.9)", // Dark Orange
  "rgba(255, 94, 59, 0.9)", // Tomato
  "rgba(255, 59, 48, 0.9)", // Red Orange
  "rgba(220, 20, 60, 0.9)", // Crimson
];

const ClockFace = ({ data }) => {
  const [sectors, setSectors] = useState([]);
  const [coloredAmPrices, setColoredAmPrices] = useState([]);
  const [coloredPmPrices, setColoredPmPrices] = useState([]);

  const totalSectors = 12;

  useEffect(() => {
    const sectorElements = [];
    for (let i = 0; i < totalSectors; i++) {
      sectorElements.push(<div key={i} className="sector"></div>);
    }
    setSectors(sectorElements);
  }, []);

  useEffect(() => {
    assignColorToPrice();
    generateTimeDigits();
  }, [data]);

  const assignColorToPrice = () => {
    const prices = data.map((hour) => hour.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const coloredPrices = prices.map((price) => ({
      price: price,
      color: getColorForPrice(price, minPrice, maxPrice, colorScale),
    }));

    const amPrices = coloredPrices.slice(0, 12);
    const pmPrices = coloredPrices.slice(12, 24);

    setColoredAmPrices(amPrices);
    setColoredPmPrices(pmPrices);
  };

  // const assignColorToPrice = () => {
  //   const amHours = data.slice(0, 12);
  //   const pmHours = data.slice(12, 24);

  //   const amPrices = amHours.map((hour) => hour.price);
  //   const pmPrices = pmHours.map((hour) => hour.price);

  //   const minAmPrice = Math.min(...amPrices);
  //   const maxAmPrice = Math.max(...amPrices);

  //   const minPmPrice = Math.min(...pmPrices);
  //   const maxPmPrice = Math.max(...pmPrices);

  //   const coloredAmPrices = amPrices.map((price) => ({
  //     price: price,
  //     color: getColorForPrice(price, minAmPrice, maxAmPrice, colorScale),
  //   }));
  //   const coloredPmPrices = pmPrices.map((price) => ({
  //     price: price,
  //     color: getColorForPrice(price, minPmPrice, maxPmPrice, colorScale),
  //   }));

  //   setColoredAmPrices(coloredAmPrices);
  //   setColoredPmPrices(coloredPmPrices);
  // };

  const getColorForPrice = (price, minPrice, maxPrice, colorScale) => {
    const range = maxPrice - minPrice;
    const index = Math.floor(
      ((price - minPrice) / range) * (colorScale.length - 1)
    );
    return colorScale[index];
  };

  const generateTimeDigits = () => {
    const clocks = document.querySelectorAll(".clock");
    const clockDigits = document.querySelectorAll(".clockDigits");

    // counter for the clockDigits, matching the clock index, might be a better way to do this
    let indexCounter = 0;

    clocks.forEach((clock) => {
      const radius = clock.offsetWidth / 2;
      const numberRadius = radius + 13; // Radius of the circle where the numbers will be placed.

      // Twelve numbers around the clock
      for (let i = 1; i <= 12; i++) {
        const angle = i * 30 - 90; // 30 degrees between each number, starting from the top (-90 degrees)
        const angleInRadians = angle * (Math.PI / 180); // Convert to radians

        // Calculate x and y position
        const x = radius + numberRadius * Math.cos(angleInRadians);
        const y = radius + numberRadius * Math.sin(angleInRadians);

        // Create the number element
        const numberElement = document.createElement("div");
        numberElement.className = "number";
        numberElement.style.left = `${x}px`;
        numberElement.style.top = `${y}px`;
        numberElement.textContent = i;

        // Add the number to the clock using the indexCounter
        clockDigits[indexCounter].appendChild(numberElement);
      }
      indexCounter++;
    });
  };

  return (
    <div className="clockContainer">
      <div className="clockBox-1">
        <div className="clockDigits"></div>
        <h2>AM prices (¢/h)</h2>
        <div className="clock">
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="sector"
              style={{
                backgroundColor: coloredAmPrices[index]?.color || "transparent",
              }}
            >
              <div
                className="sector-price"
                style={{ transform: `rotate(${-index * 30}deg)` }}
              >
                {coloredAmPrices[index]?.price}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="clockBox-2">
        <div className="clockDigits"></div>
        <h2>PM prices (¢/h)</h2>
        <div className="clock">
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="sector"
              style={{
                backgroundColor: coloredPmPrices[index]?.color || "transparent",
              }}
            >
              <div
                className="sector-price"
                style={{ transform: `rotate(${-index * 30}deg)` }}
              >
                {coloredPmPrices[index]?.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClockFace;
