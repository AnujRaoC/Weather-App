# 🌤️ Weather-App

A full-stack web application for managing and visualizing weather forecasts by location and date. This app allows users to:
- Search weather data by location and date range
- View merged forecast records from MongoDB
- Create, edit, and delete weather records
- Update temperature, humidity, pressure, and wind speed for each forecast
- Built using **React.js**, **Node.js/Express**, and **MongoDB**

---

## 🚀 Features

- 🔍 Search weather records by location and date range
- 🔄 Update individual weather metrics (temperature, humidity, etc.)
- ➕ Add custom forecasts manually
- 🗑️ Delete entire location forecast group
- 📬 Backend uses Express and MongoDB for storage
- 💻 Responsive and clean frontend UI with React

---

## 🛠️ Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Other Tools:** Axios, CORS, JSON2CSV, dotenv

---

## 📁 Project Structure
- weather-app/
  ├── client/ # React frontend
  │ └── src/
  │  └── App.js
  │  └── WeatherCRUDDashboard.js
  ├── server/ # Express backend
  │ └── server.js
  └── README.md

---

## Install Server Dependencies & Start Backend

- cd server
- npm install
- node server.js

- **Server runs on http://localhost:5050**

---

##Install Client Dependencies & Start Frontend

- cd ../client
- npm install
- npm start


- **Client runs on http://localhost:3000**
