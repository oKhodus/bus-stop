document.getElementById("findNearest").addEventListener("click", async () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        const res = await fetch(`/stops/nearest?lat=${coords.latitude}&lon=${coords.longitude}`);
        const stop = await res.json();
        document.getElementById("results").innerHTML = 
            `<div class="list-group-item">Nearest stop: ${stop.stop_name} (${stop.stop_area})</div>`;
        });
    });

    document.getElementById("reset").addEventListener("click", () => {
        document.getElementById("results").innerHTML = "";
        document.getElementById("regionsList").innerHTML = "";
        document.getElementById("regionSelect").value = "";
        document.getElementById("stopSelect").value = "";
    });

    document.getElementById("findBuses").addEventListener("click", async () => {
        const region = document.getElementById("regionSelect").value;
        if (!region) return alert("Enter a region name (e.g., Narva linn)");

        const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
        const stops = await res.json();
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = stops.map(s =>
        `<div class="list-group-item">Stop name: ${s.stop_name}<br>City (area): (${s.stop_area})</div>`
        ).join("");

    });

    document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("listAreas").addEventListener("click", async () => {
        try {
            const res = await fetch("/stops/regions");
            if (!res.ok) throw new Error("Failed to fetch regions");
            const allRegions = await res.json();

            // фильтруем пустые
            const filtered = allRegions
                .map(r => r.stop_area)
                .filter(name => name && name.trim() !== "");

            // выводим в div
            const listDiv = document.getElementById("regionsList");
            listDiv.innerHTML = filtered.map(name => `<div class="list-group-item">${name}</div>`).join("");

            // заполняем datalist для автозаполнения
            const datalist = document.getElementById("regionsListData");
            datalist.innerHTML = filtered.map(name => `<option value="${name}">`).join("");
        } catch (err) {
            console.error(err);
        }
    });





    // =========================
    // 2) Load stops when region changes
    // =========================
    // document.getElementById("regionSelect").addEventListener("input", async () => {
    //     const region = document.getElementById("regionSelect").value;

    //     // auto-reset
    //     document.getElementById("stopSelect").value = "";

    //     if (!region) return;

    //     const res = await fetch(`/stops?region=${encodeURIComponent(region)}`);
    //     const stops = await res.json();

    //     const list = document.getElementById("stopsList");
    //     list.innerHTML = stops.map(s => `<option value="${s.stop_name}" data-id="${s.stop_id}">`).join("");
    // });

        // =========================
        // 3) Find buses for selected stop
        // =========================
        // document.getElementById("findBuses").addEventListener("click", async () => {
        //     const stopName = document.getElementById("stopSelect").value;
        //     if (!stopName) return alert("Pick a stop first");

        //     // получаем stop_id по имени
        //     const region = document.getElementById("regionSelect").value;
        //     const resStops = await fetch(`/stops?region=${encodeURIComponent(region)}`);
        //     const stops = await resStops.json();

        //     const stop = stops.find(s => s.stop_name === stopName);
        //     if (!stop) return alert("Stop not found");

        //     // грузим автобусы
        //     const res = await fetch(`/routes?stop_id=${stop.stop_id}`);
        //     let routes = await res.json();

        //     // сортировка по номеру маршрута
        //     routes.sort((a, b) => a.route_number.localeCompare(b.route_number));

        //     const resultsDiv = document.getElementById("results");
        //     resultsDiv.innerHTML = routes.map(r =>
        //         `<div class="list-group-item">
        //             Route: ${r.route_number}<br>
        //             Destination: ${r.destination}
        //         </div>`
        //     ).join("");
        // });

});
