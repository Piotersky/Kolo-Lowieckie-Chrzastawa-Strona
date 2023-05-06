const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
// const path = require("path");
// const { promisify } = require("util");
const mongoose = require("mongoose");
const config = require("../bot/config.js");
const polowanie = require("./polowanie_schema.js");
const struktura = require("./struktura_schema.js");
const last = require("./last_schema.js");

module.exports = (client) => {
  //Initialize
  

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

  app.use("/client", express.static(__dirname + "/client"));

  app.get("/", function (req, res) {
    res.sendFile(__dirname + "/client/index.html");
  });
  app.get("/struktury", (req, res) => {
    res.sendFile(__dirname + "/client/struktury.html");
  });
  app.get("/o_nas", (req, res) => {
    res.sendFile(__dirname + "/client/o_nas.html");
  });
  app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/client/admin.html");
  });
  app.get("/polowania", (req, res) => {
    res.sendFile(__dirname + "/client/polowania.html");
  });
  app.get("/mapa", (req, res) => {
    res.sendFile(__dirname + "/client/mapa.html");
  });

  const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 10e8,
});

  //MongoDB

  const uri = `mongodb+srv://${config.username}:${config.password}@cluster0.8kcmsxz.mongodb.net/data?retryWrites=true&w=majority`;

  mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

  io.on("connection", function (socket) {
    function log(text) {
      console.log(text);
      client.channels.cache.get(`1081963979091476523`).send(text);
    }

    log("Socket connected");

    // const readFile = promisify(fs.readFile);
    // const exists = promisify(fs.exists);

    const data_dir = "./data/";
    const struktury_dir = data_dir + "struktury/";
    //   // const polowania_dir = data_dir + "polowania/";

    if (socket.handshake.headers["subpage"] === "struktury") {
      log(`Socket **${socket.id}** connected on /struktury`);

          // async function getBuffer(filePath) {
          //   //Get img buffer
          //   const isFile = await exists(filePath);
          //   if (!isFile) return "";
          //   return readFile(filePath);
          // }

          // async function send(type, file, fun) {
          //   //Read one file and do function that is an argument
          //   if ((await exists(struktury_dir + type + "/" + file)) == false) return;

          //   const content = await readFile(
          //     struktury_dir + type + "/" + file,
          //     "utf8"
          //   );

          //   if (!content) return;

          //   const json = JSON.parse(content);
          //   const img_path = struktury_dir + +type + "/" + path.parse(file).name;

          //   const buf = await getBuffer(`${img_path}.jpg`);

          //   const data = {
          //     numer: json.numer,
          //     buffer: buf.toString("base64"),
          //     rodzaj: json.rodzaj,
          //     longitude: json.longitude,
          //     latitude: json.latitude,
          //     polowanie: json.polowanie,
          //   };

          //   fun(data);
          // }

          // async function files(type, fun) {
          //   //For files in specific folder
          //   try {
          //     const files = fs.readdirSync(`${struktury_dir}${type}/`);

          //     files.forEach(async (file) => {
          //       if (file.split(".").pop() === "json") {
          //         await fun(file);
          //       }
          //     });
          //   } catch (err) {
          //     console.log(err);
          //   }
          // }

          // for (let i = 1; i < 4; i++) {
          //   //For all files
          //   files(i, function (file) {
          //     send(i, file, function (data) {
          //       socket.emit("struktura", data);
          //     });
          //   });
          // }

          async function send(element) {
            const data = {
              numer: element.numer,
              rodzaj: element.rodzaj,
              polowanie: element.polowanie,
              longitude: element.longitude,
              latitude: element.latitude,
              buffer: element.photo,
            };
            socket.emit("struktura", data);
          }

          function all() {
            struktura.find().then(async (result) => {
              for (let i = 0; i < result.length; i++) {
                const element = result[i];
                await send(element);
              }
            });
          }

          all()

          //On search
          socket.on("search", function (data) {

            if (data.val == "" && data.rodzaj[3]) {
              all();
              return;
            }

            //Only one type
            if(data.val == "") {
              for (let i = 1; i < 4; i++) {
                const element = data.rodzaj[i - 1];
                const rodzaj = i;
                if (element) {
                  struktura.find().then(async (result) => {
                    for (let i = 0; i < result.length; i++) {
                      const element = result[i];
                      if (element.rodzaj == rodzaj) {
                        await send(element);
                      }
                    }
                  });
                }
              }
              return;
            }

            //All types but with this name
            if (data.rodzaj[3]) {
              struktura.find().then(async (result) => {
                for (let i = 0; i < result.length; i++) {
                  const element = result[i];
                  if (element.numer == data.val) {
                    await send(element);
                  }
                }
              });
              return;
            }

            for (let i = 1; i < 4; i++) {
              const element = data.rodzaj[i - 1];
              const rodzaj = i;
              if (element) {
                struktura.find().then(async (result) => {
                  for (let i = 0; i < result.length; i++) {
                    const element = result[i];
                    if (element.rodzaj == rodzaj) {
                      await send(element);
                    }
                  }
                });
              }
            }

            // function another(type, multiple, file) {
            //   if (data.val == "n") {
            //     if (multiple) {
            //       files(type, function (file) {
            //         send(type, file, function (data) {
            //           if (data.numer.startsWith("n")) {
            //             socket.emit("struktura", data);
            //           }
            //         });
            //       });
            //     }
            //     if (!multiple) {
            //       send(type, file, function (data) {
            //         if (data.number.startsWith("n")) {
            //           socket.emit("struktura", data);
            //         }
            //       });
            //     }
            //     return;
            //   }
            //   if (data.val == "") {
            //     if (multiple) {
            //       files(type, function (file) {
            //         send(type, file, function (data) {
            //           socket.emit("struktura", data);
            //         });
            //       });
            //     }
            //     if (!multiple) {
            //       send(type, file, function (data) {
            //         socket.emit("struktura", data);
            //       });
            //     }
            //     return;
            //   }
            // }

            // for (let i = 1; i < 4; i++) {
            //   const element = data.rodzaj[i - 1];

            //   if (element) {
            //     struktura.find().then(async (result) => {
            //       for (let i = 0; i < result.length; i++) {
            //         const element = result[i];
            //         if (element.rodzaj == i) {
            //           await send(element);
            //         }
            //       }
            //     });
            //   }
            // }

            // for (let i = 1; i < 4; i++) {
            //   another(i, true, "");
            // }

            // file = data.val + ".json";
            // for (let i = 1; i < 4; i++) {
            //   send(i, file, function (data) {
            //     socket.emit("struktura", data);
            //   });
            // }
          });
    }

    if (socket.handshake.headers["subpage"] === "admin") {
      log(`Socket **${socket.id}** connected on /admin`);

          logged = false;

          socket.on("login", function (data) {
            log(`Try login on: **${socket.id}**`);
            if (data == config.admin_pas) {
              logged = true;

              socket.emit("Authenticated");
              log(`Logged on: **${socket.id}**`);
            }
          });

          socket.on("add_struktura", async function (data) {
            let number = 0;
            let nazwa = data.numer;

            if (data.numer == "") {
              //Read last "nieponumerowana" struktura number
              await last.find({ rodzaj: data.rodzaj }).then((result) => {
                number = result[0].numer + 1;
              });

              await last.deleteMany({ rodzaj: data.rodzaj });

              const newLast = new last({
                numer: number,
                rodzaj: data.rodzaj,
              });

              newLast
                .save()
                .then()
                .catch((err) => {
                  console.error(err);
                });

              nazwa = number.toString();
              nazwa = "n" + nazwa;
            }

            console.log(data.numer)

            let base64 = data.img.split(";base64,").pop();

            const newStruktura = new struktura({
              numer: nazwa,
              rodzaj: data.rodzaj,
              longitude: data.longitude,
              latitude: data.latitude,
              polowanie: data.polowanie,
              photo: base64,
            });

            console.log(newStruktura.nazwa);

            newStruktura
              .save()
              .then((result) => {
                console.log(newStruktura.polowanie)
                console.log(result)
              })
              .catch((err) => {
                console.error(err);
              });

            let discord = "🔢Nr. " + data.numer;
            if (data.numer == "") discord = "🔢 Bez numeru";

            console.log("s")

            if (data.rodzaj == "1") {
              fs.writeFileSync(`${struktury_dir}1/${nazwa}.jpg`, base64, {
                encoding: "base64",
              });

              setTimeout(() => {
                client.channels.cache.get(`999685658572496906`).send(discord);
                client.channels.cache.get(`999685658572496906`).send({
                  files: [`${struktury_dir}1/${nazwa}.jpg`],
                });
              }, 1000);
            }

            if (data.rodzaj == "2") {
              fs.writeFileSync(`${struktury_dir}2/${nazwa}.jpg`, base64, {
                encoding: "base64",
              });

              setTimeout(() => {
                client.channels.cache.get(`999685864919683122`).send(discord);
                client.channels.cache.get(`999685864919683122`).send({
                  files: [`${struktury_dir}2/${nazwa}.jpg`],
                });
              }, 1000);
            }

            if (data.rodzaj == "3") {
              fs.writeFileSync(`${struktury_dir}3/${nazwa}.jpg`, base64, {
                encoding: "base64",
              });

              setTimeout(() => {
                client.channels.cache.get(`1004823240851599420`).send(discord);
                client.channels.cache.get(`1004823240851599420`).send({
                  files: [`${struktury_dir}3/${nazwa}.jpg`],
                });
              }, 1000);
            }

            log(`Added struktura *${nazwa}* on: **${socket.id}**`);
          });

          socket.on("del_struktura", async function (data) {
            await struktura.deleteMany({ numer: data });
            log(`Deleted struktura *${data.numer}* on: **${socket.id}**`);
          });

          socket.on("add_polowanie", function (data) {
            const newPolowanie = new polowanie({
              numer: data.numer,
              data: data.data,
              teren: data.teren,
              mysliwi: data.mysliwi,
              budzet: data.budzet,
              dystans: data.dystans,
              znalezione_struktury: data.znalezione_struktury,
              wynik: data.wynik,
            });

            newPolowanie
              .save()
              .then()
              .catch((err) => {
                console.error(err);
              });

            let wynik = "";
            if (data.wynik == 1) {
              wynik = "Kapitalny";
            }
            if (data.wynik == 2) {
              wynik = "Zadowalający";
            }
            if (data.wynik == 3) {
              wynik = "Słaby";
            }
            if (data.wynik == 4) {
              wynik = "Zły";
            }

            setTimeout(() => {
              client.channels.cache
                .get(`999685658572496906`)
                .send(`📌Polowanie nr. ${data.numer}`);
              client.channels.cache
                .get(`999685864919683122`)
                .send(`📌Polowanie nr. ${data.numer}`);
              client.channels.cache
                .get(`1004823240851599420`)
                .send(`📌Polowanie nr. ${data.numer}`);

              const embedVar = new EmbedBuilder()
                .setTitle("Polowanie")
                .setDescription("Dodano nowe polowanie")
                .setColor(0x88000)
                .addFields(
                  {
                    name: "🔢Numer",
                    value: data.numer,
                    inline: false,
                  },
                  {
                    name: "📆Data",
                    value: data.data,
                    inline: false,
                  },
                  {
                    name: "🧭Teren",
                    value: data.teren,
                    inline: false,
                  },
                  {
                    name: "💪Myśliwi",
                    value: data.mysliwi,
                    inline: false,
                  },
                  {
                    name: "💸Budżet koła",
                    value: data.budzet,
                    inline: false,
                  },
                  {
                    name: "🚲Przejechany dystans",
                    value: data.dystans,
                    inline: false,
                  },
                  {
                    name: "🔎Znalezione ambony, zwyżki, wysiadki",
                    value: data.znalezione_struktury,
                    inline: false,
                  },
                  {
                    name: "📝Wynik łowów",
                    value: wynik,
                    inline: false,
                  }
                )
                .setFooter({
                  text: "Koło Łowieckie Chrząstawa Bot - By PioterSky",
                });

              client.channels.cache
                .get(`999410309108355214`)
                .send({ embeds: [embedVar] });
            }, 1000);

            log(`Added polowanie *${data.numer}* on: **${socket.id}**`);
          });

          socket.on("del_polowanie", async function (data) {
            await polowanie.deleteMany({ numer: data });
            log(`Deleted polowanie *${data}* on: **${socket.id}**`);
          });

          setTimeout(() => {
            if (!logged) {
              socket.disconnect(true);
              socket.client._remove(socket.id);
            }
          }, 30 * 1000);
    }

    if (socket.handshake.headers["subpage"] === "polowania") {
      log(`Socket **${socket.id}** connected on /polowania`);

          async function send_polowanie(element) {
            const data = {
              numer: element.numer,
              data: element.data,
              teren: element.teren,
              mysliwi: element.mysliwi,
              budzet: element.budzet,
              dystans: element.dystans,
              znalezione_struktury: element.znalezione_struktury,
              wynik: element.wynik,
            };
            socket.emit("polowanie", data);
          }

          polowanie.find().then(async (result) => {
            for (let i = 0; i < result.length; i++) {
              const element = result[i];
              await send_polowanie(element);
            }
          });
    }
    if (socket.handshake.headers["subpage"] === "mapa") {
      log(`Socket **${socket.id}** connected on /mapa`);

          async function send_struktura(element) {
            const data = {
              numer: element.numer,
              rodzaj: element.rodzaj,
              longitude: element.longitude,
              latitude: element.latitude,
            };
            socket.emit("struktura", data);
          }

          struktura.find().then(async (result) => {
            for (let i = 0; i < result.length; i++) {
              const element = result[i];
              await send_struktura(element);
            }
          });
    }
  });

  const port = 10000;

  httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
