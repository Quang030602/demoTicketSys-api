import 'dotenv/config'
// import { MONGO_CLIENT_EVENTS } from 'mongodb'

export const env ={
    MONGODB_URI: process.env.MONGODB_URI,
    DATABASE_NAME : process.env.DATABASE_NAME,
    PORT: process.env.APP_PORT,
    HOST: process.env.APP_HOST,
    
    BUILD_MODE: process.env.BUILD_MODE,

    AUTHOR : process.env.AUTHOR,
}