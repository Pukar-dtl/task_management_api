const mongoose = require('mongoose');
async function connectMongo(){
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("mongoose connected");
    }
    catch(error){
        console.log(error.message);
    }
}

module.exports = connectMongo;
