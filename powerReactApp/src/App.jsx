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
  const [dataToDisplay, setDataToDisplay] = useState([]);
  const [todaysPrices, setTodaysPrices] = useState([]);
  const [tomorrowsPrices, setTomorrowsPrices] = useState([]);
  const [tomorrowToggle, setTomorrowToggle] = useState(false);
  const [dayButtonDisabled, setDayButtonDisabled] = useState(true);

  useEffect(() => {
    const fetchAndSetData = async () => {
      const data = await fetchData();
      console.log("data", data)
      const todaysData = data.todaysPrices
      console.log("todaysdata", todaysData)
      const tomorrowsData = data.tomorrowsPrices
      
      setTodaysPrices(todaysData);
      setTomorrowsPrices(tomorrowsData);
      setDataToDisplay(todaysData);
    };

    fetchAndSetData();
  }, []);

  useEffect(() => {
    if (tomorrowsPrices.length > 1) {
      setDayButtonDisabled(false); }
      else {
        setDayButtonDisabled(true);
    }
  }
  , [tomorrowsPrices]);


  useEffect(() => {
    if (tomorrowToggle) {
      setDataToDisplay(tomorrowsPrices);
    } else {
      setDataToDisplay(todaysPrices);
    }
  }, [tomorrowToggle]);


  return (
    <div className="container">
      <div className="header">
        <div className="header-item left">
          {" "}
          <WeatherWidget data={dataToDisplay} />
        </div>
        <div className="header-item mid">
          <div className="daySelector">
          <h1 className="title">{tomorrowToggle ? "Sähkö" : "Sähkö"}</h1>
          <button className="dayToggle" id="dayToggle" disabled={dayButtonDisabled} onClick={() => setTomorrowToggle(!tomorrowToggle)}>
        {tomorrowToggle ? "huomenna" : "tänään"}
      </button>
          </div>
          
      <p className="buttonInfo">{ dayButtonDisabled ? "Huomisen hinnat päivittyvät noin klo 14" : " "}</p>
        </div>
        
        <div className="header-item right">
        
        </div>
      </div>
      <ClockFace data={dataToDisplay} />
      <div className="footer">© Markus Lemiläinen 2024</div>
    </div>
  );
};

export default App;
