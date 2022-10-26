const shortid =require("shortid");
const fs =require("fs");
const {AuthenticationError} = require('apollo-server');
const checkAuth = require('../../utils/check_auth');
const Post = require('../../models/Post');
const User = require('../../models/User');

const storeUpload = async ({ stream }) => {
  // aseq2
  const id = shortid.generate();
  const path = `images/${id}`;

  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on("finish", () => resolve({ id, path }))
      .on("error", reject)
  );
};
const processUpload = async (upload) => {
  const { stream, filename } = await upload;
  const { id } = await storeUpload({ stream });
  return id;
};

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getFollowingPosts(_,{username},context){
      try{
        const user = checkAuth(context)
        const getUser = await User.findOne({username:username});
        if(getUser){
          let followingList = getUser.followings;
          let postList = [];
          for (var i = 0; i < followingList.length; i++) {
            const posts = await Post.find({username:followingList[i]});
            for (var i = 0; i < posts.length; i++) {
              postList.add(posts[i]);
            }
          }
          const sortedPostList = postList.sort(
            (objA, objB) => Number(objB.createdAt) - Number(objA.createdAt),
          );
          return sortedPostList;
        }else{
          throw new UserInputError('A user with the username is not found');
        }
      }
      catch (err){
        throw new Error(err)
      }
    },
    async getUserPosts(_,{username}){
      try {

        const getUser = await User.findOne({username:username});
        if(getUser){
          const posts = await Post.find({username:username}).sort({ createdAt: -1 });
          return posts;
        }else{
          throw new UserInputError('A user with the username is not found');
        }
      } catch (err) {
          console.log(err)
          throw new Error(err)
      }
    },
    async getPost(_, {postId}){
      try {
        const post = await Post.findById(postId);
        if(post){
          return post;
        }
        else{
          throw new Error('Post not found');
        }
      }
      catch (err){
        throw new Error(err)
      }
    }
  },
  Mutation:{
    async createPost(_, {body, picture}, context){
      console.log(picture)
      const user = checkAuth(context);
      if (body.trim() === ''){
        throw new Error('Post body must not be empty');
      }
      let pictureUrl;
      if (picture){
        const {createReadStream, filename, mimetype, encoding} = await picture;
        const stream = createReadStream()
        const pathName= path.join(__dirname,`/client/public/images/${filename}`)
        await stream.pipe(fs.createWriteStream(pathName))
        pictureUrl = `http://localhost:3000/images/${filename}`
        // pictureUrl = await processUpload(picture);
      }
      else{
        pictureUrl = null;
      }
      const newPost = new Post({
        body,
        pictureUrl,
        user:user.id,
        username:user.username,
        createdAt: new Date().toISOString(),
        edited:false,
      });
      const post = await newPost.save();
      return post;
    },
    async deletePost(_, {postId}, context){
      const user = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if(user.username === post.username){
          await post.delete();
          return 'Post deleted successfully';
        }
        else{
          throw new AuthenticationError('Action not allowed');
        }
      }catch(err){
        throw new Error(err);
      }
    },
    async likePost(_,{postId},context){
      const {username} = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if(post){
          if (post.likes.find((like)=>like.username === username)){
            // post already liked so unlike it
            post.likes = post.likes.filter((like) => like.username !== username);
          }else{
            // not liked by the user, add a like to the post
            post.likes.push({username,createdAt:new Date().toISOString()});
          }
          await post.save();
          return post;
        }else{
          throw new UserInputError('Post not found');
        }
      } catch (err) {
          throw new Error(err)
      }
    },
    async editPost(_, {postId, body}, context){
      const {username} = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if(post){
          // post found and time to update it
          if(username !== post.username){
            throw new AuthenticationError('Action not allowed');
          }
          if(body.trim()===''){
            throw new UserInputError('Empty comment',{
              errors:{
                body:'Comment body can not be empty'
              }
            });
          }
          post.body = body;
          post.edited = true;
          await post.save();
          return post;
        }else{
          throw new UserInputError('Post not found');
        }
      } catch (err) {
          throw new Error(err)
      }
    },
  }
};
