let nearestStop = null;
let datalistStops, datalistRegions, stopSelect, regionSelect;
let allRegionsData = [];

document.addEventListener("DOMContentLoaded", async () => {
    regionSelect = document.getElementById("regionSelect");
    stopSelect = document.getElementById("stopSelect");
    datalistRegions = document.getElementById("regionsListData");
    datalistStops = document.getElementById("stopsDatalist");
    stopSelect.setAttribute("list", "stopsDatalist");

    await loadRegions();

    regionSelect.addEventListener("change", async () => {
        stopSelect.value = "";
        await loadStopsForRegion(regionSelect.value);
    });

    document.getElementById("showCities").addEventListener("click", () => {
        renderRegions(allRegionsData.filter(r => r.type === "city"));
    });
    document.getElementById("showOthers").addEventListener("click", () => {
        renderRegions(allRegionsData.filter(r => r.type === "other"));
    });
    document.getElementById("showAll").addEventListener("click", () => {
        renderRegions(allRegionsData);
    });

    document.getElementById("findBuses").addEventListener("click", async () => {
        const region = regionSelect.value;
        const stopName = stopSelect.value.trim();
        if (!region || !stopName) return alert("Select region and stop");
        await showBuses(region, stopName);
    });

    document.getElementById("findNearest").addEventListener("click", async () => {
        await findNearestStopAutomatically();
    });

    document.getElementById("reset").addEventListener("click", () => {
        document.getElementById("results").innerHTML = "";
        regionSelect.value = "";
        stopSelect.value = "";
        datalistStops.innerHTML = "";
        nearestStop = null;
    });

    await findNearestStopAutomatically();
});

// ===================== HELPERS =====================

async function loadRegions() {
    try {
        const [citiesRes, othersRes] = await Promise.all([
            fetch("/stops/regions/cities"),
            fetch("/stops/regions/others")
        ]);
        const cities = await citiesRes.json();
        const others = await othersRes.json();

        allRegionsData = [
            { name: "Tallinn linn", type: "city" },
            ...cities.map(r => ({ name: r.stop_area, type: "city" })),
            ...others.map(r => ({ name: r.stop_area, type: "other" }))
        ];
        renderRegions(allRegionsData);
    } catch (err) {
        console.error(err);
    }
}

function renderRegions(regions) {
    datalistRegions.innerHTML = regions.map(r => `<option value="${r.name}" data-type="${r.type}">`).join("");
}

async function loadStopsForRegion(region) {
    if (!region) return;
    try {
        let stops = [];
        if (region === "Tallinn linn") {
            const res = await fetch(`/stops?q=Tallinn`);
            stops = await res.json();
        } else {
            const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
            stops = await res.json();
        }

        const uniqueStops = [...new Set(stops.map(s => s.stop_name).filter(Boolean))];
        datalistStops.innerHTML = "";
        uniqueStops.forEach(s => {
            const option = document.createElement("option");
            option.value = s;
            datalistStops.appendChild(option);
        });
    } catch (err) {
        console.error(err);
    }
}

async function findNearestStopAutomatically() {
    const resultsDiv = document.getElementById("results");
    if (!navigator.geolocation) return;
    resultsDiv.innerHTML = `<div class="list-group-item">Finding nearest stop...</div>`;

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try {
            const res = await fetch(`/stops/nearest?lat=${coords.latitude}&lon=${coords.longitude}`);
            const stop = await res.json();
            nearestStop = stop;

            regionSelect.value = stop.stop_area;
            await loadStopsForRegion(stop.stop_area);
            stopSelect.value = stop.stop_name;

            await showBuses(stop.stop_area, stop.stop_name);
        } catch (err) {
            console.error(err);
        }
    });
}

async function showBuses(region, stopName) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<div class="list-group-item">Loading buses...</div>`;

    try {
        const res = await fetch(`/stops/${encodeURIComponent(stopName)}/buses`);
        const buses = await res.json();

        buses.sort((a, b) => {
            const na = parseInt(a) || 0;
            const nb = parseInt(b) || 0;
            return na !== nb ? na - nb : a.localeCompare(b);
        });

        let html = `<div class="list-group-item mb-3"><strong>Stop:</strong> ${stopName}<br><strong>Area:</strong> ${region}</div><div class="d-flex flex-wrap gap-2">`;
        buses.forEach(bus => html += `<button class="btn btn-outline-primary bus-btn" data-bus="${bus}">${bus}</button>`);
        html += `</div>`;
        resultsDiv.innerHTML = html;

        document.querySelectorAll(".bus-btn").forEach(btn => {
            btn.addEventListener("click", () => showArrivals(btn.dataset.bus, stopName));
        });
    } catch (err) { console.error(err); }
}

async function showArrivals(busNumber, stopName) {
    const resultsDiv = document.getElementById("results");
    const current = resultsDiv.innerHTML;
    try {
        const res = await fetch(`/arrivals/${busNumber}/${encodeURIComponent(stopName)}?limit=10`);
        const arrivals = await res.json();

        let html = `<div class="list-group-item mt-3"><strong>Arrivals:</strong></div>`;
        arrivals.forEach(a => html += `<div class="list-group-item">${a.arrival_time}</div>`);
        resultsDiv.innerHTML = current + html;
    } catch (err) { console.error(err); }
}