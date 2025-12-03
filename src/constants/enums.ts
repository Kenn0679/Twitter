export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum TokenType {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  EMAIL_VERIFY_TOKEN,
  FORGOT_PASSWORD_TOKEN
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaTypeQuery {
  IMAGE = 'image',
  VIDEO = 'video'
}

export enum EncodingStatus {
  PENDING,
  PROCESSING,
  SUCCESSFULLY,
  FAILED
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  Everyone, // 0
  TwitterCircle // 1
}

export enum PeopleFollow {
  Anyone = '0',
  Following = '1'
}

export enum MessageStatus {
  SENT = 'sent',
  RECEIVED = 'received',
  READ = 'read'
}
