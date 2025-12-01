// document.addEventListener("DOMContentLoaded", async () => {
//     const regionSelect = document.getElementById("regionSelect");
//     const datalist = document.getElementById("regionsListData");

//     // --- загружаем регионы сразу при старте ---
//     try {
//         const res = await fetch("/stops/regions");
//         if (!res.ok) throw new Error("Failed to fetch regions");
//         const allRegions = await res.json();

//         const filtered = allRegions
//             .map(r => r.stop_area)
//             .filter(name => name && name.trim() !== "");

//         // заполняем datalist для автозаполнения
//         datalist.innerHTML = filtered.map(name => `<option value="${name}">`).join("");
//     } catch (err) {
//         console.error(err);
//     }

//     // --- кнопка Show Regions (оставляем для отображения списка в div) ---
//     document.getElementById("listAreas").addEventListener("click", async () => {
//         try {
//             const res = await fetch("/stops/regions");
//             if (!res.ok) throw new Error("Failed to fetch regions");
//             const allRegions = await res.json();

//             const filtered = allRegions
//                 .map(r => r.stop_area)
//                 .filter(name => name && name.trim() !== "");

//             const listDiv = document.getElementById("regionsList");
//             listDiv.innerHTML = filtered.map(name => `<div class="list-group-item">${name}</div>`).join("");
//         } catch (err) {
//             console.error(err);
//         }
//     });

//     // --- автозаполнение остановок по выбранному региону ---
//     regionSelect.addEventListener("change", async () => {
//         const region = regionSelect.value;
//         if (!region) return;

//         try {
//             const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
//             const stops = await res.json();

//             const list = document.getElementById("stopsDatalist");
//             list.innerHTML = stops
//                 .map(s => s.stop_name)
//                 .filter(name => name && name.trim() !== "")
//                 .map(name => `<option value="${name}">`)
//                 .join("");

//             document.getElementById("stopSelect").value = "";
//         } catch (err) {
//             console.error(err);
//         }
//     });

//     // --- поиск ближайшей остановки ---
//     document.getElementById("findNearest").addEventListener("click", async () => {
//         if (!navigator.geolocation) return alert("Geolocation not supported");
//         navigator.geolocation.getCurrentPosition(async ({ coords }) => {
//             try {
//                 const res = await fetch(`/stops/nearest?lat=${coords.latitude}&lon=${coords.longitude}`);
//                 const stop = await res.json();
//                 document.getElementById("results").innerHTML =
//                     `<div class="list-group-item">Nearest stop: ${stop.stop_name} (${stop.stop_area})</div>`;
//             } catch (err) {
//                 console.error(err);
//             }
//         });
//     });

//     // --- поиск автобусов по региону ---
//     document.getElementById("findBuses").addEventListener("click", async () => {
//         const region = regionSelect.value;
//         if (!region) return alert("Enter a region name (e.g., Narva linn)");

//         try {
//             const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
//             const stops = await res.json();
//             const resultsDiv = document.getElementById("results");
//             resultsDiv.innerHTML = stops.map(s =>
//                 `<div class="list-group-item">Stop name: ${s.stop_name}<br>City (area): (${s.stop_area})</div>`
//             ).join("");
//         } catch (err) {
//             console.error(err);
//         }
//     });

//     // --- кнопка сброса ---
//     document.getElementById("reset").addEventListener("click", () => {
//         document.getElementById("results").innerHTML = "";
//         document.getElementById("regionsList").innerHTML = "";
//         regionSelect.value = "";
//         document.getElementById("stopSelect").value = "";
//     });
// });


document.addEventListener("DOMContentLoaded", async () => {
    const regionSelect = document.getElementById("regionSelect");
    const stopSelect = document.getElementById("stopSelect");
    const datalistRegions = document.getElementById("regionsListData");
    const datalistStops = document.getElementById("stopsDatalist");

    // --- загружаем регионы сразу при старте ---
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

    // --- кнопка Show Regions ---
    document.getElementById("listAreas").addEventListener("click", async () => {
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

    // --- автозаполнение остановок по выбранному региону ---
    regionSelect.addEventListener("change", async () => {
        const region = regionSelect.value;
        if (!region) return;

        try {
            const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
            const stops = await res.json();

            datalistStops.innerHTML = stops
                .map(s => s.stop_name)
                .filter(name => name && name.trim() !== "")
                .map(name => `<option value="${name}">`)
                .join("");

            stopSelect.value = "";
        } catch (err) {
            console.error(err);
        }
    });

    // --- поиск автобусов по региону ---
    document.getElementById("findBuses").addEventListener("click", async () => {
        const region = regionSelect.value;
        const stopName = stopSelect.value.trim();
        if (!region) return alert("Enter a region name");

        try {
            const res = await fetch(`/stops?q=${encodeURIComponent(region)}`);
            let stops = await res.json();

            // --- фильтруем по выбранной остановке если указана ---
            if (stopName) {
                stops = stops.filter(s => s.stop_name.toLowerCase() === stopName.toLowerCase());
            }

            const resultsDiv = document.getElementById("results");
            resultsDiv.innerHTML = stops.map(s =>
                `<div class="list-group-item">Stop name: ${s.stop_name}<br>City (area): (${s.stop_area})</div>`
            ).join("");
        } catch (err) {
            console.error(err);
        }
    });

    // --- поиск ближайшей остановки ---
    document.getElementById("findNearest").addEventListener("click", async () => {
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

    // --- кнопка сброса ---
    document.getElementById("reset").addEventListener("click", () => {
        document.getElementById("results").innerHTML = "";
        document.getElementById("regionsList").innerHTML = "";
        regionSelect.value = "";
        stopSelect.value = "";
    });
});
