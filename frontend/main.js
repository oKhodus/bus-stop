document.addEventListener("DOMContentLoaded", async () => {
    const regionSelect = document.getElementById("regionSelect");
    const stopSelect = document.getElementById("stopSelect");
    const datalistRegions = document.getElementById("regionsListData");
    const datalistStops = document.getElementById("stopsDatalist");

    try {
        const res = await fetch("/stops/regions");
        if (!res.ok) throw new Error("Failed to fetch regions");
        const allRegions = await res.json();

        const filtered = allRegions
            .map(r => r.stop_area)
            .filter(name => name && name.trim() !== "");

        datalistRegions.innerHTML = filtered.map(name => `<option value="${name}">`).join("");
    } catch (err) {
        console.error(err);
    }

    document.getElementById("listAreas").addEventListener("click", async () => {
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = `<div class="list-group-item">Loading...</div>`;
        try {
            const res = await fetch("/stops/regions");
            const allRegions = await res.json();
            const filtered = allRegions
                .map(r => r.stop_area)
                .filter(name => name && name.trim() !== "");

            const listDiv = document.getElementById("regionsList");
            listDiv.innerHTML = filtered.map(name => `<div class="list-group-item">${name}</div>`).join("");
        } catch (err) {
            console.error(err);
        }
    });

    regionSelect.addEventListener("change", async () => {
        stopSelect.value = "";
        const region = regionSelect.value;
        if (!region) return;

        try {
            const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
            const stops = await res.json();

            const uniqueStops = [...new Set(stops.map(s => s.stop_name).filter(Boolean))];
            datalistStops.innerHTML = uniqueStops.map(name => `<option value="${name}">`).join("");

        } catch (err) {
            console.error(err);
        }
    });

    document.getElementById("findBuses").addEventListener("click", async () => {
        const region = regionSelect.value;
        const stopName = stopSelect.value.trim();

        const resultsDiv = document.getElementById("results");
        if (!region) return alert("Enter a region name");
        if (!stopName) return alert("Enter a stop name");

        resultsDiv.innerHTML = `<div class="list-group-item">Loading...</div>`;
        try {
            const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
            let stops = await res.json();
            stops = stops.filter((s, index, self) =>
            index === self.findIndex(t => t.stop_name === s.stop_name && t.stop_area === s.stop_area)
            );
            const resBus = await fetch(`/stops/${encodeURIComponent(stopName)}/buses`);
            const buses = await resBus.json();

            buses.sort((a, b) => {
            const numA = parseInt(a.match(/^\d+/)?.[0] || "0");
            const numB = parseInt(b.match(/^\d+/)?.[0] || "0");
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b);
            });

            if (stopName) {
                stops = stops.filter(s => s.stop_name.toLowerCase() === stopName.toLowerCase());
            }

            resultsDiv.innerHTML = stops.map(s =>
                `<div class="list-group-item">Stop name: ${s.stop_name}<br>City (area): ${s.stop_area}<br> Buses: ${buses.join(", ")}</div>`
            ).join("");
        } catch (err) {
            console.error(err);
        }
    });

    document.getElementById("findNearest").addEventListener("click", async () => {
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = `<div class="list-group-item">Loading...</div>`;
        if (!navigator.geolocation) return alert("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            try {
                const res = await fetch(`/stops/nearest?lat=${coords.latitude}&lon=${coords.longitude}`);
                const stop = await res.json();
                document.getElementById("results").innerHTML =
                    `<div class="list-group-item">Nearest stop: ${stop.stop_name} (${stop.stop_area})</div>`;
            } catch (err) {
                console.error(err);
            }
        });
    });

    document.getElementById("reset").addEventListener("click", () => {
        document.getElementById("results").innerHTML = "";
        document.getElementById("regionsList").innerHTML = "";
        regionSelect.value = "";
        stopSelect.value = "";
    });
});
