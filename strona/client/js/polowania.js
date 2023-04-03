var socket = io({
  extraHeaders: {
    subpage: "polowania",
  },
});

var polowania = document.getElementById("polowania");
socket.on("polowanie", (data) => {

let wynik = "";
if(data.wynik == "1") {
  wynik = "Kapitalny"
}
if(data.wynik == "2") {
  wynik = "Zadowalający"
}
if(data.wynik == "3") {
  wynik = "Słaby"
}
if(data.wynik == "4") {
  wynik = "Zły"
}

if(data.numer == 0) return;

polowania.innerHTML += 
`<div class="polowanie" id="${data.numer}">
  <h1>${data.numer}</h1>
  <h2>
    <br>Data: ${data.data}
    <br>Teren: ${data.teren}
    <br>Myśliwi: ${data.mysliwi}
    <br>Budżet koła: ${data.budzet}
    <br>Przejechany dystans: ${data.dystans}
    <br>Znalezione struktury: ${data.znalezione_struktury}
    <br>Wynik łowów: ${wynik}
  </h4>
</div>`
})