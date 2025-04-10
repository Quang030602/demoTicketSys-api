import 'dotenv/config'
// import { MONGO_CLIENT_EVENTS } from 'mongodb'

export const env ={
    MONGODB_URI: process.env.MONGODB_URI,
    DATABASE_NAME : process.env.DATABASE_NAME,
    PORT: process.env.APP_PORT,
    HOST: process.env.APP_HOST,
    
    BUILD_MODE: process.env.BUILD_MODE,

    AUTHOR : process.env.AUTHOR,

    ADMIN_EMAIL_ADDRESS : process.env.ADMIN_EMAIL_ADDRESS,
    ADMIN_EMAIL_NAME : process.env.ADMIN_EMAIL_NAME,
    ADMIN_EMAIL_PASSWORD : process.env.ADMIN_EMAIL_PASSWORD,

    ACCESS_TOKEN_SECRET_SIGNATURE: process.env.ACCESS_TOKEN_SECRET_SIGNATURE,
    ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE,

    REFRESH_TOKEN_SECRET_SIGNATURE:process.env.REFRESH_TOKEN_SECRET_SIGNATURE,
    REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE,

    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
}