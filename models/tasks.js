const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title : {
        type:String,
        required:true
    },
    description : String,

    priority:{
        type : String,
        enum : [
            "Low", "Medium","High"
        ]
    },

    userId:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('Task', taskSchema);