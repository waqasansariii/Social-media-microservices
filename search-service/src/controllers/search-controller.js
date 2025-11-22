const Search = require("../models/Search");

const searchPostController = async(req,res)=>{
    logger.info(`Search endpoint hit  `);
    try{
        const {query}= req.query;
        const results = await Search.find({$text:{$search:query}},
            {score:{$meta:'textScore'}},
        )
        .sort({score:{$meta:'textScore'}}).limit(10);
        res.status(200).json({success:true,results});


    }
    catch(e){
        logger.error("Error in searchPostController:",e);
        res.status(500).json({success:false,message:"Error while Searching Post"});
    }
}
module.exports={searchPostController};