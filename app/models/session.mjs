// get an instance of mongoose and mongoose.Schema
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
export default mongoose.model('Session', new Schema({
    token: {type: String, unique: true, required: true, dropDups: true},
    authLevel: String,
    data: String
}, {timestamps: true}));