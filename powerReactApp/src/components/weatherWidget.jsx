import { useState, useEffect } from "react";

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
      {error && error.code !== 1 && <p>Ei säätietoja</p>}
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

export default WeatherWidget;
