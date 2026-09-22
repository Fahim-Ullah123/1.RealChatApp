import jwt from "jsonwebtoken";

const gentoken = async (userId) => {
  try {
    const token = await jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    console.log("gen token error")
  }
};

export default gentoken
