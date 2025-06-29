const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
const config = require("./config.js");
const polowanie = require("./schemas/polowanie_schema.js");
const struktura = require("./schemas/struktura_schema.js");
const last = require("./schemas/last_schema.js");
const sharp = require("sharp");

module.exports = (client) => {
  //Initialize

  let app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/client", express.static(__dirname + "/client"));

  app.get("/", function (req, res) {
    res.sendFile(__dirname + "/client/index.html");
  });
  app.use("/data", express.static(__dirname + "/data")); // Dodaj folder z plikiem GeoJSON
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
    maxHttpBufferSize: 10e9,
  });


  const uri = config.uri;
  const sentPhotos = new Set();

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

    async function all() {
      try {
        const sortedDocuments = await struktura.aggregate([
          {
            $addFields: {
              baseNumber: {
                $convert: {
                  input: { $arrayElemAt: [{ $split: ["$numer", "_"] }, 0] }, // Extract base number before "_"
                  to: "double",
                  onError: null, // Handle non-numeric values
                  onNull: null,
                },
              },
              suffix: {
                $ifNull: [
                  { $arrayElemAt: [{ $split: ["$numer", "_"] }, 1] }, // Extract suffix after "_"
                  "", // Assign empty string if suffix is null
                ],
              },
              suffixAsNumber: {
                $convert: {
                  input: { $arrayElemAt: [{ $split: ["$numer", "_"] }, 1] }, // Convert suffix to a number
                  to: "double",
                  onError: null, // Handle non-numeric suffixes
                  onNull: null, // Handle null suffixes
                },
              },
              prefix: {
                $regexFind: { input: "$numer", regex: /^[a-zA-Z]+/ }, // Extract prefix (e.g., "n" from "n1")
              },
              prefixNumber: {
                $convert: {
                  input: { $regexFind: { input: "$numer", regex: /[0-9]+$/ } }, // Extract numeric part of prefixed values
                  to: "double",
                  onError: null, // Handle non-numeric values
                  onNull: null, // Handle null values
                },
              },
              isNumeric: {
                $regexMatch: { input: "$numer", regex: /^[0-9]+(_[0-9]+)?$/ }, // Check if numer is numeric or numeric with suffix
              },
            },
          },
          {
            $sort: {
              isNumeric: -1, // Numeric values (true) first, prefixed values (false) later
              baseNumber: 1, // Sort by base number (numeric order)
              suffixAsNumber: 1, // Sort suffix numerically
              prefix: 1, // Sort by prefix alphabetically
              prefixNumber: 1, // Sort numeric part of prefixed values mathematically
              numer: 1, // Fallback for non-numeric values (alphabetical order)
            },
          },
        ]); // Use allowDiskUse for large datasets

        for (const element of sortedDocuments) {
          if (element) {
            send(element); // Send each document to the client
          }
        }

        console.log("Finished sending all structures with proper sorting");
      } catch (err) {
        console.error("Error fetching sorted structures:", err);
      }
    }

    if (socket.handshake.headers["subpage"] === "struktury") {
      log(`Socket **${socket.id}** connected on /struktury`);

      all(); //On page load

      //On search
      socket.on("search", function (data) {
        if (data.val == "" && data.rodzaj[3]) {
          all();
          return;
        }

        //Only one type
        if (data.val == "") {
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
        if (data == config.admin_pas) {
          logged = true;

          socket.emit("Authenticated");
          log(`Logged on: **${socket.id}**`);
        }
      });

      socket.on("add_struktura", async function (data) {
        if (!logged) {
          log(`Unauthorized attempt to add struktura on: **${socket.id}**`);
          return;
        }

        log(`Starting adding struktura on: **${socket.id}**`);
        let number = 0;
        let nazwa = data.numer;

        if (data.numer == "") {
          // Read last "nieponumerowana" struktura number
          const result = await last.findOne({ rodzaj: data.rodzaj });
          number = result ? result.numer + 1 : 1;

          await last.deleteMany({ rodzaj: data.rodzaj });

          const newLast = new last({
            numer: number,
            rodzaj: data.rodzaj,
          });

          await newLast.save().catch((err) => console.error(err));

          nazwa = "n" + number.toString();
        }

        // Check if a struktura with the same numer already exists
        let existingStruktura = await struktura.findOne({ numer: nazwa });
        let suffix = 1;
        while (existingStruktura) {
          if (data.numer == "") {
            nazwa = `n${number}_${suffix}`;
          } else {
            nazwa = `${data.numer}_${suffix}`;
          }
          suffix++;
          existingStruktura = await struktura.findOne({ numer: nazwa });
        }

        log(`Struktura will be added as ${nazwa} on: **${socket.id}**`);

        async function compressImage(base64Image) {
          try {
            const buffer = Buffer.from(base64Image, "base64");
            const compressedBuffer = await sharp(buffer)
              .rotate()
              .resize({ width: 270, height: 370 })
              .jpeg({ quality: 80 })
              .toBuffer();
            return compressedBuffer.toString("base64");
          } catch (err) {
            console.error("Error during image compression:", err);
            throw err; // Re-throw the error if needed
          }
        }

        async function compressImageToTargetSize(base64Image, targetSizeMB = 7.9) {
          const targetSizeBytes = targetSizeMB * 1024 * 1024; // Convert MB to bytes
          const buffer = Buffer.from(base64Image, "base64");

          // Get metadata to calculate scaling factor
          const metadata = await sharp(buffer).metadata();
          const currentSizeBytes = buffer.length;

          if (currentSizeBytes <= targetSizeBytes) {
            // If the image is already within the target size, return it as is
            return buffer.toString("base64");
          }

          // Calculate scaling factor based on size ratio
          const scalingFactor = Math.sqrt(targetSizeBytes / currentSizeBytes);

          // Resize the image using the scaling factor
          const resizedBuffer = await sharp(buffer)
            .rotate() // Rotate to correct orientation
            .resize({
              width: Math.floor(metadata.width * scalingFactor),
              height: Math.floor(metadata.height * scalingFactor),
            })
            .jpeg({ quality: 80 }) // Adjust quality if needed
            .toBuffer();

          return resizedBuffer.toString("base64");
        }

        raw_data = data.img.split(";base64,").pop();

        const compressedPhoto = await compressImage(raw_data);
        const resizedPhoto = await compressImageToTargetSize(raw_data, 7.9); // Resize to fit within 8MB

        const newStruktura = new struktura({
          numer: nazwa,
          rodzaj: data.rodzaj,
          longitude: data.longitude,
          latitude: data.latitude,
          polowanie: data.polowanie,
          photo: compressedPhoto,
        });

        await newStruktura.save().catch((err) => console.error(err));

        let discord = `🔢Nr. ${data.numer}`;
        if (data.numer == "") discord = "🔢 Bez numeru";

        if (data.dc_ann === true) {
          if (sentPhotos.has(nazwa)) {
            log(`Photo for ${nazwa} already sent.`);
            return;
          }

          const tempFileName = `temp_${Date.now()}.jpg`;
          fs.writeFileSync(tempFileName, resizedPhoto, { encoding: "base64" });

          const channelMap = {
            "1": "999685658572496906",
            "2": "999685864919683122",
            "3": "1004823240851599420",
          };

          const channelId = channelMap[data.rodzaj];
          if (channelId) {
            client.channels.cache.get(channelId).send(discord);
            client.channels.cache.get(channelId).send({ files: [tempFileName] }).then(() => {
              fs.unlinkSync(tempFileName); // Delete the temporary file
              sentPhotos.add(nazwa);
            }).catch(err => {
              log("Error sending file to Discord:", err);
            });
          }
        }

        log(`Added struktura *${nazwa}* on: **${socket.id}**`);
      });

      socket.on("del_struktura", async function (data) {
        if (!logged) {
          log(`Unauthorized attempt to delete struktura on: **${socket.id}**`);
          return;
        }

        await struktura.deleteMany({ numer: data.numer, rodzaj: data.rodzaj });
        log(`Deleted struktura *${data.numer}* on: **${socket.id}**`);
      });

      socket.on("add_polowanie", function (data) {
        if (!logged) {
          log(`Unauthorized attempt to add polowanie on: **${socket.id}**`);
          return;
        }

        const newPolowanie = new polowanie({
          numer: data.numer,
          data: data.data,
          teren: data.teren,
          mysliwi: data.mysliwi,
          budzet: data.budzet,
          dystans: data.dystans,
          znalezione_struktury: data.znalezione_struktury,
          wynik: data.wynik,
          dc_ann: data.dc_ann,
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
        if (data.dc_ann == true) {
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
        }

        log(`Added polowanie *${data.numer}* on: **${socket.id}**`);
      });

      socket.on("del_polowanie", async function (data) {
        if (!logged) {
          log(`Unauthorized attempt to delete polowanie on: **${socket.id}**`);
          return;
        }

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

      allPolowania();

      async function allPolowania() {
        try {
          // Await the result of the distinct method
          const distinctPolowanieValues = await polowanie.distinct("numer");
          console.log("Sending unique polowanias");

          // Iterate over the resolved array
          for (const numer of distinctPolowanieValues) {
            const element = await polowanie.findOne({ numer });
            if (element) {
              send_polowanie(element);
            }
          }
        } catch (err) {
          console.error("Error fetching unique polowanias:", err);
        }
      }
    }
    if (socket.handshake.headers["subpage"] === "mapa") {
      log(`Socket **${socket.id}** connected on /mapa`);

      async function sendWithoutPhoto(element) {
        console.log(`Sending struktura without photo: ${element.numer}`); // Debug log
        const data = {
          numer: element.numer,
          rodzaj: element.rodzaj,
          polowanie: element.polowanie,
          longitude: element.longitude,
          latitude: element.latitude,
        };
        socket.emit("struktura", data);
      }

      async function allWithoutPhoto() {
        console.log("Sending all structures without photo");

        try {
          // Fetch all documents excluding the photo field
          const allStruktura = await struktura.find({}, { photo: 0 }); // Exclude photo field using projection

          for (const element of allStruktura) {
            sendWithoutPhoto(element); // Send each document to the client
          }

          console.log("Finished sending all structures without photo");
        } catch (err) {
          console.error("Error fetching structures without photo:", err);
        }
      }

      allWithoutPhoto();
    }
  });

  const port = process.env.PORT || 3000

  httpServer.listen(port, async () => {
    console.log(`Example app listening on port ${port}`);

    const polowaniaCount = await polowanie.countDocuments();
    const strukturyCount = await struktura.countDocuments();

    fs.writeFileSync(
      __dirname + "/data/data.json",
      JSON.stringify({ polowania: polowaniaCount, struktury: strukturyCount }, null, 2),
      "utf8"
    );
  });
};
