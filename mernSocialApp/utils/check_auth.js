require('dotenv').config();
const { AuthenticationError } = require('apollo-server');

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

module.exports = (context) =>{
  const authHeader = context.req.headers.authorization;
  if (authHeader){
    const token = authHeader.split('Bearer ')[1];
    if(token){
      try{
        const user = jwt.verify(token, SECRET_KEY);
        return user;
      } catch(err){
        throw new AuthenticationError('Invalid/Expired token');
      }
    }
    else{
      throw new Error('Authentication token must be in the \'Bearer [token]\' format');
    }
  }
  else{
    throw new Error('Authorization headedr must be provided');
  }
};
