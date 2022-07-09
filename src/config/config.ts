export default {
  DB: {
    URI:
      process.env.MONGODB_URI ||
      'mongodb://root:123456@localhost:27017/admin?ssl=false',
  },
};
