
const Media = require('../models/Media.js');
const logger = require('../utils/logger');
const handlePostDeleted = async(event)=>{
    console.log(event,"event in media service");
    const {post,mediaIds} = event;
    try{
        const mediaToDelte = await Media.find({_id:{$in:mediaIds}});
        for (const media of mediaToDelte) {
            await deleteMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id);
            logger.info(`Deleted media ${media._id} associated with deleted post ${post.postId}`);
        }
        logger.info(`Handled POST_DELETED event for post ${post.postId} successfully`);

    }
    catch(err){
        logger.error("Error handling POST_DELETED event in media service",err); 
        throw err;
    }
};
module.exports = {handlePostDeleted};