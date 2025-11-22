const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateToken = (req,res,next)=>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token){
        logger.warn('Access attempted without token');
        return res.status(401).json({message:'Access token missing',success:false});
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  if (err) {
    logger.warn('Invalid or expired token used for access');
    return res.status(403).json({ message: 'Invalid or expired token', success: false }); // use 403 instead of 429
  }
  req.user = user;
  next();
});



}
module.exports = validateToken;