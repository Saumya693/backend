import jwt from "jsonwebtoken";

const genToken = (userId) => {
  if (!userId) {
    throw new Error("Invalid userId passed to genToken");
  }
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

export default genToken;
