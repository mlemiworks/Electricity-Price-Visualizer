import { useState, useEffect } from "react";
import ClockFace from "./components/clockFace";
import { parseXMLtoObject } from "./utils/dataParser";

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [weatherIcon, setWeatherIcon] = useState(null);

  useEffect(() => {
    const getWeather = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

            try {
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error("Weather data fetch failed");
              }
              const data = await response.json();
              setWeatherData(data);
            } catch (err) {
              setError(err.message);
            }
          },
          (err) => {
            setError(err.message);
          }
        );
      } else {
        setError("Geolocation is not supported by this browser.");
      }
    };

    getWeather();
  }, []);

  useEffect(() => {
    if (weatherData && weatherData.weather && weatherData.weather.length > 0) {
      const icon = weatherData.weather[0].icon;
      setWeatherIcon(`https://openweathermap.org/img/wn/${icon}@2x.png`);
    }
  }, [weatherData]);

  return (
    <div className="header-item left">
      {error && error.code !== 1 && <p>Error: {error.message}</p>}
      {/* Error code 1 is usually PERMISSION_DENIED */}
      {!error && !weatherData && <p>Ladataan säätietoja...</p>}
      {weatherData && (
        <div>
          <div className="weatherContent">
            <p className="weatherArea">{weatherData.name}</p>
            <p className="weatherTemp">{weatherData.main.temp}°C</p>
            <img className="weatherIcon" src={weatherIcon} alt="Weather Icon" />
          </div>
        </div>
      )}
    </div>
  );
};

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
      <div className="header">
        <WeatherWidget />
        <div className="header-item mid">
          <h1>Sähkö tänään</h1>
        </div>
        <div className="header-item right"> </div>
      </div>
      <ClockFace data={data} />

      <div className="footer">© Markus Lemiläinen 2024</div>
      {/* <div className="prices">
        {data.map((pair, index) => (
          <div key={index}>
            <p>
              {pair.date.toLocaleString()} - {pair.price}¢
            </p>
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default App;
