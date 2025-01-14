
import { env } from '~/config/environment'
import { MongoClient, ServerApiVersion } from 'mongodb'
// eslint-disable-next-line no-console
let trelloDatabaseInstance = null
// khởi tạo 1 đối tượng mongoClientInstance để connect mongoDB
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi : {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors : true
  }
})
// kết nối tới database
export const CONNECT_DB = async () => {
// gọi kết nối tới MongoDB atlas thông qua đối tượng mongoClientInstance
  await mongoClientInstance.connect()

  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}

export const GET_DB = () => {
  if (!trelloDatabaseInstance) {
    throw new Error('Must connect to database first!')
  }
  return trelloDatabaseInstance
}

export const CLOSE_DB = async () => {
  try {
    await mongoClientInstance.close()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error closing MongoDB connection:', error)
  }
}