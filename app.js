//jshint esversion:6
require('dotenv').config();

const express=require("express");
const bodyParser=require("body-parser");
const ejs =require("ejs");
const mongoose=require("mongoose")
const app=express();
const encrypt=require("mongoose-encryption");
app.use(express.static("public"));
app.set('view engine','ejs');
mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});
var secret=process.env.SECRET;
userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User= new mongoose.model("User",userSchema);

app.use(bodyParser.urlencoded({
    extended:true
}));

app.get("/",function(req,res){
    res.render("home")
})

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",async function(req,res){
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    })

    try{
        await newUser.save();
        res.render("secrets");

    }
    catch(err){
        res.send("Save unsuccesfull");
    }

})

app.post("/login",async function(req,res){
    
    try{
    const username=req.body.username;
    const password=req.body.password;
    const foundUser= await User.findOne({email:username});
    if(foundUser.password===password)
    {
        res.render("secrets");
        console.log("Logged in successfully")
    }
    else{
        res.send("INCORRECT CREDENTIALS");
    }
    }catch(err)
    {
        console.log(err);
    }
});

app.listen(3000,function(){
    console.log("Server started at port 3000")
})