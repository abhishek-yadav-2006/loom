import  mongoose, { mongo, Mongoose , Schema } from "mongoose";
import { email, string } from "zod";

const userSchema = new mongoose.Schema({
    username : {
        type  : string,
        unique : true
    },

    email : string,
    password: string
})


export const userModel =  mongoose.model('userModel' , userSchema)