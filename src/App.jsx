import { useState, useEffect } from "react";
import ClockFace from "./components/clockFace";
import { parseXMLtoObject } from "./utils/dataParser";

const App = () => {
  const [data, setData] = useState([]);
  const [dates, setDates] = useState([]);

  const proxyUrl = "https://cors-anywhere.herokuapp.com/";
  const apiKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    console.log("Data in App:", data); //
  }, [data]);

  // First useEffect that sets dates
  useEffect(() => {
    const formattedDates = formatDatesForApi();
    setDates(formattedDates);
  }, []);

  // Second useEffect that depends on dates
  useEffect(() => {
    if (dates.length === 2) {
      fetchData();
    }
  }, [dates]);

  // Format the dates  to fit the API
  const formatDatesForApi = () => {
    const dateNow = new Date();
    const startOfDay = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 1,
      0,
      0,
      0,
      0
    );
    const startDate = formatTime(startOfDay);
    const twelveHoursLater = new Date(dateNow.getTime() + 1 * 60 * 60 * 1000);
    const hour12Ahead = formatTime(twelveHoursLater);

    console.log("startDate", startDate); //
    console.log("hour12Ahead", hour12Ahead); //
    return [startDate, hour12Ahead];
  };

  // Format the date to fit the API
  const formatTime = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 because it's indexed from 0
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = "00";
    return `${year}${month}${day}${hours}${minutes}`;
  };

  const getUrl = () => {
    const baseUrl = `https://web-api.tp.entsoe.eu/api?documentType=A44&out_Domain=10YFI-1--------U&in_Domain=10YFI-1--------U&periodStart=${dates[0]}&periodEnd=${dates[1]}&securityToken=`;
    return proxyUrl + baseUrl + apiKey;
  };

  const fetchData = () => {
    const url = getUrl();
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const result = parseXMLtoObject(text);
        setData(result);
      });
  };

  return (
    <div className="container">
      <h1>Power React App</h1>
      <ClockFace data={data} />
      <a href="https://cors-anywhere.herokuapp.com/">CORS link</a>
      <div className="prices">
        {data.map((pair, index) => (
          <div key={index}>
            <p>
              {pair.date.toLocaleString()} - {pair.price}¢
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
