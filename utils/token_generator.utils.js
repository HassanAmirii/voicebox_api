import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  return jwt.sign(
    { id: payload._id, username: payload.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};
