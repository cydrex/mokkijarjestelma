const mongoose = require('mongoose');
//mongoose.set('debug', true);
const mokkiSchema = new mongoose.Schema({
    id: String,
    approved: { type: Boolean, default: false },
    yhteystiedot: String,
    nimi: String,
    perustiedot: String,
    huoneet: String,
    varustelu: String,
    koko: String,
    sijainti: String,
    etaisyydet: String,
    hinta: Number,
    mokkikuvat: [{ path: String }]
});
module.exports = mongoose.model("mokkidb", mokkiSchema);