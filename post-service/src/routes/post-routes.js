const express = require('express');
const { createPost, getPost, deletePost, getAllPosts } = require('../controllers/post-controller');

const router = express.Router();

// Gateway already authenticates; no need for authMiddleware here
router.post('/create-post', createPost);
router.get('/:id', getPost);
router.delete('/:id', deletePost);
router.get("/all-posts",getAllPosts);

module.exports = router;
