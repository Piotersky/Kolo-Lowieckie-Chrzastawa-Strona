const express = require("express");
var cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  //Initialize
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.options(
    "*",
    cors({
      origin: ["https://www.google.com/"],
    })
  );

  app.use("/client", express.static(__dirname + "/client"));

  app.get("/", cors(), function (req, res) {
    res.sendFile(__dirname + "/client/index.html");
  });
  app.get("/struktury", cors(), (req, res) => {
    res.sendFile(__dirname + "/client/struktury.html");
  });
  app.get("/o_nas", cors(), (req, res) => {
    res.sendFile(__dirname + "/client/o_nas.html");
  });
  app.get("/admin", cors(), (req, res) => {
    res.sendFile(__dirname + "/client/admin.html");
  });
  app.get("/polowania", cors(), (req, res) => {
    res.sendFile(__dirname + "/client/polowania.html");
  });
  app.get("/mapa", cors(), (req, res) => {
    res.sendFile(__dirname + "/client/mapa.html");
  });

  io.on("connection", function (socket) {
    //Set constants

    function log(text) {
      console.log(text);
      client.channels.cache.get(`1081963979091476523`).send(text);
    }

    const fs = require("fs");
    const path = require("path");

    const { promisify } = require("util");
    const readFile = promisify(fs.readFile);
    const exists = promisify(fs.exists);

    const data_dir = "./data/";
    const struktury_dir = data_dir + "struktury/";
    const polowania_dir = data_dir + "polowania/";

    if (socket.handshake.headers["subpage"] === "struktury") {
      log(`Socket **${socket.id}** connected on /struktury`);

      async function getBuffer(filePath) {
        //Get img buffer
        const isFile = await exists(filePath);
        if (!isFile) return "";
        return readFile(filePath);
      }

      async function send(type, file, fun) {
        //Read one file and do function that is an argument
        if ((await exists(struktury_dir + type + "/" + file)) == false) return;

        const content = await readFile(
          struktury_dir + type + "/" + file,
          "utf8"
        );

        if (!content) return;

        const json = JSON.parse(content);
        const img_path = struktury_dir + +type + "/" + path.parse(file).name;

        const buf1 = await getBuffer(`${img_path}.jpg`);
        const buf2 = await getBuffer(`${img_path}.png`);

        const data = {
          numer: json.numer,
          buffer: (buf1 || buf2).toString("base64"),
          rodzaj: json.rodzaj,
          longitude: json.longitude,
          latitude: json.latitude,
          polowanie: json.polowanie,
        };

        fun(data);
      }

      async function files(type, fun) {
        //For files in specific folder
        try {
          const files = fs.readdirSync(`${struktury_dir}${type}/`);

          files.forEach(async (file) => {
            if (file.split(".").pop() === "json") {
              await fun(file);
            }
          });
        } catch (err) {
          console.log(err);
        }
      }

      for (let i = 1; i < 4; i++) {
        //For all files
        files(i, function (file) {
          send(i, file, function (data) {
            socket.emit("struktura", data);
          });
        });
      }

      //Idk what is that

      socket.on("search", function (data) {
        function another(type, multiple, file) {
          if (data.val == "n") {
            if (multiple) {
              files(type, function (file) {
                send(type, file, function (data) {
                  if (data.numer.startsWith("n")) {
                    socket.emit("struktura", data);
                  }
                });
              });
            }
            if (!multiple) {
              send(type, file, function (data) {
                if (data.number.startsWith("n")) {
                  socket.emit("struktura", data);
                }
              });
            }
            return;
          }
          if (data.val == "") {
            if (multiple) {
              files(type, function (file) {
                send(type, file, function (data) {
                  socket.emit("struktura", data);
                });
              });
            }
            if (!multiple) {
              send(type, file, function (data) {
                socket.emit("struktura", data);
              });
            }
            return;
          }
        }

        for (let i = 1; i < 4; i++) {
          const element = data.rodzaj[i - 1];

          if (element) {
            files(i, async function (file) {
              const content = await readFile(
                struktury_dir + i + "/" + file,
                "utf8"
              );
              const json = JSON.parse(content);
              if (json.rodzaj == i) {
                another(i, false, file);

                if (data.val == json.numer) {
                  send(i, file, function (data) {
                    socket.emit("struktura", data);
                  });
                }
              }
            });
            return;
          }
        }

        for (let i = 1; i < 4; i++) {
          another(i, true, "");
        }

        file = data.val + ".json";
        for (let i = 1; i < 4; i++) {
          send(i, file, function (data) {
            socket.emit("struktura", data);
          });
        }
      });
    }

    if (socket.handshake.headers["subpage"] === "admin") {
      log(`Socket **${socket.id}** connected on /admin`);

      logged = false;

      socket.on("login", function (data) {
        log(`Try login on: **${socket.id}**`);
        if (data == "ambony11") {
          logged = true;
          const files = fs.readdirSync(polowania_dir);

          socket.emit("Authenticated", files); //Send all polowania's names
          log(`Logged on: **${socket.id}**`);
        }
      });

      socket.on("add_struktura", function (data) {
        nazwa = data.numer;

        if (nazwa == "") {
          //Read last "nieponumerowana" struktura number
          last_file = `${data_dir}last${data.rodzaj}.txt`;
          content = fs.readFileSync(last_file);
          //Increase number change the file and set filename to it
          nazwa = parseInt(content);
          nazwa += 1;
          nazwa = nazwa.toString();
          fs.writeFileSync(last_file, nazwa);
          nazwa = "n" + nazwa;
        }

        jsonString = {
          numer: nazwa,
          rodzaj: data.rodzaj,
          longitude: data.longitude,
          latitude: data.latitude,
          polowanie: data.polowanie,
        };

        let base64 = data.img.split(";base64,").pop();

        let numer = "🔢Nr. " + data.numer;
        if (data.numer == "") {
          numer = "🔢 Bez numeru";
        }

        if (data.rodzaj == "1") {
          fs.writeFileSync(
            `${struktury_dir}1/${nazwa}.json`,
            JSON.stringify(jsonString)
          );
          fs.writeFileSync(`${struktury_dir}1/${nazwa}.jpg`, base64, {
            encoding: "base64",
          });

          setTimeout(() => {
            client.channels.cache.get(`999685658572496906`).send(numer);
            client.channels.cache.get(`999685658572496906`).send({
              files: [`${struktury_dir}1/${nazwa}.jpg`],
            });
          }, 1000);
        }

        if (data.rodzaj == "2") {
          fs.writeFileSync(
            `${struktury_dir}2/${nazwa}.json`,
            JSON.stringify(jsonString)
          );
          fs.writeFileSync(`${struktury_dir}2/${nazwa}.jpg`, base64, {
            encoding: "base64",
          });

          setTimeout(() => {
            client.channels.cache.get(`999685864919683122`).send(numer);
            client.channels.cache.get(`999685864919683122`).send({
              files: [`${struktury_dir}2/${nazwa}.jpg`],
            });
          }, 1000);
        }

        if (data.rodzaj == "3") {
          fs.writeFileSync(
            `${struktury_dir}3/${nazwa}.json`,
            JSON.stringify(jsonString)
          );
          fs.writeFileSync(`${struktury_dir}3/${nazwa}.jpg`, base64, {
            encoding: "base64",
          });

          setTimeout(() => {
            client.channels.cache.get(`1004823240851599420`).send(numer);
            client.channels.cache.get(`1004823240851599420`).send({
              files: [`${struktury_dir}3/${nazwa}.jpg`],
            });
          }, 1000);
        }

        log(`Added struktura *${nazwa}* on: **${socket.id}**`);
      });

      socket.on("del_struktura", function (data) {
        fs.unlinkSync(`${struktury_dir}${data.rodzaj}/${data.numer}.json`);
        fs.unlinkSync(`${struktury_dir}${data.rodzaj}/${data.numer}.jpg`);
        log(`Deleted struktura *${data.numer}* on: **${socket.id}**`);
      });

      socket.on("add_polowanie", function (data) {
        jsonString = {
          numer: data.numer,
          data: data.data,
          teren: data.teren,
          mysliwi: data.mysliwi,
          budzet: data.budzet,
          dystans: data.dystans,
          znalezione_struktury: data.znalezione_struktury,
          wynik: data.wynik,
        };

        fs.appendFileSync(
          `${polowania_dir}${data.numer}.json`,
          JSON.stringify(jsonString)
        );

        let wynik = "";
        if (data.wynik == "1") {
          wynik = "Kapitalny";
        }
        if (data.wynik == "2") {
          wynik = "Zadowalający";
        }
        if (data.wynik == "3") {
          wynik = "Słaby";
        }
        if (data.wynik == "4") {
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
                name: "🔎Znalezione struktury",
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

      socket.on("del_polowanie", function (data) {
        fs.unlinkSync(`${polowania_dir}${data}.json`);
        log(`Deleted polowanie *${data}* on: **${socket.id}**`);
      });

      socket.on("backup", async function () {
        log(`Downloading backup on: **${socket.id}**`);

        const AdmZip = require("adm-zip");

        try {
          const zip = new AdmZip();
          const outputDir = "./backup.zip";
          zip.addLocalFolder("./data/");
          zip.writeZip(outputDir);
        } catch (e) {
          console.log(`Something went wrong ${e}`);
        }

        data = fs.readFileSync("./backup.zip", { encoding: "base64" }); //Send zip file in base64

        socket.emit("backup_file", data);
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

      async function send_polowanie(file) {
        const content = await readFile(polowania_dir + file, "utf8");

        if (!content) return;

        const json = JSON.parse(content);

        const data = {
          numer: json.numer,
          data: json.data,
          teren: json.teren,
          mysliwi: json.mysliwi,
          budzet: json.budzet,
          dystans: json.dystans,
          znalezione_struktury: json.znalezione_struktury,
          wynik: json.wynik,
        };
        socket.emit("polowanie", data);
      }

      try {
        const files = fs.readdirSync(polowania_dir);

        files.forEach(async (file) => {
          if (file.split(".").pop() === "json") {
            await send_polowanie(file);
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
    if (socket.handshake.headers["subpage"] === "mapa") {
      log(`Socket **${socket.id}** connected on /mapa`);

      try {
        for (let i = 1; i < 4; i++) {
          //For all files
          const files = fs.readdirSync(`${struktury_dir}/${i}`);
          files.forEach(async (file) => {
            if (file.split(".").pop() === "json") {
              await send(i, file);
            }
          });
        }
      } catch (err) {
        console.log(err);
      }

      async function send(type, file) {
        //Read one file
        if ((await exists(struktury_dir + type + "/" + file)) == false) return;

        const content = await readFile(
          struktury_dir + type + "/" + file,
          "utf8"
        );

        if (!content) return;

        const json = JSON.parse(content);

        const data = {
          numer: json.numer,
          rodzaj: json.rodzaj,
          polowanie: json.polowanie,
          longitude: json.longitude,
          latitude: json.latitude,
        };

        socket.emit("struktura", data);
      }
    }
  });

  const port = 10000 || process.env.PORT;

  server.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
};
