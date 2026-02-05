import express from "express";
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/login", (req,res)=> {
  
})
app.get("/signup", (req,res)=> {

   
})

export default app;
