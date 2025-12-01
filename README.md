# BusStop Finder

An interactive application for finding bus stops and bus routes.  

## Features

**Frontend:**
- Region input field with autocomplete and dropdown list populated from the database.
- Stop input field with autocomplete, limited to the selected region.
- Buttons to submit the selected region and stop to the server.
- Display a list of buses stopping at the selected stop (sorted by route number).
- Automatically detect and show the nearest stop using geolocation.
- Reset button for all fields and automatic clearing of stop input when the region changes.
- Designed with Bootstrap 5 for a clean and responsive interface.

**Backend:**
- Handles requests from the frontend (`/stops`, `/stops/:stopName/buses`, `/stops/nearest`).
- Fetches data from GTFS files (stops, trips, routes, stop_times) -> imported to MySQL database
- Returns JSON responses.
- Determines the nearest stop and retrieves bus routes for the selected stop.

## Technologies
- Node.js + Express
- TypeScript
- PostgreSQL / MySQL (configurable)
- HTML, CSS, JavaScript
- Bootstrap 5

## Installation and Usage
1. Clone the repository:
   ```bash
   git clone <repo_url>
   cd bus-stop
  Install dependencies:
   npm install

  Create a .env file with your database credentials (example in backend/.env).
   npm run start / npm start

  Go to the - http://localhost:3000

## Project Structure
/backend      - backend server and GTFS import scripts
/frontend     - HTML, CSS, JS for the interface

# Notes

## Bus and stop data is sourced from GTFS files.

## Autocomplete works for both regions and stops.

## Search results can be filtered by region and stop.
