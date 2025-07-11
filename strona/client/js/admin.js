var login_btn = document.getElementById("login_btn");
logged = false;

var socket = io({
  extraHeaders: {
    subpage: "admin",
  },
});

login_btn.addEventListener("click", () => {
  var password = document.getElementById("password").value;

  socket.emit("login", password);
});

socket.on("admin", (data) => {
  if(data == true) {
    logged = true;

    var login = document.getElementById("login");

    login.style.visibility = "hidden";
    login.style.width = "0px";
    login.style.height = "0px";

    var main = document.querySelector("main");

    main.style.visibility = "visible";
    main.style.width = "100%";
    main.style.height = "100%";

    // Fix Leaflet map rendering after showing
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
  else {
    alert("Błędne hasło!");
    document.getElementById("password").value = "";
  }
});

var map = L.map('map').setView([51.087654, 17.328204], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  var marker;

  const customIcon = L.icon({
    iconUrl: '/data/dist/images/pin.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });

  const selectedIcon = L.icon({
    iconUrl: '/data/dist/images/pin-selected.png',
    iconSize: [16, 16],
    iconAnchor: [0, 16],
    popupAnchor: [0, 16],
  });

  let selectionMarker = null;

  // Function to set the selection marker
  function setSelectionMarker(latlng) {
    document.getElementById('latitude').value = latlng.lat.toFixed(6);
    document.getElementById('longitude').value = latlng.lng.toFixed(6);

    if (selectionMarker) {
      selectionMarker.setLatLng(latlng);
    } else {
      selectionMarker = L.marker(latlng, { icon: selectedIcon, zIndexOffset: 1000 }).addTo(map);
    }
    selectionMarker.setIcon(selectedIcon);
  }

  // Map click for selecting location
  map.on('click', function(e) {
    setSelectionMarker(e.latlng);
  });

  // Add markers from struktura and allow selection
  socket.on("struktura", (data) => {
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

    let markerOptions = {  };

    let markerInstance;
    if (data.rodzaj == "1") {
      markerInstance = L.marker([latitude, longitude], markerOptions)
        .addTo(map)
        .bindPopup("Ambona " + hum_num);
    }
    if (data.rodzaj == "2") {
      markerInstance = L.marker([latitude, longitude], markerOptions)
        .addTo(map)
        .bindPopup("Zwyżka " + hum_num);
    }
    if (data.rodzaj == "3") {
      markerInstance = L.marker([latitude, longitude], markerOptions)
        .addTo(map)
        .bindPopup("Wysiadka " + hum_num);
    }

    // Allow clicking on marker to select location
    if (markerInstance) {
      markerInstance.on('click', function(e) {
        setSelectionMarker(e.latlng);
      });
    }
  });

  const markerClusterGroup = L.markerClusterGroup();

  fetch("/data/export.geojson")
  .then((response) => response.json())
  .then((geojsonData) => {
    const geoJsonLayer = L.geoJSON(geojsonData, {
      onEachFeature: function (feature, layer) {
        // Add click event to select location
        layer.on('click', function(e) {
          setSelectionMarker(e.latlng);
        });
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


var add_struktura_btn = document.getElementById("add_s_btn");
var file_input = document.getElementById("file");

var add_struktura_btn = document.getElementById("add_s_btn");
var file_input = document.getElementById("file");
var isAddingStruktura = false; // Flag to prevent multiple socket events

file_input.addEventListener("change", function () {
  add_struktura_btn.addEventListener("click", () => {
    if (isAddingStruktura) {
      console.warn("Adding struktura is already in progress.");
      return; // Prevent sending another socket event
    }

    isAddingStruktura = true; // Set the flag to true
    add_struktura_btn.disabled = true; // Disable the button temporarily

    setTimeout(() => {
      add_struktura_btn.disabled = false;
    }, 1000);

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      var uploaded_image = reader.result;

      data = {
        img: uploaded_image,
        numer: document.getElementById("numer_s").value,
        rodzaj: document.getElementById("rodzaj").value,
        longitude: document.getElementById("longitude").value,
        latitude: document.getElementById("latitude").value,
        polowanie: document.getElementById("polowanie").value || "0",
        dc_ann: document.getElementById("dc_ann").checked,
      };

      console.log(data);

      socket.emit("add_struktura", data);
      alert("Dodawanie struktury...");

      // Reset the flag after the socket event is sent
      isAddingStruktura = false;
    });

    reader.readAsDataURL(this.files[0]);
  });
});


socket.on("struktura_added", () => {
  alert("Pomyślnie dodano strukturę!");
});

document.getElementById("del_s_btn").addEventListener("click", () => {
  socket.emit("del_struktura", {
    rodzaj: document.getElementById("rodzaj_del").value,
    numer: document.getElementById("del_s").value,
  });
});

var add_polowanie_btn = document.getElementById("add_p_btn");
add_polowanie_btn.addEventListener("click", () => {
  data = {
    numer: document.getElementById("numer_p").value,
    data: document.getElementById("data").value,
    teren: document.getElementById("teren").value,
    mysliwi: document.getElementById("mysliwi").value,
    budzet: document.getElementById("budzet").value,
    dystans: document.getElementById("dystans").value,
    znalezione_struktury: document.getElementById("znalezione_struktury").value,
    wynik: document.getElementById("wynik").value,
    dc_ann: document.getElementById("dc_ann").checked,
  };

  socket.emit("add_polowanie", data);
});

document.getElementById("del_p_btn").addEventListener("click", () => {
  socket.emit("del_polowanie", document.getElementById("del_p").value);
});

// var backup_btn = document.getElementById("backup");
// var backup_text = document.getElementById("backup_text");
// backup_btn.addEventListener("click", () => {
//   socket.emit("backup");
//   backup_text.innerText = "Poczekaj, trwa tworzenie pliku zip...";
// });

// socket.on("backup_file", function (data) {
//   backup_text.innerText = "Trwa konwertowanie pliku...";

//   var binary = atob(data);
//   var bin_length = binary.length;
//   var bytes = new Uint8Array(bin_length);

//   for (let i = 0; i < bin_length; i++) {
//     bytes[i] = binary.charCodeAt(i);
//   }

//   var file_bytes = bytes.buffer;
//   var blob = new Blob([file_bytes], { type: "octet/stream" });

//   var anchor = document.createElement("a");
//   document.body.append(anchor);
//   anchor.style = "display: none;";

//   backup_text.innerText = "Trwa pobieranie pliku...";
//   var url = window.URL.createObjectURL(blob);
//   anchor.href = url;
//   anchor.download = "backup.zip";
//   anchor.click();

//   window.URL.revokeObjectURL(url);
//   backup_text.innerText = "Pobierz kopię wszystkich struktur i wypraw:";
// });

// setTimeout(() => {
//   if (logged == false) {
//     alert(
//       "Upłynął czas na zalogowanie się.\nOdśwież stronę i spróbuj ponownie!"
//     );
//   }
// }, 30 * 1000);
