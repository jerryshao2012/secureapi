// get an instance of mongoose and mongoose.Schema
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Get our config file
import * as config from '../../config';

// set up a mongoose model and pass it using module.exports
var userSchema = new Schema({
    userName: {type: String, unique: true, required: true, dropDups: true},
    password: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    scope: String,
    disabled: {type: Boolean, required: true}
}, {timestamps: true});

userSchema.methods.validPassword = function (pwd) {
    if (!pwd) return false;
    return config.hash(pwd) === this.password;
};

//module.exports = mongoose.model('User', userSchema);
export default mongoose.model('User', userSchema);