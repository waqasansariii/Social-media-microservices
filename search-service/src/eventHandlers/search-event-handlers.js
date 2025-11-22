async function  handlePostCreate(event){
    try{
        const newSearchPost = new Search({
            postId: event.postId,
            userId: event.userId,
            content: event.content,
            createdAt: event.createdAt
        })
        await newSearchPost.save();
        logger.info(`Handled POST_CREATED event for post ${event.postId},${newSearchPost._id} successfully`);




    }
    catch(err){
        logger.error("Error handling POST_CREATED event in media service",err);
        throw err;
    }
}

async function handlePostDeleted(event){
    try{
        await Search.findOneAndDelete({postId:event.postId});
        logger.info(`Handled POST_DELETED event for post ${event.postId} successfully`);



    }
    catch(err){
        logger.error("Error handling POST_DELETED event in search service",err);
        throw err;
    }
}

module.exports = {handlePostCreate};