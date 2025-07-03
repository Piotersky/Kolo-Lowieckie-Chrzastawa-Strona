var socket = io({
  extraHeaders: {
    subpage: "struktury",
  },
});

const parentDiv = document.getElementById("struktury");

socket.on("struktura", (data) => {
  console.log(data);
  let text = "";
  let numer = data.numer;
  let id;

  if (data.numer.startsWith("n")) {
    numer = "bez numeru";
  }
  let hum_num = numer;
  if(data.numer.includes("_")) {
    hum_num = data.numer.split("_")[0];
  }

  if (data.rodzaj == 1) {
    text = "Ambona " + hum_num;
    id = "A" + data.numer;
  }
  if (data.rodzaj == 2) {
    text = "Zwyżka " + hum_num;
    id = "Z" + data.numer;
  }
  if (data.rodzaj == 3) {
    text = "Wysiadka " + hum_num;
    id = "W" + data.numer;
  }

  polowanie = data.polowanie;
  if(data.polowanie == 0) polowanie = "przed zaczęciem zapisywania"

  if (data.buffer == "") {
    parentDiv.innerHTML +=
      '<div class="struktura" id="div' +
      id +
      '" onmouseleave="leave(' +
      "'" +
      id +
      "'" +
      ')" onmouseover="hover(' +
      "'" +
      id +
      "'" +
      ')"><p class="title" id="title' +
      id +
      '">' +
      text +
      '</p><p class="desc" id="desc' +
      id +
      '">🔢Numer: ' +
      data.numer +
      "<br>🌐Szerokość geograficzna: " +
      data.latitude +
      "<br>🌐Długość geograficzna: " +
      data.longitude +
      "<br>📒Polowanie: " +
      polowanie +
      '</p><img id="img' +
      id +
      '" class="img" src="client/img/no_img.png"></div>';
    return;
  }

  parentDiv.innerHTML +=
    '<div class="struktura" id="div' +
    id +
    '" onmouseleave="leave(' +
    "'" +
    id +
    "'" +
    ')" onmouseover="hover(' +
    "'" +
    id +
    "'" +
    ')"><p class="title" id="title' +
    id +
    '">' +
    text +
    '</p><p class="desc" id="desc' +
    id +
    '">🔢Numer: ' +
    data.numer +
    "<br>📒Polowanie: " +
    polowanie +
    "<br>🌐Szerokość geograficzna: " +
    data.latitude +
    "<br>🌐Długość geograficzna: " +
    data.longitude +
    '</p><img id="img' +
    id +
    '" class="img" src="data:image/png;base64, ' +
    data.buffer +
    '"></div>';
});

socket.on("struktura_batch", (batch) => {
  batch.forEach((data) => {
    console.log(data);
    let text = "";
    let numer = data.numer;
    let id;

    if (data.numer.startsWith("n")) {
      numer = "bez numeru";
    }
    let hum_num = numer;
    if (data.numer.includes("_")) {
      hum_num = data.numer.split("_")[0];
    }

    if (data.rodzaj == 1) {
      text = "Ambona " + hum_num;
      id = "A" + data.numer;
    }
    if (data.rodzaj == 2) {
      text = "Zwyżka " + hum_num;
      id = "Z" + data.numer;
    }
    if (data.rodzaj == 3) {
      text = "Wysiadka " + hum_num;
      id = "W" + data.numer;
    }

    polowanie = data.polowanie;
    if (data.polowanie == 0) polowanie = "przed zaczęciem zapisywania";

    if (data.buffer == "") {
      parentDiv.innerHTML +=
        '<div class="struktura" id="div' +
        id +
        '" onmouseleave="leave(' +
        "'" +
        id +
        "'" +
        ')" onmouseover="hover(' +
        "'" +
        id +
        "'" +
        ')"><p class="title" id="title' +
        id +
        '">' +
        text +
        '</p><p class="desc" id="desc' +
        id +
        '">🔢Numer: ' +
        data.numer +
        "<br>🌐Szerokość geograficzna: " +
        data.latitude +
        "<br>🌐Długość geograficzna: " +
        data.longitude +
        "<br>📒Polowanie: " +
        polowanie +
        '</p><img id="img' +
        id +
        '" class="img" src="client/img/no_img.png"></div>';
      return;
    }

    parentDiv.innerHTML +=
      '<div class="struktura" id="div' +
      id +
      '" onmouseleave="leave(' +
      "'" +
      id +
      "'" +
      ')" onmouseover="hover(' +
      "'" +
      id +
      "'" +
      ')"><p class="title" id="title' +
      id +
      '">' +
      text +
      '</p><p class="desc" id="desc' +
      id +
      '">🔢Numer: ' +
      data.numer +
      "<br>📒Polowanie: " +
      polowanie +
      "<br>🌐Szerokość geograficzna: " +
      data.latitude +
      "<br>🌐Długość geograficzna: " +
      data.longitude +
      '</p><img id="img' +
      id +
      '" class="img" src="data:image/png;base64, ' +
      data.photo +
      '"></div>';
  });
});

var szukaj = document.getElementById("szukaj");

function hover(numer) {

  var img = document.getElementById("img" + numer);

  img.style.visibility = "hidden";

  var title = document.getElementById("title" + numer);

  title.style.visibility = "hidden";

  var desc = document.getElementById("desc" + numer);

  desc.style.visibility = "visible";
  desc.style.width = "100%";
  desc.style.height = "100%";
}

function leave(numer) {

  var img = document.getElementById("img" + numer);

  img.style.visibility = "visible";

  var title = document.getElementById("title" + numer);

  title.style.visibility = "visible";

  var desc = document.getElementById("desc" + numer);

  desc.style.visibility = "hidden";
  desc.style.width = "0%";
  desc.style.height = "0%";
}

szukaj.addEventListener("click", () => {

  ambony = document.getElementById("ambony").checked;
  zwyżki = document.getElementById("zwyżki").checked;
  wysiadki = document.getElementById("wysiadki").checked;
  wszystkie = document.getElementById("wszystkie").checked;

  array = [ambony, zwyżki, wysiadki, wszystkie];

  search = {
    val: document.getElementById("znajdz").value,
    rodzaj: array,
  };

  socket.emit("search", search);

  const struktury = Array.from(document.getElementsByClassName("struktura"));

  struktury.forEach((div) => {
    div.remove();
  });
});
