/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'
import ms from 'ms'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id; // ✅ Lấy userId từ token

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized: Missing userId" });
    }

    const ticketData = { ...req.body, userId }; // ✅ Thêm userId vào dữ liệu gửi đến Service

    const ticket = await ticketService.createNew(ticketData);
    res.status(StatusCodes.CREATED).json(ticket);
  } catch (error) {
    next(error);
  }
};

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}
const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body);

    if (!result) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Login failed, no data returned");
    }

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: ms("14 days"),
    });
    console.log("Login Response Data:", result);

    res.status(StatusCodes.OK).json({
      message: "Login successful",
      userId: result.userId, // ✅ Đảm bảo gửi userId về frontend
    });
  } catch (error) {
    console.error("Login Controller Error:", error.message);
    next(error);
  }
};


const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: ms('14 days')
    })
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError (StatusCodes.FORBIDDEN, 'Please sign in!! '))
  }
}
const update = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const updatedUser = await userService.update(userId, req.body)
    res.status(StatusCodes.OK).json(updatedUser)
  } catch (error) {
    next(error)
  }
}
export const userController = {
  createNew,
  verifyAccount,
  login,
  logout,
  refreshToken,
  update

}