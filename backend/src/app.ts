import dotenv, { parse } from 'dotenv'
dotenv.config()
import express from "express";
import mongoose from "mongoose";
import z from 'zod'
import { userModel } from './db.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { id } from 'zod/locales';
import { jwt_password } from './config.js';


const app = express();

app.use(express.json());



const dburl = process.env.DB_URL ?? " "

async function main() {
  await mongoose.connect(dburl)
}

main().then(() => {
  console.log('db connected!')
}).catch((e) => {
  console.log('err while connecting to db', e)
})

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/v1/signup", async (req, res) => {


  try {

    const { username, email, password } = req.body
    console.log("username", username)


    const requiredBody = z.object({
      username: z.string(),
      email: z.string().email(),
      password: z.string()
    })

    const parsedBodywithSuccess = requiredBody.safeParse(req.body)
    if (!parsedBodywithSuccess.success) {
      res.status(400).json({
        message: "Incorrect format",
        error: parsedBodywithSuccess.error
      })
    }

    const existingUser = await userModel.findOne({ username })

    if (existingUser) {
      res.json({
        message: "user already exist"
      })

      return
    }

    const hashedpassword = await bcrypt.hash(password, 10)

    const newuser = await userModel.create({

      username: username,
      password: hashedpassword,
      email: email
    })
    console.log(newuser);

    res.status(200).json({
      message: "user created succesfully!"
    })


  } catch (e) {
    console.log(e)
    res.json({
      message: "err while creating user",

    })
  }
})





app.post("/api/v1/signin", async (req, res) => {


  
  try {

    const {username , password}  = req.body;
    const user = await userModel.findOne({ username });

    if (!user || !user.password) {
      res.status(403).json({
        message: "User not found or missing credentials",
      });
      return
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log(isPasswordCorrect)

    if(isPasswordCorrect){

      const token =  jwt.sign({id : user.id } , jwt_password)
      res.json({
        message: "user succesfully logged in ",
        token
      })
      
    }else{
      res.json({
        mesage : "Incorrect Credentials!"
      })
    }


  } catch (e) {
    res.json({
      message: "err while log in "
    })
  }

})

export default app;
