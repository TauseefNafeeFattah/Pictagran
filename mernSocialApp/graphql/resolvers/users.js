const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server');
const checkAuth = require('../../utils/check_auth');
const {AuthenticationError} = require('apollo-server');


const {
  validateRegisterInput,
  validateLoginInput
} = require('../../utils/validators');
const SECRET_KEY = process.env.SECRET_KEY;

const User = require('../../models/User');

function generateToken(user){
  return jwt.sign(
    {
      id: user.id,
      emai: user.email,
      username: user.username
    },
    SECRET_KEY,{expiresIn:'1h'}
  );
}

module.exports = {
  Query:{
    async getFollowers(_,{username},context){
      try {
        const user = checkAuth(context)
        const getFollowerUser = await User.findOne({username:username});
        if(getFollowerUser){
          return getFollowerUser.followers;
        }else{
          throw new UserInputError('A user with the username is not found');
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async searchUser(_,{username}){
      try {
        if(username.trim()===''){
          return [];
        }
        const users = await User.find({username:{ "$regex": username, "$options": "i" }}).limit(5);
        return users;
      } catch (err) {
        throw new Error(err)
      }
    },
    async getFollowings(_,{username},context){
      try {
        const user = checkAuth(context)
        const getFollowingsUser = await User.findOne({username:username});
        if(getFollowingsUser){
          return getFollowingsUser.followings;
        }else{
          throw new UserInputError('A user with the username is not found');
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    async getUserInfo(_,{username},context){
      const currentUser = checkAuth(context)
      try {
        const user = await User.findOne({username:username});
        if(user){
          return user
        }
        else{
          throw new UserInputError('User with the username is not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
  },
  Mutation : {
      async login(_,{username, password}){
        const {errors, valid} = validateLoginInput(username,password);

        if(!valid){
          throw new UserInputError('Errors',{errors});
        }
        const user = await User.findOne({username});
        if (!user){
          errors.general = 'User not found';
          throw new UserInputError('User not found',{errors});
        }
        // console.log(password)
        // console.log(user.password)
        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
          errors.general = 'Wrong password';
          throw new UserInputError('Wrong password',{errors});
        }
        const token = generateToken(user);

        return {
          ...user._doc,
          id: user._id,
          token
        };
    },
    async register(_, { registerInput: { username, email, password, confirmPassword }}) {

      const {valid, errors} = validateRegisterInput(username, email, password, confirmPassword);
      if (!valid){
        throw new UserInputError('Errors', {errors});
      }
      const user = await User.findOne({username});
      if (user){
        throw new UserInputError('Username is taken',{
          errors:{username: 'This username is taken'}
        });
      }
      password = await bcrypt.hash(password,12);
      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
        followers:[],
        followings:[],
      });
      const res = await newUser.save();
      const token = generateToken(res);
      return {
        ...res._doc,
        id: res._id,
        token
      };
    },
    // can use id
    async followUser(_, {followUsername}, context){
      // have username fo the person to follow change the users followings list and the followusername's follower list
      const {username} = checkAuth(context);
      try {
        if (followUsername === username){
          throw new AuthenticationError('Action not allowed')
        }
        const user = await User.findOne({username:username});
        const followUser = await User.findOne({username:followUsername});
        if (!followUser){
          throw new UserInputError('Follow user not found');
        }
        if (user){
          if(user.followings.find((name) =>name === followUsername)){
            // remove him from the followings list and the follower list
            user.followings = user.followings.filter((name) => name !== followUsername);
            followUser.followers = followUser.followers.filter((name) => name !== username)
          }else{
            // push the new followings into the array
            user.followings.push(followUsername);
            followUser.followers.push(username);
          }
          await user.save();
          await followUser.save();
          return user;
        }else{
          throw new UserInputError('User not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    async editUser(_,{username, email}, context){
      const checkUser = checkAuth(context);
      try {
        if (checkUser.username === username){
          const user = await User.findOne({username:username})
          if(user){
            // validity of email
            if (email.trim() === '') {
              throw new UserInputError( 'Email must not be empty');
            } else {
              const regEx = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
              if (!email.match(regEx)) {
                throw new UserInputError('Email must be a valid email address');
              }
            }
            user.email = email // nothing else can be changed via this route
            await user.save()
            return user
          }
          else{
            throw new UserInputError('User not found')
          }
        }else{
          throw new AuthenticationError('Action not allowed')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
  }
};
