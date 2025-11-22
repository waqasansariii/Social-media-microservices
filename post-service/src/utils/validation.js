const joi = require('joi');
const validateCreatePost = (data)=>{
    const validateCreatePost= joi.object({
        content:joi.string().min(1).max(5000).required(),
        mediaIds: joi.array().items(joi.string()).optional()
        
    })
    return validateCreatePost.validate(data);
}

module.exports = {validateCreatePost};