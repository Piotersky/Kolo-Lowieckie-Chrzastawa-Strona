var socket = io({
  extraHeaders: {
    subpage: "mapa",
  },
});

window.onload = function () {
  let map = L.map("map", {
    fullscreenControl: true,
  }).setView([51.008923, 17.347519], 11);

  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const customIcon = L.icon({
    iconUrl: '/data/dist/images/pin.png', // Ścieżka do pliku obrazu ikony
    iconSize: [16, 16], // Rozmiar ikony [szerokość, wysokość]
    iconAnchor: [8, 8], // Punkt zakotwiczenia ikony (środek)
    popupAnchor: [0, -12], // Punkt zakotwiczenia dla popup
  });

  socket.on("struktura", (data) => {
    console.log(data);
    latitude = parseFloat(data.latitude);
    longitude = parseFloat(data.longitude);

    if (data.numer.startsWith("n")) {
      numer = data.numer;
    } else {
      numer = toString(data.numer);
    }

    let hum_num = data.numer;
    if(data.numer.includes("_")) {
      hum_num = data.numer.split("_")[0];
    }

    // let markerOptions = { icon: customIcon };
    let markerOptions = {};

    if (data.rodzaj == "1") {
      numer = L.marker([latitude, longitude], markerOptions)
        .addTo(map)
        .bindPopup("Ambona " + hum_num);
    }
    if (data.rodzaj == "2") {
      numer = L.marker([latitude, longitude], markerOptions)
        .addTo(map)
        .bindPopup("Zwyżka " + hum_num);
    }
    if (data.rodzaj == "3") {
      numer = L.marker([latitude, longitude], markerOptions)
        .addTo(map)
        .bindPopup("Wysiadka " + hum_num);
    }
  });

  const markerClusterGroup = L.markerClusterGroup();

  fetch("/data/export.geojson")
    .then((response) => response.json())
    .then((geojsonData) => {
      const geoJsonLayer = L.geoJSON(geojsonData, {
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
          }
        },
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, { icon: customIcon });
        },
      });

      markerClusterGroup.addLayer(geoJsonLayer);
      map.addLayer(markerClusterGroup);
    })
    .catch((error) => {
      console.error("Błąd podczas ładowania pliku GeoJSON:", error);
    });
};