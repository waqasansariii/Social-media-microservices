const Media = require('../models/Media');
const logger = require('../utils/logger');

const uploadMedia = async(req,res)=>{
    logger.info('Starting media upload process');
    try{
        if(!req.file){
            logger.error('No file provided in the request');
            return res.status(400).json({message:'No file provided'});
        }
        const {originalname, mimetype, buffer} = req.file;
        const userId = req.user.userId;
        logger.info(`Received file: ${originalname} with MIME type: ${mimetype}`);
        logger.info('uploading to cloudinary starting...');

        const cloudinaryUploadedRseult = await uploadMediaToCloudinary(req.file);
        logger.info(`uploading to cloudinary completed. Public id: ${cloudinaryUploadedRseult.public_id}`);

        const newlyCreatedMedia = new Media({

            publicId:cloudinaryUploadedRseult.public_id,
            OriginalName:originalname,
            mediaType:mimetype,
            userId:userId,
            url: cloudinaryUploadedRseult.secure_url,
            user: userId

        });

        await newlyCreatedMedia.save();
        logger.info(`Media metadata saved to database for media ID: ${newlyCreatedMedia._id}`);
        res.status(201).json({message:'Media uploaded successfully', media:newlyCreatedMedia});
        // next();

    }
    catch(e){
        logger.error('Error during media upload process:',e);
        res.status(500).json({message:'Internal Server Error'});   
    }
};
const getAllMedia = async(req,res)=>{
    try{
    const results = await Media.find({userId:req.user.userId}).sort({createdAt:-1});
    res.status(200).json({message:'Media fetched successfully',media:results});

    }catch(e){
        logger.error('Error fetching media:',e);   
        res.status(500).json({message:'Error fetching media'});
    }
}
module.exports = {uploadMedia,getAllMedia};
