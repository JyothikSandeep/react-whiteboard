const express=require('express');
const app=express()

const {BasicRouter}=require("./Router/BasicRouter")
app.use("/",BasicRouter);

app.listen(8000,()=>{
    console.log("server is listening to the port");
    
})