import { useState, useEffect } from "react";
import ClockFace from "./components/clockFace";
import WeatherWidget from "./components/weatherWidget";
import { fetchData } from "./utils/api";

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        const dataToSet = await fetchData(); // Fetch data from server
        setData(dataToSet);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // Set loading to false whether successful or not
      }
    };

    fetchAndSetData();
  }, []);

  console.log(data);

  return (
    <div className="container">
      <div className="header">
        {loading ? (
          <div>Loading...</div> // Need to make spinning loading thing later
        ) : (
          <>
            <WeatherWidget data={data} />
            <div className="header-item mid">
              <h1 className="title">Sähkö tänään</h1>
            </div>
            <div className="header-item right"> </div>
          </>
        )}
      </div>
      {!loading && <ClockFace data={data} />}{" "}
      {/* Render when data is avalaible */}
      <div className="footer">© Markus Lemiläinen 2024</div>
    </div>
  );
};

export default App;
