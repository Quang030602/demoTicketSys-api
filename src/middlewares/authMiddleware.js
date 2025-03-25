import jwt from "jsonwebtoken";
import { env } from "~/config/environment";
import ApiError from "~/utils/ApiError";
import { StatusCodes } from "http-status-codes";

export const authMiddleware = {
  isAuthorized: (req, res, next) => {
    try {
      // ✅ Kiểm tra token từ cả headers và cookies
      const token =
        req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;

      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized (token not found)");
      }

      // ✅ Giải mã token
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET_SIGNATURE);
      req.jwtDecoded = decoded; // ✅ Lưu thông tin user vào request

      console.log("Received Token:", token);
      req.jwtDecoded = decoded;
      console.log("Decoded User ID:", req.jwtDecoded._id); // ✅ Debug


      next();
    } catch (error) {
      console.error("JWT Error:", error.message);
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized (invalid token)"));
    }
  }
};
