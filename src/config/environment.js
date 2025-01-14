import 'dotenv/config'

export const env ={
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME : process.env.DATABASE_NAME,
  PORT: process.env.APP_PORT,
  HOST: process.env.APP_HOST,
  AUTHOR : process.env.AUTHOR
}