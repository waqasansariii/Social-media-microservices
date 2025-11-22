const express = require('express');
const router = express.Router();
// const {registerUser,loginUser} = require('../controllers/identity-controller');
const {registerUser,loginUser,logoutUser,refreshTokenUser} = require('../controllers/identity-controller');
console.log("Loaded controller:", {registerUser,loginUser,logoutUser,refreshTokenUser});

router.post('/register',registerUser);
router.post('/login',loginUser);    
router.post('/logout',logoutUser);
router.post("/refresh-token",refreshTokenUser);

module.exports = router;