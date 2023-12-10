const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    }
})
module.exports = mongoose.model('User', userSchema)
