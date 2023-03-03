const express = require("express");
var cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const log = require("../bot/utils/log");
const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
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
    log("connected socket:" + socket.handshake.address);

    const fs = require("fs");
    const path = require("path");

    const { promisify } = require("util");
    const readFile = promisify(fs.readFile);
    const exists = promisify(fs.exists);

    data_dir = "./data/";
    struktury_dir = data_dir + "struktury/";
    polowania_dir = data_dir + "polowania/";

    if (socket.handshake.headers["subpage"] === "struktury") {
      async function getBuffer(filePath) {
        const isFile = await exists(filePath);
        if (!isFile) return "";
        return readFile(filePath);
      }

      async function send(type, file, fun) {

        if(await exists(struktury_dir + type + "/" + file) == false) return

        const content = await readFile(struktury_dir + type + "/" + file, "utf8");

        if (!content) return;

        const json = JSON.parse(content);
        const img_path = struktury_dir +  + type + "/" + path.parse(file).name;

        const buf1 = await getBuffer(`${img_path}.jpg`);
        const buf2 = await getBuffer(`${img_path}.png`);

        const data = {
          numer: json.numer,
          buffer: (buf1 || buf2).toString("base64"),
          rodzaj: json.rodzaj,
          polowanie: json.polowanie,
        };

        fun(data);
        //console.log(data.numer)
        //socket.emit("struktura", data);
      }

      async function files(type, fun) {
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
        files(i, function (file) {
          send(i, file, function (data) {
            socket.emit("struktura", data);
          });
        });
      }

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
              const content = await readFile(struktury_dir + i + "/"+ file, "utf8");
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
      logged = false;

      socket.on("login", function (data) {
        log("Try login on: " + socket.handshake.address);
        if (data == "ambony11") {
          logged = true;
          const files = fs.readdirSync(polowania_dir);

          socket.emit("Authenticated", files);
          log("Logged on: " + socket.handshake.address);
        }
      });

      socket.on("add_struktura", function (data) {
        nazwa = data.numer;

        if (nazwa == "") {
          last_file = `${data_dir}last.txt`;
          content = fs.readFileSync(last_file);
          nazwa = parseInt(content);
          nazwa += 1;
          nazwa = nazwa.toString();
          fs.writeFileSync(last_file, nazwa);
          nazwa = "n" + nazwa;
        }

        jsonString = {
          numer: nazwa,
          rodzaj: data.rodzaj,
          polowanie: data.polowanie,
        };

        let base64 = data.img.split(";base64,").pop();

        //log(socket.handshake.address + "created: " + )

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
            client.channels.cache
              .get(`999685658572496906`)
              .send(numer);
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
            client.channels.cache
              .get(`999685864919683122`)
              .send(numer);
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
            client.channels.cache
              .get(`1004823240851599420`)
              .send(numer);
            client.channels.cache.get(`1004823240851599420`).send({
              files: [`${struktury_dir}3/${nazwa}.jpg`],
            });
          }, 1000);
        }
      });

      socket.on("del_struktura", function(data) {
        fs.unlinkSync(`${struktury_dir}${data.rodzaj}/${data.numer}.json`);
        fs.unlinkSync(`${struktury_dir}${data.rodzaj}/${data.numer}.jpg`);
      })

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
                value: data.wynik,
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
      });

      socket.on("del_polowanie", function(data) {
        fs.unlinkSync(`${polowania_dir}${data}.json`);
      })

      setTimeout(() => {
        if (!logged) {
          socket.disconnect(true);
          socket.client._remove(socket.id);
        }
      }, 30 * 1000);
    }
  });

  const port = 10000 || process.env.PORT;

  server.listen(port, () => {
    log(`Listening on port ${port}`);
  });
};
