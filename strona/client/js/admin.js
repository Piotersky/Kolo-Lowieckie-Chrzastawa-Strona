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

socket.on("Authenticated", (data) => {
  logged = true;

  var login = document.getElementById("login");

  login.style.visibility = "hidden";
  login.style.width = "0px";
  login.style.height = "0px";

  var main = document.querySelector("main");

  main.style.visibility = "visible";
  main.style.width = "100%";
  main.style.height = "100%";
});

var add_struktura_btn = document.getElementById("add_s_btn");
var file_input = document.getElementById("file");

// file_input.addEventListener("change", function () {
//   add_struktura_btn.addEventListener("click", () => {
//     const reader = new FileReader();
//     reader.addEventListener("load", () => {
//       var uploaded_image = reader.result;


//       data = {
//         img: uploaded_image,
//         numer: document.getElementById("numer_s").value,
//         rodzaj: document.getElementById("rodzaj").value,
//         longitude: document.getElementById("longitude").value,
//         latitude: document.getElementById("latitude").value,
//         polowanie: document.getElementById("polowanie").value,
//         dc_ann: document.getElementById("dc_ann").checked,
//       };

//       console.log(data);

//       socket.emit("add_struktura", data);
//     });
//     reader.readAsDataURL(this.files[0]);
//   });
// });

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
        polowanie: document.getElementById("polowanie").value,
        dc_ann: document.getElementById("dc_ann").checked,
      };

      console.log(data);

      socket.emit("add_struktura", data);

      // Reset the flag after the socket event is sent
      isAddingStruktura = false;
    });

    reader.readAsDataURL(this.files[0]);
  });
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

setTimeout(() => {
  if (logged == false) {
    alert(
      "Upłynął czas na zalogowanie się.\nOdśwież stronę i spróbuj ponownie!"
    );
  }
}, 30 * 1000);
