const logger = require("../utils/logger");
const { validateRegistration,validateLogin } = require("../utils/validation");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const RefreshToken = require("../models/RefreshToken");
// user registereation
const registerUser = async (req, res) => {
  logger.info("Regsteration endpoint hit....");
  try {
    // validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error: %s", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { email, password, username } = req.body;
    // check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn(
        "User already exists with email: %s or username: %s",
        email,
        username
      );
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    user = new User({ username, email, password });
    await user.save();
    const { accessToken, refreshToken } = await generateToken(user);
    logger.info("User registered successfully with id: %s", user._id);
    // return res
    //   .status(201)
    //   .json({ success: true, message: "User registered successfully" });

    
     return res.status(201).json({
        success: true,
        message: "User registered successfully",
        accessToken,
        refreshToken,
      });
  } catch (e) {
    logger.error("Error in registration: %s", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// user login
const loginUser = async (req, res) => {
  logger.info("Login endpoint hit....");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error: %s", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid credentials for email: %s", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    //  user valid password or not
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password for email: %s", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const {accessToken,refreshToken} = await generateToken(user);
    res.json({accessToken,refreshToken,userId:user._id});

  } 
  catch (e) {
    logger.error("Error in Login: %s", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// refresh token
const refreshTokenUser = async (req,res)=>{
  logger.info("Login endpoint hit....")
  try{
    const {refreshToken} = req.body;
    if(!refreshToken){
      logger.warn("Refresh token missing");
      return res.status(400).json({success:false,message:"Refresh token missing"});
    }
    const storedToken = await RefreshToken.findOne({token:refreshToken});
    if(!storedToken || storedToken.expiryDate < new Date()){
      logger.warn("Invalid or expired refresh token");
      return res.status(400).json({success:false,message:"Invalid or expired refresh token"}); 
    }
    const user = await User.findById(storedToken.user);
    if(!user){
      logger.warn("User not found for the given refresh token");
      return res.status(400).json({success:false,message:"User not found"});
    }
    const {accessToken: newAccessToken,refreshToken: newRefreshToken} = await generateToken(user);
    res.json({accessToken:newAccessToken,refreshToken:newRefreshToken});

    // delete the old refresh token
  await RefreshToken.deleteOne({_id:storedToken._id});
  res.json({accessToken:newAccessToken,refreshToken:newRefreshToken});


  }
  

  catch(e){
    logger.error("Refresh Token error occurred: %s", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// logout
const logoutUser = async (req,res)=>{
  logger.info("Logout endpoint hit....")
  try{
    const {refreshToken} = req.body;
    if(!refreshToken){
      logger.warn("Refresh token missing");
      return res.status(400).json({success:false,message:"Refresh token missing"});
    }
    await RefreshToken.deleteOne({token:refreshToken});
    logger.info("Refresh token deleted successfully for logout" );
    res.json({success:true,message:"Logged out successfully"});


  }
  catch(e){
    logger.error("Error while logging out: %s", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { registerUser,loginUser,refreshTokenUser,logoutUser };
