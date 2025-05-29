// File: server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const { Parser } = require("json2csv");
const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = 5050;

const allowedOrigins = [
  'http://localhost:3000', 
  'https://weather-app1-qu4wxs299-anujraocs-projects.vercel.app',
  'https://weather-app1-qu4wxs299-anujraocs-projects.vercel.app' 
];
app.use(express.json());

mongoose.connect("mongodb+srv://users:MyAccess123@cluster0.gcyqffo.mongodb.net/?retryWrites=true&w=majority");

const WeatherSchema = new mongoose.Schema({
  location: String,
  data: Object,
});
const Weather = mongoose.model("Weather", WeatherSchema);

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

app.post("/weather", async (req, res) => {
  const { location } = req.body;
  if (!location)
    return res.status(400).json({ message: "Missing fields" });

  let query = '';
  const gpsRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
  const zipRegex = /^\d{5}$/;

  if (gpsRegex.test(location)) {
    const [lat, lon] = location.split(',');
    query = `lat=${lat}&lon=${lon}`;
  } else if (zipRegex.test(location)) {
    query = `zip=${location},us`;
  } else {
    query = `q=${encodeURIComponent(location)}`;
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${API_KEY}&units=metric`
    );

    const weather = new Weather({ location, data: response.data });
    await weather.save();
    res.json(weather);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch weather", error: err.message });
  }
});

// New create endpoint to add custom weather data
app.post("/weather/custom", async (req, res) => {
  const { location, dt_txt, temp, humidity, pressure, windSpeed } = req.body;

  if (!location || !dt_txt || temp == null)
    return res.status(400).send("Missing required fields");

  const data = {
    cod: "200",
    list: [
      {
        dt_txt,
        main: {
          temp,
          humidity: humidity || 0,
          pressure: pressure || 0,
        },
        wind: {
          speed: windSpeed || 0,
        },
        weather: [{ description: "custom", icon: "01d" }],
      },
    ],
  };

  try {
    const rec = new Weather({ location, data });
    await rec.save();
    res.send({ message: "Custom weather record created", rec });
  } catch (err) {
    res.status(500).send("Server error");
  }
});



app.get("/weather", async (req, res) => {
  const records = await Weather.find();
  res.json(records);
});

app.put("/weather/:id/update", async (req, res) => {
  const { timestamp, newTemp, updateField } = req.body;

  const validateValue = (field, value) => {
    switch (field) {
      case 'temp': return value >= -100 && value <= 100;
      case 'humidity': return value >= 0 && value <= 100;
      case 'pressure': return value >= 900 && value <= 1100;
      case 'wind': return value >= 0 && value <= 150;
      default: return false;
    }
  };

  if (!validateValue(updateField, newTemp)) {
    return res.status(400).json({ message: `Invalid value for ${updateField}` });
  }

  try {
    const record = await Weather.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    const entry = record.data.list.find(e => e.dt_txt === timestamp);
    if (!entry) return res.status(404).json({ message: "Timestamp not found" });

    switch (updateField) {
      case 'temp': entry.main.temp = newTemp; break;
      case 'humidity': entry.main.humidity = newTemp; break;
      case 'pressure': entry.main.pressure = newTemp; break;
      case 'wind': entry.wind.speed = newTemp; break;
      default: return res.status(400).json({ message: "Invalid field" });
    }

    await record.save();
    res.json({ message: `${updateField} updated`, record });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

app.delete("/weather/:id", async (req, res) => {
  try {
    const deleted = await Weather.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

app.get("/export/:format", async (req, res) => {
  const { format } = req.params;
  const data = await Weather.find();

  if (format === "json") return res.json(data);

  if (format === "csv") {
    const parser = new Parser();
    const csv = parser.parse(data);
    return res.header("Content-Type", "text/csv").send(csv);
  }
  const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
      </style>
    </head>
    <body>
      <h1>Weather Data</h1>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </body>
    </html>
  `;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: "PDF generation failed", error: err.message });
  }
});

app.get("/youtube", async (req, res) => {
  const { location } = req.query;
  try {
    const youtubeResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        location + " travel"
      )}&key=${YOUTUBE_API_KEY}&maxResults=3&type=video`
    );
    res.json({ videos: youtubeResponse.data.items });
  } catch (err) {
    res.status(500).json({ message: "YouTube fetch failed", error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
