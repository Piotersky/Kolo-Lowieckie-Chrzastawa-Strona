const moment = require("moment");

module.exports = (text) => { 
    console.log(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] ${text}`) 
}