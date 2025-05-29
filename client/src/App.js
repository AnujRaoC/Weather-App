// File: App.js
import React, { useState } from 'react';
import WeatherCRUDDashboard from './WeatherCRUDDashboard';
import axios from 'axios';
import './App.css';

function App() {
  const [showForecast, setShowForecast] = useState(false);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [videos, setVideos] = useState([]);

  const fetchWeather = async () => {
    try {
      const response = await axios.post('http://localhost:5050/weather', {
        location,
      });
      setWeather(response.data);
      fetchYouTube(location);
      setError(null);
    } catch (err) {
      setError('Could not fetch weather data');
      setWeather(null);
    }
  };

  const fetchYouTube = async (location) => {
    try {
      const res = await axios.get(`http://localhost:5050/youtube?location=${location}`);
      setVideos(res.data.videos);
    } catch (err) {
      console.error("YouTube error", err);
    }
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location ) {
      setError('Please fill all fields');
      return;
    }
    fetchWeather();
  };

  return (
    <div className="App">
      <h1>🌤️ Weather App</h1>
      <form onSubmit={handleSubmit}>
        <input
        type="text"
        placeholder="Enter location (ZIP, city, coordinates)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit">🌤️Get Weather</button>
        <br />
        <button type="button" onClick={() => window.open('http://localhost:5050/export/json')}>Export JSON</button>
        <button type="button" onClick={() => window.open('http://localhost:5050/export/csv')}>Export CSV</button>
        <button type="button" onClick={() => window.open('http://localhost:5050/export/pdf')}>Export PDF</button>
      </form>

      {error && <p className="error">{error}</p>}

      {weather && (
        <div className="weather-result">
          <h2>Weather in {weather.location}</h2>

          {/* Today’s Weather */}
          <div className="forecast-card today">
            <h3>Today</h3>
            <p>{weather.data.list[0].dt_txt}</p>
            <p>{weather.data.list[0].weather[0].description}</p>
            <p>🌡 Temp: {weather.data.list[0].main.temp}°C</p>
            <p>💨 Wind: {weather.data.list[0].wind.speed} m/s</p>
            <p>💧 Humidity: {weather.data.list[0].main.humidity}%</p>
            <p>📊 Pressure: {weather.data.list[0].main.pressure} hPa</p>
            <img src={`http://openweathermap.org/img/wn/${weather.data.list[0].weather[0].icon}.png`} alt="weather-icon"/>
          </div>
          <br/>

          <button onClick={() => setShowForecast(!showForecast)}>
            {showForecast ? "Hide 5-Day Forecast" : "Show 5-Day Forecast"}
          </button>

          {/* 5-Day Forecast Grid */}
          {showForecast && (
            <div className="forecast-grid">
              {weather.data.list
                .filter((_, index) => index % 8 === 0) // Every 24 hours
                .map((entry, index) => (
                  <div key={index} className="forecast-card">
                    <h4>{entry.dt_txt.split(" ")[0]}</h4>
                    <p>{entry.weather[0].description}</p>
                    <p>🌡 {entry.main.temp}°C</p>
                    <p>📊 {entry.main.pressure} hPa</p>
                    <p>💧 {entry.main.humidity}%</p>
                    <p>💨 {entry.wind.speed} m/s</p>
                    <img src={`http://openweathermap.org/img/wn/${entry.weather[0].icon}.png`}alt="icon"/>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}


      {videos.length > 0 && (
        <div className="video-section">
          <h3>🎥 Travel videos from {location}</h3>
          {videos.map((video, i) => (
            <div key={i}>
              <a href={`https://www.youtube.com/watch?v=${video.id.videoId}`} target="_blank" rel="noreferrer">
                {video.snippet.title}
              </a>
            </div>
          ))}
        </div>
      )}
      <hr />
      <WeatherCRUDDashboard />
    </div>
  );
}


export default App;
