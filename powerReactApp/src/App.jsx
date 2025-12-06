import { useState, useEffect } from 'react';
import ClockFace from './components/clockFace';
//import WeatherWidget from "./components/weatherWidget";
import { fetchData } from './utils/api';

// Main component
// Fetches data from server and passes it to child components
// Child components are ClockFace and WeatherWidget
// ClockFace visualizes the data on a clock face
// WeatherWidget displays the current weather
const App = () => {
  const [dataToDisplay, setDataToDisplay] = useState([]);
  const [todaysPrices, setTodaysPrices] = useState([]);
  const [tomorrowsPrices, setTomorrowsPrices] = useState([]);
  const [showTomorrow, setShowTomorrow] = useState(false);
  const [dayButtonDisabled, setDayButtonDisabled] = useState(true);

  const [dates, setDates] = useState([]);

  useEffect(() => {
    const todaysDate = new Date().toLocaleString('fi-FI', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const tomorrowsDate = new Date(
      new Date().getTime() + 24 * 60 * 60 * 1000
    ).toLocaleString('fi-FI', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    setDates([todaysDate, tomorrowsDate]);
  }, []);

  useEffect(() => {
    const fetchAndSetData = async () => {
      const data = await fetchData();
      const todaysData = data.todaysPrices;

      setTodaysPrices(todaysData);

      if (data.tomorrowsPrices.length > 6) {
        const tomorrowsData = data.tomorrowsPrices;
        setTomorrowsPrices(tomorrowsData);
      }

      setDataToDisplay(todaysData);
    };

    fetchAndSetData();
  }, []);

  useEffect(() => {
    if (tomorrowsPrices.length > 1) {
      setDayButtonDisabled(false);
    } else {
      setDayButtonDisabled(true);
    }
  }, [tomorrowsPrices]);

  useEffect(() => {
    if (showTomorrow) {
      setDataToDisplay(tomorrowsPrices);
    } else {
      setDataToDisplay(todaysPrices);
    }
  }, [showTomorrow, todaysPrices, tomorrowsPrices]);

  return (
    <div className="container">
      <div className="header">
        <div className="header-item left">
          {' '}
          {/* <WeatherWidget data={dataToDisplay} /> */}
        </div>

        <div className="header-item mid">
          <div className="daySelector">
            <h1 className="title">
              {showTomorrow ? 'Sähkö huomenna' : 'Sähkö tänään'}
            </h1>
          </div>
        </div>

        <div className="header-item right">
          <button
            className="dayToggle"
            id="dayToggle"
            disabled={dayButtonDisabled}
            onClick={() => setShowTomorrow(!showTomorrow)}
          >
            {showTomorrow ? 'Hinta tänään' : 'Huomisen hinnat'}
          </button>
          <p className="buttonInfo">Huomisen hinnat päivittyvät noin klo 14</p>
        </div>
      </div>

      <div className="content">
        <div className="dateInfo">
          <p>{dates[showTomorrow ? 1 : 0]}</p>
        </div>
        <ClockFace
          data={dataToDisplay}
          dates={dates}
          showTomorrow={showTomorrow}
        />
      </div>
      <div className="footer">© Markus Lemiläinen 2024</div>
    </div>
  );
};

export default App;
