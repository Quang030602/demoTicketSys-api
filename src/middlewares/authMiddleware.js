import { StatusCodes } from 'http-status-codes'
import { JWTProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

const isAuthorized = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken
  const clientRefreshToken = req.cookies?.refreshToken

  if (!clientAccessToken || !clientRefreshToken) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized(token not found)'))
  }
  try {
    // Decode the token to check its validity
    const accessTokenDecoded = await JWTProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    // If the token is valid, save the decoded information to req.jwtDecoded
    req.jwtDecoded = accessTokenDecoded
    // Allow the request to proceed
    next()
  } catch (error) {
    // If the accessToken has expired, return an error to the frontend to call the refresh token API
    if (error?.message?.includes('jwt expired')) {
      return next(new ApiError(StatusCodes.GONE, 'Need to refresh token'))
    }
    // If the accessToken is invalid for any other reason, return a 401 error to the frontend to call the logout API
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
  }
}

export const authMiddleware = { isAuthorized }