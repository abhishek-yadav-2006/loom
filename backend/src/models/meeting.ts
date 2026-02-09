import mongoose from 'mongoose'

const meetingSchema = new mongoose.Schema({
    meetingId : {
        type : String,
        unique : true
    } ,
    host : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }
})

const Meeting = mongoose.model('Meeting' , meetingSchema);
module.exports = Meeting;