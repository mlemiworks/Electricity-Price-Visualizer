import { useState, useEffect } from "react";
import ClockFace from "./components/clockFace";
import WeatherWidget from "./components/weatherWidget";
import { fetchData } from "./utils/api";

// Main component
// Fetches data from server and passes it to child components
// Child components are ClockFace and WeatherWidget
// ClockFace visualizes the data on a clock face
// WeatherWidget displays the current weather
const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAndSetData = async () => {
      const dataToSet = await fetchData(); // Fetch data from server
      setData(dataToSet);
    };

    fetchAndSetData();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div className="header-item left">
          {" "}
          <WeatherWidget data={data} />
        </div>
        <div className="header-item mid">
          <h1 className="title">Sähkö tänään</h1>
        </div>
        <div className="header-item right"></div>
      </div>
      <ClockFace data={data} />
      <div className="footer">© Markus Lemiläinen 2024</div>
    </div>
  );
};

export default App;
