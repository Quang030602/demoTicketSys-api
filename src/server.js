
import express from 'express'
import cors from  'cors'
import {corsOptions} from '~/config/cors'
import exitHook from 'async-exit-hook'
import {CONNECT_DB, GET_DB, CLOSE_DB} from '~/config/mongodb'
import {env} from '~/config/environment'
import {APIs_V1} from '~/routes/v1'
import {errorHandlingMiddleware} from '~/middlewares/errorHandlingMiddleware'
import cookieParser from 'cookie-parser';

const START_SERVER = () => {
  const app = express()

  app.use(cors(corsOptions))
  
  app.use(express.json())
  app.use(cookieParser()); // ✅ Middleware đọc cookies
  app.use(
    cors({
      origin: "http://localhost:5173", // ✅ Đúng domain frontend
      credentials: true, // ✅ Cho phép gửi cookies
    }),
  );
  app.use('/v1', APIs_V1)

  app.use(errorHandlingMiddleware)
  
  app.listen(env.PORT, env.HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Hello ${env.AUTHOR}, I am running at http:${ env.HOST }:${ env.PORT }/`)
  })

  exitHook(() => {
    console.log('4. Đang ngắt kết nối tới MongoDB Cloud Atlas...')
    CLOSE_DB().then(() => {
      console.log('5. Đã ngắt kết nối tới MongoDB Cloud Atlas')
      process.exit()
    })
  })
  process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
  });
}
// chỉ khi kết nối db thành công thì mới start server BE 
// Immediately-Invoked/ anonymous async Function Expression (IIFE)
(async () => {
  try {
    console.log('1. Connecting to MongoDB...')
    await CONNECT_DB()
    console.log('2. Connected to MongoDB successfully!')
    START_SERVER()
  }
  catch(error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(0)
  }
})()

