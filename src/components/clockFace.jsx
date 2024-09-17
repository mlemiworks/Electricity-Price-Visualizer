import { useEffect, useState } from "react";

// const colorScale = [
//   "rgba(34, 139, 34, 1)", // Forest Green
//   "rgba(85, 170, 85, 0.9)", // Medium Sea Green
//   "rgba(124, 205, 124, 0.9)", // Light Green
//   "rgba(169, 235, 169, 0.9)", // Pale Green
//   "rgba(211, 243, 158, 0.9)", // Light Goldenrod
//   "rgba(245, 245, 122, 0.9)", // Khaki
//   "rgba(255, 235, 59, 0.9)", // Mustard Yellow
//   "rgba(255, 193, 59, 0.9)", // Goldenrod
//   "rgba(255, 143, 59, 0.9)", // Dark Orange
//   "rgba(255, 94, 59, 0.9)", // Tomato
//   "rgba(255, 59, 48, 0.9)", // Red Orange
//   "rgba(220, 20, 60, 0.9)", // Crimson
// ];

const colorScale = [
  "rgba(40, 167, 69, 1)", // Bright Green
  "rgba(133, 224, 133, 0.9)", // Lime Green
  "rgba(195, 230, 203, 0.9)", // Light Green
  "rgba(255, 235, 153, 0.9)", // Pale Yellow
  "rgba(240, 230, 140, 0.9)", // Beige
  "rgba(211, 211, 211, 0.9)", // Light Gray
  "rgba(244, 204, 204, 0.9)", // Light Pink
  "rgba(255, 179, 71, 0.9)", // Orange
  "rgba(255, 193, 7, 0.9)", // Amber
  "rgba(255, 112, 67, 0.9)", // Coral Red
  "rgba(220, 53, 69, 0.9)", // Red
  "rgba(169, 50, 38, 0.9)", // Dark Red
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

      if (indexCounter !== 0) {
        // Twelve numbers around the clock
        for (let i = 13; i <= 24; i++) {
          const angle = i * 30 - 90; // 30 degrees between each number, -90 to start from top
          const angleInRadians = angle * (Math.PI / 180);

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
      } else {
        // Twelve numbers around the clock
        for (let i = 1; i <= 12; i++) {
          const angle = i * 30 - 90; // 30 degrees between each number, -90 to start from top
          const angleInRadians = angle * (Math.PI / 180);

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
      }

      indexCounter++;
    });
  };

  return (
    <div className="clockContainer">
      <div className="clockBox-1">
        <div className="clockDigits"></div>
        <div className="clock">
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="sector"
              style={{
                backgroundColor: coloredAmPrices[index]?.color || "transparent",
              }}
            >
              <div className="price-wrapper">
                <div
                  className="sector-price"
                  style={{ transform: `rotate(${-index * 30}deg)` }}
                >
                  {coloredAmPrices[index]?.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="clockBox-2">
        <div className="clockDigits"></div>
        <div className="clock">
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="sector"
              style={{
                backgroundColor: coloredPmPrices[index]?.color || "transparent",
              }}
            >
              <div className="price-wrapper">
                <div
                  className="sector-price"
                  style={{ transform: `rotate(${-index * 30}deg)` }}
                >
                  {coloredPmPrices[index]?.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClockFace;
