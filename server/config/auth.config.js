require('dotenv').config()

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'screct' ,
    jwtExpiration: '7d' ,
    googleClientID: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
  