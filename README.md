# BusStop Finder

An interactive application for finding bus stops and bus routes in Estonia.  

## Features

**Frontend:**
- Region input field with autocomplete and dropdown list populated from the database.
- Stop input field with autocomplete, limited to the selected region.
- Multiple stops with the same name are distinguished by their unique stop_id (displayed in parentheses).
- Buttons to submit the selected region and stop to the server.
- Display a list of buses stopping at the selected stop (sorted numerically and alphabetically).
- Shows the nearest 5 arrivals for a selected bus at the chosen stop.
- Displays bus direction in the arrivals header.
- Automatically detect and show the nearest stop using geolocation.
- Auto-clear of stop input and previous results when a new region is selected (unless reset was clicked).
- Reset button for all fields and results.
- Designed with Bootstrap 5 for a clean and responsive interface.

**Backend:**
- Handles requests from the frontend (`/stops`, `/stops/:stopName/buses`, `/stops/:stopName/busesWithDirection`, `/stops/nearest`, `/stops/:stopName/arrivals`).
- Fetches data from GTFS files (`stops.txt`, `trips.txt`, `routes.txt`, `stop_times.txt`) imported into MySQL.
- Returns JSON responses.
- Determines nearest stop based on user's geolocation.
- Retrieves all buses stopping at a selected stop, including different directions if applicable.
- Correctly handles arrival times that are past midnight (>24:00) and displays them properly.

## Technologies
- Node.js + Express
- TypeScript
- MySQL (can be swapped with PostgreSQL)
- HTML, CSS, JavaScript
- Bootstrap 5

## Installation and Usage
1. Clone the repository:
   ```bash
   git clone https://github.com/oKhodus/bus-stop.git
   cd bus-stop

  Install dependencies:
    ```bash
    npm install

Set up your MySQL database and import GTFS data (stops.txt, trips.txt, routes.txt, stop_times.txt).

Create a .env file with database credentials:

DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

Start the server:
    ```bash
      npm start

    Open your browser at http://localhost:3000.

Project Structure

/backend      - Backend server, GTFS import scripts
/frontend     - HTML, CSS, JS for the interface

Notes

    Bus and stop data is sourced from official GTFS files.

    Autocomplete works for both regions and stops.

    Multiple stops with the same name are uniquely identified via stop_id.

    Search results can be filtered by region and stop.

    Arrival times for buses correctly handle schedules crossing midnight.

    Directions are displayed to differentiate buses going in opposite directions on the same route.

Future Improvements

    Add live update of arrivals without page refresh.

    Support for multiple cities with full regional filtering.

    Map view for stops and routes.