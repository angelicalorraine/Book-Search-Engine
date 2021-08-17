const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    // get logged in user info
    me: async (parent, args, context) => {
      // user is logged in
      if (context.user) {
        try {
          // find a user matching logged in user id and return user
          const user = await User.findOne({ _id: context.user._id });
          return user;
        } catch (err) {
          console.log('Unable to find user data', err);
        }
      }

      // user is not logged in
      throw new AuthenticationError('Please log in');
    },
  },

  Mutation: {
    // login using provided info
    login: async (parent, { email, password }) => {
      try {
        // find a user matching provided email
        const user = await User.findOne({ email });
        if (!user) {
          throw new AuthenticationError('No user associated with this email address');
        }
        // check if password is correct
        const correctPw = await user.isCorrectPassword(password);
        if (!correctPw) {
          throw new AuthenticationError('Incorrect password');
        }
        // create token from user and return both
        const token = signToken(user);
        return { token, user };
      } catch (err) {
        console.log('Login error', err)
      }
    },

    // create user using provided info
    addUser: async (parent, { username, email, password }) => {
      try {
        // create user using provided username, email, and password
        const user = await User.create({ username, email, password });
        // create token from user and return both
        const token = signToken(user);
        return { token, user };
      } catch (err) {
        console.log('Sign up error', err);
      }
    },

    // add book to user 
    saveBook: async (parent, { bookToSave }, context) => {
      // user is logged in
      if (context.user) {
        try {
          // find and update user matching logged in user id
          const user = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $addToSet: { savedBooks: bookToSave } },
            { new: true, runValidators: true }
          );
          // return updated user
          return user;
        } catch (err) {
          console.log('Save book error', err);
        }
      }
      // user is not logged in
      throw new AuthenticationError('Please log in');
    },

    // delete book from user
    removeBook: async (parent, { bookId }, context) => {
      // user is logged in
      if (context.user) {
        try {
          // find and update user matching logged in user id
          const user = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: { bookId: bookId } } },
            { new: true }
          );
          // return updated user
          return user;
        } catch (err) {
          console.log('Remove book error', err);
        }
      }
      // user is not logged in
      throw new AuthenticationError('Please log in');
    },
  },
};

module.exports = resolvers;
