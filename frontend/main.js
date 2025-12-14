let nearestStop = null;
let datalistStops, datalistRegions, stopSelect, regionSelect;
let allRegionsData = [];
let userReset = true;


function parseArrivalTime(t) {
    // t = "25:10:00" → "01:10"
    let [h, m] = t.split(":").map(Number);
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    regionSelect = document.getElementById("regionSelect");
    stopSelect = document.getElementById("stopSelect");
    datalistRegions = document.getElementById("regionsListData");
    datalistStops = document.getElementById("stopsDatalist");
    stopSelect.setAttribute("list", "stopsDatalist");

    await loadRegions();

    regionSelect.addEventListener("change", async () => {
        if (!userReset) {
        resetAll();
    }
        stopSelect.value = "";
        await loadStopsForRegion(regionSelect.value);
        userReset = false;
    });
    stopSelect.addEventListener("input", () => {
    userReset = false;
});

    stopSelect.addEventListener("change", async () => {
        const stopName = stopSelect.value.trim();
        if (stopName) await showBuses(stopName);
    });

    document.getElementById("showCities").addEventListener("click", () =>
        renderRegions(allRegionsData.filter(r => r.type === "city"))
    );
    document.getElementById("showOthers").addEventListener("click", () =>
        renderRegions(allRegionsData.filter(r => r.type === "other"))
    );
    document.getElementById("showAll").addEventListener("click", () =>
        renderRegions(allRegionsData)
    );

    document.getElementById("findNearest").addEventListener("click", findNearestStopAutomatically);
    document.getElementById("reset").addEventListener("click", () => {
        resetAll();
        userReset = true;
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

        let regions = [
            ...cities.map(r => ({ name: r.stop_area, type: "city" })),
            ...others.map(r => ({ name: r.stop_area, type: "other" }))
        ];

        // убрать дубликаты и сортировать
        const seen = new Set();
        regions = regions.filter(r => {
            if (seen.has(r.name)) return false;
            seen.add(r.name);
            return true;
        });
        regions.sort((a, b) => a.name.localeCompare(b.name));

        allRegionsData = regions;
        renderRegions(allRegionsData);
    } catch (err) {
        console.error(err);
    }
}

function renderRegions(regions) {
    datalistRegions.innerHTML = regions
        .map(r => `<option value="${r.name}" data-type="${r.type}">`)
        .join("");
}

async function loadStopsForRegion(regionName) {
    if (!regionName) return;
    try {
        const res = await fetch(`/stops?region=${encodeURIComponent(regionName)}`);
        const stops = await res.json();
        console.log(stops);

        datalistStops.innerHTML = "";
        stops.forEach(s => {
            const option = document.createElement("option");
            option.value = s.stop_name;
            option.text = `${s.stop_name} (${s.stop_id})`;
            datalistStops.appendChild(option);
        });

        if (stopSelect.value.trim()) await showBuses(stopSelect.value.trim());
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
            await showBuses(stop.stop_name);
        } catch (err) {
            console.error(err);
        }
    });
}

async function showBuses(stopName) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<div class="list-group-item">Loading buses...</div>`;
    try {
        const res = await fetch(`/stops/${encodeURIComponent(stopName)}/buses`);
        const buses = await res.json();

        buses.sort((a, b) => {
            const na = parseInt(a)||0, nb = parseInt(b)||0;
            return na !== nb ? na-nb : a.localeCompare(b);
        });
        // buses.sort(sortBusNumbers);

        // let html = `<div class="list-group-item mb-3"><strong>Stop:</strong> ${stopName}</div>
        //             <div id="busButtons" class="d-flex flex-wrap gap-2">`;
        let html = `<div class="bus-buttons-container">`;
        buses.forEach(bus => html += `<button class="btn btn-outline-primary bus-btn" data-bus="${bus}">${bus}</button>`);
        html += `</div><div id="arrivalsContainer"></div>`;
        resultsDiv.innerHTML = html;

        // навешиваем обработчики на кнопки автобусов
        document.querySelectorAll(".bus-btn").forEach(btn =>
            btn.addEventListener("click", () => showArrivals(btn.dataset.bus, stopName))
        );

        // сразу показываем arrivals для первого автобуса
        if (buses.length) showArrivals(buses[0], stopName);

    } catch (err) {
        console.error(err);
    }
}

async function showBusesWithDirection(stopName) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<div class="list-group-item">Loading buses...</div>`;
    try {
        const res = await fetch(`/stops/${encodeURIComponent(stopName)}/busesWithDirection`);
        const buses = await res.json();

        // сортировка по номеру автобуса
        buses.sort((a, b) => {
            const na = parseInt(a.route)||0, nb = parseInt(b.route)||0;
            return na !== nb ? na-nb : a.route.localeCompare(b.route);
        });

        let html = `<div class="bus-buttons-container">`;
        buses.forEach(bus => {
            html += `<button class="btn btn-outline-primary bus-btn" 
                      data-bus="${bus.route}" 
                      data-direction="${bus.direction}">
                      ${bus.route} → ${bus.direction}</button>`;
        });
        html += `</div><div id="arrivalsContainer"></div>`;
        resultsDiv.innerHTML = html;

        document.querySelectorAll(".bus-btn").forEach(btn =>
            btn.addEventListener("click", () => showArrivals(btn.dataset.bus, stopName, btn.dataset.direction))
        );

        if (buses.length) showArrivals(buses[0].route, stopName, buses[0].direction);

    } catch (err) {
        console.error(err);
    }
}

async function showArrivals(busNumber, stopName, direction) {
    const arrivalsContainer = document.getElementById("arrivalsContainer");
    arrivalsContainer.innerHTML = `<div class="list-group-item">Loading arrivals for bus ${busNumber}...</div>`;
    try {
        const url = `/stops/${encodeURIComponent(stopName)}/arrivals?route=${encodeURIComponent(busNumber)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Fetch error');

        const arrivals = await res.json();
        const uniqueArrivals = [...new Set(arrivals.map(a => a.arrival_time))]
            .sort((a, b) => {
                const [ha, ma] = a.split(":").map(Number);
                const [hb, mb] = b.split(":").map(Number);
                return ha !== hb ? ha - hb : ma - mb;
            });

        let stopDisplay = stopName;
        if (nearestStop && nearestStop.stop_id) {
            stopDisplay += ` (${nearestStop.stop_id})`;
        }

        let html = `<div class="list-group-item mt-3">
                      <strong>Next arrivals at "${stopName}" for bus "${busNumber}" <img src="imgs/bus.gif" class="gifs" alt="" srcset=""></strong>
                    </div>`;
        uniqueArrivals.forEach(a => html += `<div class="list-group-item">${parseArrivalTime(a)}</div>`);

        arrivalsContainer.innerHTML = html;
    } catch (err) {
        console.error(err);
        arrivalsContainer.innerHTML = `<div class="list-group-item text-danger">Failed to load arrivals</div>`;
    }
}


function resetAll() {
    document.getElementById("results").innerHTML = "";
    regionSelect.value = "";
    stopSelect.value = "";
    datalistStops.innerHTML = "";
    nearestStop = null;
}