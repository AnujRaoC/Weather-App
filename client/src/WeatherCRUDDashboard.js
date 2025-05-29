import React, { useState } from 'react';
import axios from 'axios';

function WeatherCRUDDashboard() {
  const [records, setRecords] = useState([]);
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const [customLocation, setCustomLocation] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [customTemp, setCustomTemp] = useState('');
  const [customHumidity, setCustomHumidity] = useState('');
  const [customPressure, setCustomPressure] = useState('');
  const [customWindSpeed, setCustomWindSpeed] = useState('');
  const [editStates, setEditStates] = useState({});


  const fetchByCriteria = async () => {
    if (!startDate || !endDate || !location) {
      setMessage("Please enter location, start date, and end date.");
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5050/weather`);

      const filtered = res.data.filter((rec) => {
        const recStart = new Date(rec.startDate);
        const recEnd = new Date(rec.endDate);
        const inputStart = new Date(startDate);
        const inputEnd = new Date(endDate);

        return (
          rec.location.toLowerCase().includes(location.toLowerCase()) &&
          recStart <= inputEnd && recEnd >= inputStart
        );
      });

      const mergedMap = new Map();

      for (const rec of filtered) {
        const key = `${rec.location.toLowerCase()}`;

        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            ...rec,
            ids: [rec._id],
            data: {
              list: [...rec.data.list],
            },
          });
        } else {
          const existing = mergedMap.get(key);
          existing.ids.push(rec._id);
          existing.data.list.push(...rec.data.list);
        }
      }

      const mergedRecords = Array.from(mergedMap.values());

      const inputStart = new Date(startDate);
      const inputEnd = new Date(endDate);
      inputEnd.setHours(23, 59, 59, 999);

      mergedRecords.forEach((rec) => {
        const seenTimestamps = new Set();
        rec.data.list = rec.data.list
          .filter(entry => {
            const entryDate = new Date(entry.dt_txt);
            return entryDate >= inputStart && entryDate <= inputEnd;
          })
          .filter(entry => {
            const isNew = !seenTimestamps.has(entry.dt_txt);
            seenTimestamps.add(entry.dt_txt);
            return isNew;
          })
          .sort((a, b) => new Date(a.dt_txt) - new Date(b.dt_txt));
      });

      setRecords(mergedRecords);
      setMessage(`${mergedRecords.length} merged record(s) found.`);
    } catch (err) {
      setMessage("Failed to fetch records.");
    }
  };

  const updateField = async (recordId, timestamp, field, value) => {
    try {
      await axios.put(`http://localhost:5050/weather/${recordId}/update`, {
        timestamp,
        newTemp: parseFloat(value),
        updateField: field
      });
      setMessage("Record updated successfully.");
      fetchByCriteria();
    } catch (err) {
      if (err.response && err.response.data.message) {
        setMessage(`Error: ${err.response.data.message}`);
      } else {
        setMessage("Failed to update record.");
      }
    }
  };

  const deleteRecordGroup = async (ids) => {
    try {
      await Promise.all(ids.map(id => axios.delete(`http://localhost:5050/weather/${id}`)));
      setMessage("Record(s) deleted successfully.");
      setRecords(records.filter(r => !ids.includes(r._id)));
    } catch (err) {
      setMessage("Failed to delete records.");
    }
  };

  const createCustomRecord = async () => {
    if (!customLocation || !customTime || !customTemp) {
      setMessage("Enter location, time and temp to create record.");
      return;
    }
  
    try {
      await axios.post("http://localhost:5050/weather/custom", {
        location: customLocation,
        dt_txt: customTime,
        temp: parseFloat(customTemp),
        humidity: parseFloat(customHumidity),
        pressure: parseFloat(customPressure),
        windSpeed: parseFloat(customWindSpeed),
      });
  
      setMessage("Record created.");
      setCustomLocation('');
      setCustomTime('');
      setCustomTemp('');
      setCustomHumidity('');
      setCustomPressure('');
      setCustomWindSpeed('');
      fetchByCriteria(); // Optional: to refresh the data immediately
    } catch (err) {
      setMessage("Failed to create record.");
    }
  };
  const handleEditChange = (key, field, value) => {
    setEditStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      }
    }));
  };

  

  return (
    <div style={{ padding: '20px', marginTop: '40px' }}>
      <h2>🔍 Weather Record Search</h2>

      <div style={{ marginBottom: '10px' }}>
        <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
        <button onClick={fetchByCriteria}>Search</button>
      </div>

      <h3>➕ Create Custom Forecast</h3>
      <div>
      <input
        type="text"
        placeholder="Location"
        value={customLocation}
        onChange={(e) => setCustomLocation(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <input
        type="datetime-local"
        value={customTime}
        onChange={(e) => setCustomTime(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <input
        type="number"
        placeholder="Temp °C"
        value={customTemp}
        onChange={(e) => setCustomTemp(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <input
        type="number"
        placeholder="Humidity %"
        value={customHumidity}
        onChange={(e) => setCustomHumidity(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <input
        type="number"
        placeholder="Pressure hPa"
        value={customPressure}
        onChange={(e) => setCustomPressure(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <input
        type="number"
        placeholder="Wind Speed m/s"
        value={customWindSpeed}
        onChange={(e) => setCustomWindSpeed(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />

        <button onClick={createCustomRecord}>Add Forecast</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}

      {records.map((rec, idx) => (
        <div key={idx} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', background: '#f9f9f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4>{rec.location}</h4>
            <button onClick={() => deleteRecordGroup(rec.ids)}>🗑 Delete</button>
          </div>
          {rec.data.list.map((entry, i) => {
            const key = `${rec._id}-${entry.dt_txt}`;
            const temp = editStates[key]?.temp ?? entry.main.temp;
            const humidity = editStates[key]?.humidity ?? entry.main.humidity;
            const pressure = editStates[key]?.pressure ?? entry.main.pressure;
            const windSpeed = editStates[key]?.windSpeed ?? entry.wind.speed;

            return (
              <div key={i} style={{ marginBottom: '10px', background: '#eef', padding: '10px' }}>
                <strong>{entry.dt_txt}</strong><br />
                Temp: <input type="number" value={temp} onChange={(e) => handleEditChange(key, 'temp', e.target.value)} style={{ margin: '5px' }} /> °C |
                Humidity: <input type="number" value={humidity} onChange={(e) => handleEditChange(key, 'humidity', e.target.value)} style={{ margin: '5px' }} /> % |
                Pressure: <input type="number" value={pressure} onChange={(e) => handleEditChange(key, 'pressure', e.target.value)} style={{ margin: '5px' }} /> hPa |
                Wind: <input type="number" value={windSpeed} onChange={(e) => handleEditChange(key, 'windSpeed', e.target.value)} style={{ margin: '5px' }} /> m/s
                <button
                  onClick={() => {
                    updateField(rec._id, entry.dt_txt, 'temp', temp);
                    updateField(rec._id, entry.dt_txt, 'humidity', humidity);
                    updateField(rec._id, entry.dt_txt, 'pressure', pressure);
                    updateField(rec._id, entry.dt_txt, 'windSpeed', windSpeed);
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  🔄 Update
                </button>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '8px' }}>
        <h3>👨‍💻 About / Find Me</h3>
        <p><strong>Anuj Rao Celvaji</strong></p>
        <p>As a passionate and dedicated software developer, I am committed to delivering high-impact solutions that push the boundaries of innovation. My career has been defined by a relentless pursuit of excellence, continuous learning, and a proactive approach to mastering emerging technologies to drive meaningful outcomes.</p>
        <p>📍 Based in Tallahassee, FL</p>
        <p>📧 Reach me at: <a href="mailto:salvajianuj22@gmail.com">salvajianuj22@gmail.com</a></p>
        <p>🔗 GitHub: <a href="https://github.com/AnujRaoC" target="_blank" rel="noopener noreferrer">github.com/anujrao</a></p>
        <p>🔗 LinkedIn: <a href="https://www.linkedin.com/in/anuj-rao-celvaji" target="_blank" rel="noopener noreferrer">linkedin.com/in/anujrao</a></p>
        <p><strong>PM Accelerator</strong></p>
        <p>The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.</p>
        <p>Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.</p>
      </div>

    </div>
  );
}

export default WeatherCRUDDashboard;
