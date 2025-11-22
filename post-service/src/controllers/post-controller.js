const logger = require('../utils/logger');
const Post = require('../models/Post');
const { validateCreatePost } = require('../utils/validation');

async function invalidateCache(req,input){
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);
  logger.info("Cache invalidated for key %s due to %s",cachedKey,input);


  const keys = await req.redisClient.keys("posts:*");
  if(keys.length>0){
    await req.redisClient.del(keys);
    logger.info("Cache invalidated for pattern posts:* due to %s",input);

  }

}

const createPost = async (req, res) => {
  logger.info('Create post endpoint hit');

  try {
    const { error } = validateCreatePost(req.body);
        if (error) {
          logger.warn("Validation error: %s", error.details[0].message);
          return res
            .status(400)
            .json({ success: false, message: error.details[0].message });
        }

        
    const { content, mediaIds } = req.body;
    const userId = req.headers['x-user-id']; // ✅ coming from API Gateway

    if (!userId) {
      logger.warn('Missing x-user-id header');
      return res.status(400).json({ success: false, message: 'User ID missing' });
    }

    const newlyCreatedPost = new Post({
      user: userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    await publishEvent('post.create',{
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt:newlyCreatedPost.createdAt

    })
    await invalidateCache(req,newlyCreatedPost._id.toString());
    logger.info('Post created successfully');
    res.status(201).json({
      success: true,
      post: newlyCreatedPost,
      message: 'Post created successfully',
    });
  } catch (e) {
    logger.error('Error creating post', e);
    res.status(500).json({ success: false, message: 'Error creating post' });
  }
};
const getAllPosts = async(req,res)=>{
  try{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page-1)*limit;

    const cachekey = `posts:${page}:${limit}`
    const cachedPosts = await req.redisClient.get(cachekey);
    if(cachedPosts){
      return res.json(JSON.parse(cachedPosts));
    }    
    const posts = await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit);
    const totalNoOfPosts = await Post.countDocuments()
    const result = {posts,currentpage:page, totalPages:Math.ceil(totalNoOfPosts/limit)}
    // save your posts in redis cache
    await req.redisClient.setex(cachekey,300,JSON.stringify(result));
    res.json(result)


  }
  catch(e){
    logger.error("Error fetching posts",e);
    res.status(500).json({
      success:false,
      message:"Error fetching posts"

    })
  }
}

const getPost = async (req, res) => {
  try {
    // const posts = await Post.find().sort({ createdAt: -1 });
    // res.status(200).json({ success: true, posts });
    const postId = req.params.id;
    const cachekey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cachekey);
    if(cachedPost){
      return res.json(JSON.parse(cachedPost));
    }
    const singlePostDetailsbyId = await Post.findById(postId);
    if(!singlePostDetailsbyId){
      return res.status(404).json({success:false,message:"Post not found"})
    }
    await req.redisClient.setex(cachekey,300,JSON.stringify(singlePostDetailsbyId));
    res.status(200).json({ success: true, post: singlePostDetailsbyId });



  } catch (e) {
    logger.error('Error fetching posts', e);
    res.status(500).json({ success: false, message: 'Error fetching posts' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    })
    if(!post){
      logger.warn(`Post not found or unauthorized delete attempt for post ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });

    }
    // publish post delete
    await publishEvent('POST_DELETED', { postId: post._id.toString(), userId: req.user.userId,mediaIds:post.mediaIds}); 
    
    await invalidateCache(req,req.params.id);
    res.json({
      message: 'Post deleted successfully',
    })



    const postId = req.params.id;
    await Post.findByIdAndDelete(postId);
    logger.info(`Post ${postId} deleted`);
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (e) {
    logger.error('Error deleting post', e);
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
