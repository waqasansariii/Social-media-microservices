const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    publicId:{
        type:String,
        required:true,
    },
    OriginalName:{
        type:String,
        required:true,
    }
    ,
    mediaType :{
        type:String,
        required:true,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    }
},{timestamps:true});

const Media = mongoose.model('Media',mediaSchema);
module.exports = Media;