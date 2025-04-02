/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN, WHITELIST_DOMAINS } from '~/utils/constants'
import nodemailer from 'nodemailer'
import { env } from '~/config/environment'
import { JWTProvider } from '~/providers/JwtProvider'
import { pick } from 'lodash'
import QRCode from 'qrcode'


// ⚡ Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL_ADDRESS, // Đặt email trong biến môi trường
    pass: process.env.ADMIN_EMAIL_PASSWORD // Dùng mật khẩu ứng dụng
  }
})

const createNew = async (reqBody) => {
  try {
    // ✅ Kiểm tra dữ liệu đầu vào
    if (!reqBody.email || !reqBody.password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email and password are required')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reqBody.email)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email format')
    }
    if (reqBody.password.length < 6) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Password must be at least 6 characters long')
    }

    // ✅ Kiểm tra email đã tồn tại hay chưa
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
    }

    // ✅ Tạo user mới
    const nameFromEmail = reqBody.email.split('@')[0]
    const hashedPassword = await bcryptjs.hash(reqBody.password, 10)
    
    // Initial user object without QR code
    const newUser = {
      email: reqBody.email,
      password: hashedPassword,
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }

    const createdUser = await userModel.createNew(newUser)
    if (!createdUser?.insertedId) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user')
    }

    // Now we have an ID, generate QR code with it
    const userId = createdUser.insertedId.toString()
    const qrCodeId = uuidv4()
    
    // Create user data for QR code with the actual user ID
    const userQRData = {
      userId: userId,
      email: reqBody.email,
      username: nameFromEmail,
    }
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(userQRData))
    
    // Update the user with QR code information
    await userModel.update(createdUser.insertedId, {
      qrCode: {
        id: qrCodeId,
        dataURL: qrCodeDataURL
      }
    })

    // Get the complete updated user
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // ✅ Gửi email xác thực bằng Nodemailer
    const verificationLink = `${WHITELIST_DOMAINS}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    
   // console.log('email:', getNewUser.email)
    const mailOptions = {
      from: `"AiMier Support" <${process.env.ADMIN_EMAIL_ADDRESS}>`,
      to: getNewUser.email,
      subject: 'Verify your email address to complete your registration',
      html: `
        <h3>Here is your verification link:</h3>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>Sincerely,<br/>- AiMier -</p>
      `
    }

    try {
      await transporter.sendMail(mailOptions)
      //console.log('Verification email sent successfully')
    } catch (error) {
      console.error('Failed to send verification email:', error.message || error)
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'User created, but failed to send verification email')
    }

    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    //
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) { throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')}
    if (existUser.isActive) { throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tour account has been activated') }
    if (existUser.verifyToken !== reqBody.token) { throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid token') }
    const updateData = {
      isActive: true,
      verifyToken: null
    }
    const result = await userModel.update(existUser._id, updateData)
    return result
  } catch (error) {
    throw error
  }

}

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email);
    if (!existUser) { throw new ApiError(StatusCodes.NOT_FOUND, "User not found"); }
    if (!existUser.isActive) { throw new ApiError(StatusCodes.NOT_ACCEPTABLE, "Your account has not been activated"); }
    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, "Your email or password is incorrect");
    }

    const userInfo = {
      _id: existUser._id.toString(), 
      email: existUser.email,
    };

    const accessToken = await JWTProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    );
    const refreshToken = await JWTProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
    );

    // ✅ Debug để kiểm tra dữ liệu trước khi return
    // console.log("Login Success - Returning:", {
    //   accessToken,
    //   refreshToken,
    //   userId: existUser._id.toString(),
    // });
    
    return {
      accessToken,
      refreshToken,
      userId: existUser._id.toString(), 
      userRole: existUser.role,
      ...pickUser(existUser),
    };
  } catch (error) {
    console.error("Login Error:", error.message);
    throw error;
  }
};

const refreshToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JWTProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    )
    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email
    }
    const accessToken = await JWTProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    )
    return { accessToken }
  }
  catch (error) {
    throw error
  }
}
const update = async (userId, reqBody) => {
  try {
    const existUser = await userModel.findOneById(userId)
    if (!existUser) { throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')}
    if (!existUser.isActive) { throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account has not been activated') }

    let updatedUser = {}
    if (reqBody.current_password && reqBody.new_password) {
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Current password is incorrect')
      }
      updatedUser = await userModel.update(existUser._id,
        { password: bcryptjs.hashSync(reqBody.new_password, 8)
        })
    }
    else {
      updatedUser = await userModel.update(existUser._id, reqBody)
    }
    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const loginWithQRCode = async (reqBody) => {
  try {
    //console.log('Received QR data:', reqBody);
    
    let userId;
    
    // Handle both formats: parsed object or JSON string in qrData field
    if (reqBody.userId ) {
      // Direct object format
      userId = reqBody.userId;
      
    } else if (reqBody.qrData) {
      // JSON string in qrData field
      try {
        const qrDataObj = typeof reqBody.qrData === 'string' ? JSON.parse(reqBody.qrData) : reqBody.qrData;
        userId = qrDataObj.userId;
      } catch (error) {
        console.error('Failed to parse QR data:', error);
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid QR code data format');
      }
    } else {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing QR code data');
    }
    
    console.log(`Processing login with userId: ${userId}`);

    // ✅ Kiểm tra đầu vào hợp lệ
    if (!userId ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'QR code data is incomplete');
    }

    // ✅ Tìm user trong database
    const existUser = await userModel.findOneById(userId);
    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    console.log('Found user:', existUser.email);

    // ✅ Kiểm tra tài khoản đã kích hoạt chưa
    if (!existUser.isActive) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account has not been activated');
    }

    // ✅ Kiểm tra mã QR có hợp lệ không
    if (!existUser.qrCode) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'No QR code found for this user');
    }

    // ✅ Tạo accessToken & refreshToken
    const userInfo = {
      _id: existUser._id.toString(),
      email: existUser.email,
    };

    const accessToken = await JWTProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    );

    const refreshToken = await JWTProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
    );
    
    // Generate new QR code after successful login for security
    const newQrCodeId = uuidv4();
    const newQRData = {
      userId: existUser._id.toString(),
      email: existUser.email,
      username: existUser.username,
      qrId: newQrCodeId
    };
    
    const newQrCodeDataURL = await QRCode.toDataURL(JSON.stringify(newQRData));
    
    await userModel.update(existUser._id, {
      qrCode: {
        id: newQrCodeId,
        dataURL: newQrCodeDataURL
      }
    });
    
    //console.log('Login successful, generated new QR code with ID:', newQrCodeId);

    return {
      accessToken,
      refreshToken,
      userId: existUser._id.toString(),
      userRole: existUser.role,
      ...pickUser(existUser),
    };
  } catch (error) {
    console.error("QR Login Error:", error.message);
    throw error;
  }
};



export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update,
  loginWithQRCode,

}
