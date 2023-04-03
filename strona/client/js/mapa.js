window.onload = function () {
  let map = L.map("map", {
    fullscreenControl: true,
  }).setView([51.008923, 17.347519], 11);

  var socket = io.connect("https://klchrzastawa.onrender.com/mapa", {
   forceNew: true,
   transports: ["polling"],
   extraHeaders: {
    subpage: "mapa",
  },
});

  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  socket.on("struktura", (data) => {
    console.log(data)
    latitude = parseFloat(data.latitude);
    longitude = parseFloat(data.longitude);

    if (data.numer.startsWith("n")) {
      numer = data.numer;
    } else {
      numer = toString(data.numer);
    }

    if(data.rodzaj == "1") {
        numer = L.marker([latitude, longitude], { alt: numer })
      .addTo(map)
      .bindPopup("Ambona " + data.numer);
    }
    if(data.rodzaj == "2") {
        numer = L.marker([latitude, longitude], { alt: numer })
      .addTo(map)
      .bindPopup("Zwyżka " + data.numer);
    }
    if(data.rodzaj == "3") {
        numer = L.marker([latitude, longitude], { alt: numer })
      .addTo(map)
      .bindPopup("Wysiadka " + data.numer);
    }

    //eval('let ' + numer + '= L.marker([' + latitude + ', ' + longitude + '], { alt: "" }).addTo('+ map +').bindPopup("s");');
  });
};
