import { config } from 'dotenv';
import { StringValue } from 'ms';
import argv from 'minimist';

const options = argv(process.argv.slice(2));

config({
  path: options.env ? `./.env.${options.env}` : './.env'
});

const envConfig = {
  /*
    # ===================================
    # SERVER CONFIGURATION
    # ===================================
  */
  port: process.env.PORT as string,
  baseUrl: process.env.BASE_URL as string,
  host: process.env.HOST as string,
  frontendUrl: process.env.FRONTEND_URL as string,
  projectName: process.env.PROJECT_NAME as string,
  /**
    # ===================================
    # DATABASE CONFIGURATION (MongoDB Atlas)
    # ===================================
   */
  dbUser: process.env.DB_USER as string,
  dbPass: process.env.DB_PASS as string,
  dbName: process.env.DB_NAME as string,
  dbUserCollection: process.env.DB_USER_COLLECTION as string,
  dbRefreshTokenCollection: process.env.DB_REFRESH_TOKEN_COLLECTION as string,
  dbFollowersCollection: process.env.DB_FOLLOWERS_COLLECTION as string,
  dbVideoStatusCollection: process.env.DB_VIDEO_STATUS_COLLECTION as string,
  dbTweetsCollection: process.env.DB_TWEETS_COLLECTION as string,
  dbHashtagsCollection: process.env.DB_HASHTAGS_COLLECTION as string,
  dbBookmarksCollection: process.env.DB_BOOKMARKS_COLLECTION as string,
  dbLikesCollection: process.env.DB_LIKES_COLLECTION as string,
  dbConversationsCollection: process.env.DB_CONVERSATIONS_COLLECTION as string,
  /**
     # ===================================
     # SECURITY & ENCRYPTION
     # ===================================
     */
  passwordSecret: process.env.PASSWORD_SECRET as string,
  /**
   * # ===================================
   * # AWS S3 CONFIGURATION
   * # ===================================
   */
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  awsRegion: process.env.AWS_REGION as string,
  awsS3BucketName: process.env.BUCKET_NAME as string,
  sesFromAddress: process.env.SES_FROM_ADDRESS as string,
  /**
   * # ===================================
   * # JWT SECRETS
   * # ===================================
   */
  jwtSecret: process.env.JWT_SECRET as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtEmailSecret: process.env.JWT_EMAIL_SECRET as string,
  jwtVerifyEmailSecret: process.env.JWT_VERIFY_EMAIL_SECRET as string,
  jwtForgotPasswordSecret: process.env.JWT_FORGOT_PASSWORD_SECRET as string,
  /**
   # ===================================
   * # JWT TOKEN EXPIRATION
   * # ===================================
   */
  accessTokenExpire: process.env.ACCESS_TOKEN_EXPIRE as StringValue,
  refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRE as StringValue,
  emailVerifyTokenExpire: process.env.EMAIL_VERIFY_TOKEN_EXPIRE as StringValue,
  forgotPasswordTokenExpire: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE as StringValue,
  /**
   * # ===================================
   * # OAUTH CONFIGURATION
   * # ===================================
   */
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI as string,
  clientRedirectCallback: process.env.CLIENT_REDIRECT_CALLBACK as string
};

export default envConfig;
