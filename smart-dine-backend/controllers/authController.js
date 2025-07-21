// controllers/authController.js
import dotenv from "dotenv";

dotenv.config();

export const login = (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "Password required" });
  }

  if (password === process.env.CHEF_PASSWORD) {
    return res.status(200).json({
      success: true,
      token: process.env.CHEF_TOKEN,
    });
  } else {
    return res
      .status(401)
      .json({ success: false, message: "Invalid password" });
  }
};
