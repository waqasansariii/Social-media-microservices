const mongoose = require('mongoose');

const searchPostSchema = new mongoose.Schema({
    postId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    userId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

    
},{timestamps:true});
searchPostSchema.index({title:'text',content:'text'});
searchPostSchema.index({createdAt:-1});
const Search = mongoose.model('SearchPost', searchPostSchema);
module.exports = Search;
