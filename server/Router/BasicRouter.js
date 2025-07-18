const express=require('express')
const BasicRouter=express.Router();
const {BasicController}=require('../controller/BasicController')
BasicRouter.get("/",BasicController)

module.exports={BasicRouter}

