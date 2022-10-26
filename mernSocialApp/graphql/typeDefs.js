const { gql } = require('apollo-server');

module.exports = gql`
  scalar Upload
  type File{
    filename: String!
    mimetype: String!
    encoding: String!
    url: String!
  }
  type Post {
    id: ID!
    body: String!
    pictureUrl: String!
    createdAt: String!
    username: String!
    comments: [Comment]!
    likes: [Like]!
    likeCount: Int!
    commentCount: Int!
    edited:Boolean!
  }
  type Comment{
    id: ID!
    createdAt: String!
    username: String!
    body: String!
    likes: [Like]!
    likeCount: Int!
    edited:Boolean!
  }
  type Like{
    id: ID!
    createdAt: String!
    username: String!
  }
  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    createdAt: String!
    followings: [String]
    followers: [String]
    followersCount: Int!
    followingsCount: Int!
  }
  input RegisterInput{
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }
  type Query {
    getPosts: [Post]
    getPost(postId: ID!):Post
    getFollowers(username: String!): [String]
    getFollowings(username: String!): [String]
    getUserInfo(username: String!): User!
    getUserPosts(username:String!): [Post]
    getFollowingPosts(username:String!): [Post]
    searchUser(username:String!):[User]
  }
  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    createPost(body:String!, picture: Upload!): Post!
    deletePost(postId: ID!): String!
    editPost(postId: ID!, body: String!): Post!
    createComment(postId: ID!, body: String!): Post!
    deleteComment(postId: ID!, commentId: ID!): Post!
    editComment(postId: ID!, commentId: ID!, commentBody: String!): Post!
    likePost(postId: ID!): Post!
    likeComment(postId: ID!, commentId: ID!): Post!
    followUser(followUsername: String!): User!
    editUser(username: String!, email: String!): User!
  }
`;
