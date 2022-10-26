const { AuthenticationError, UserInputError } = require('apollo-server');

const checkAuth = require('../../utils/check_auth');
const Post = require('../../models/Post');

module.exports = {
  Mutation:{
    async createComment(_, {postId, body}, context){
      const {username} = checkAuth(context);
      if(body.trim()===''){
        throw new UserInputError('Empty comment',{
          errors:{
            body:'Comment body can not be empty'
          }
        });
      }
      try {
        const post = await Post.findById(postId);
        if (post){
          post.comments.unshift({
            body,
            username,
            createdAt:new Date().toISOString(),
            edit:false,
            likes:[],
          });
          await post.save();
          return post;
        }else{
          throw new UserInputError('Post not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    async deleteComment(_, {postId, commentId}, context){
      const {username} = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if (post){
          const commentIndex = post.comments.findIndex((c)=> c.id === commentId);
          console.log(commentIndex)
          if (post.comments[commentIndex].username === username){
            post.comments.splice(commentIndex,1);
            await post.save();
            return post;
          }else{
            throw new AuthenticationError('Action not allowed')
          }
        }else{
          throw new UserInputError('Post not found');
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    async editComment(_, {postId, commentId, commentBody}, context){
      const {username} = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if (post){
          const commentIndex = post.comments.findIndex((c)=> c.id === commentId);
          if (post.comments[commentIndex].username === username){
            // check the body and see if comment is going to be updated
            if(commentBody.trim()===''){
              throw new UserInputError('Empty comment',{
                errors:{
                  body:'Comment body can not be empty'
                }
              });
            }
            // if it isn't empty edit it
            const comment = post.comments[commentIndex];
            post.comments[commentIndex] = {
              body:commentBody,
              username:comment.username,
              createdAt:comment.createdAt,
              edited:true,
              likes:comment.likes,
            }
            //save the updated post
            await post.save();
            return post;
          }else{
            throw new AuthenticationError('Action not allowed')
          }
        }else{
          throw new UserInputError('Post not found');
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    async likeComment(_,{postId, commentId},context){
      const {username} = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if(post){

          const commentIndex = post.comments.findIndex((c)=> c.id === commentId);
          const comment = post.comments[commentIndex]

          if (comment.likes.find((like)=>like.username === username)){
            // post already liked so unlike it

            comment.likes = comment.likes.filter((like) => like.username !== username);
          }else{
            // not liked by the user, add a like to the post
            comment.likes.push({username,createdAt:new Date().toISOString()});
          }
          post.comments[commentIndex] = comment
          await post.save();
          return post;
        }else{
          throw new UserInputError('Post not found');
        }

      } catch (err) {
        console.log(err)
        throw new Error(err)
      }
    },
  }
};
