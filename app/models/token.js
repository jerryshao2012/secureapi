// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Token', new Schema({
    token: {type: String, unique: true, required: true, dropDups: true},
    data: String
}, {timestamps: true}));