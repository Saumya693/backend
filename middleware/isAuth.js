import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    console.log("isAuth middleware - cookies:", req.cookies);
    const { token } = req.cookies;

    if (!token) {
      console.log("No token found in cookies");
      return res.status(400).json({ message: "User doesn't have token" });
    }

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified:", verifyToken);

    if (!verifyToken) {
      return res.status(400).json({ message: "User doesn't have valid token" });
    }

    req.userId = verifyToken.userId;
    next();
  } catch (error) {
    console.log("isAuth error:", error.message);
    return res.status(500).json({ message: `isAuth error: ${error.message}` });
  }
};

export default isAuth;
