import express from 'express'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, GET_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'

const START_SERVER = () => {
  const app = express()
  app.use('/v1', APIs_V1)
  app.listen(env.PORT, env.HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Hello ${env.AUTHOR}, I am running at http:${ env.HOST }:${ env.PORT }/`)
    // eslint-disable-next-line no-console
    console.log(GET_DB().listCollections().toArray())
  })

  exitHook(() => {
    // eslint-disable-next-line no-console
    console.log('4. Đang ngắt kết nối tới MongoDB Cloud Atlas...')
    CLOSE_DB().then(() => {
      // eslint-disable-next-line no-console
      console.log('5. Đã ngắt kết nối tới MongoDB Cloud Atlas')
      process.exit()
    })
  })
  process.on('exit', (code) => {
    // eslint-disable-next-line no-console
    console.log(`Process exited with code: ${code}`)
  })
}
// chỉ khi kết nối db thành công thì mới start server BE
// Immediately-Invoked/ anonymous async Function Expression (IIFE)
(async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('1. Connecting to MongoDB...')
    await CONNECT_DB()
    // eslint-disable-next-line no-console
    console.log('2. Connected to MongoDB successfully!')
    START_SERVER()
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error connecting to MongoDB:', error)
    process.exit(0)
  }
})()
