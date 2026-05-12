# MapToGPX

A premium, lightweight tool to convert Google Maps directions URLs into high-quality GPX tracks instantly. **No Google API key required.**

![MapToGPX UI](https://img.shields.io/badge/UI-Premium-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **No API Key Needed**: Uses OSRM (OpenStreetMap) for routing, making it completely free and private.
- **Short URL Support**: Automatically resolves `maps.app.goo.gl` share links.
- **Robust Parsing**: Extracts coordinates directly from Google Maps URLs (path, data parameters, and viewport).
- **Premium UI**: Sleek, modern dark-themed interface with smooth animations.
- **Instant Download**: Converts and serves `.gpx` files directly to your browser.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Yarn](https://yarnpkg.com/) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/maptogpx.git
   cd maptogpx
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the server:
   ```bash
   yarn start
   ```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📖 How to Use

1.  Open **Google Maps** and plan a route (Directions).
2.  Copy the URL from the browser address bar, or use the **Share** button to copy a short link.
3.  Paste the link into **MapToGPX**.
4.  Click **Convert & Download**.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Axios
- **Routing**: [OSRM API](http://project-osrm.org/) (Open Source Routing Machine)
- **XML Generation**: [xmlbuilder2](https://github.com/oozcitak/xmlbuilder2)
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), JavaScript

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
