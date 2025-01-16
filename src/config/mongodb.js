
import {env} from '~/config/environment'
import { MongoClient, ServerApiVersion } from 'mongodb' 

 let ticketDatabaseInstance = null
// khởi tạo 1 đối tượng mongoClientInstance để connect mongoDB
 const mongoClientInstance = new MongoClient(env.MONGODB_URI,{
    serverApi : {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors : true,
    }
 })
// kết nối tới database
 export const CONNECT_DB = async () => {
    // gọi kết nối tới MongoDB atlas thông qua đối tượng mongoClientInstance
    await mongoClientInstance.connect()

    ticketDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
 }

 export const GET_DB = () => {
    if (!ticketDatabaseInstance) {
        throw new Error('Must connect to database first!')
    }
    return ticketDatabaseInstance
 }

 export const CLOSE_DB = async () => {
   try {
      console.log('Closing MongoDB connection...')
      await mongoClientInstance.close()
      console.log('MongoDB connection closed successfully.')
  } catch (error) {
      console.error('Error closing MongoDB connection:', error)
  }
 }