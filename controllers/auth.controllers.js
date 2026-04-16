import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/admin.models";

export const register = async (req, res, next) => {
  try {
    const { username, password, membershipCode } = req.body;
    const alreadyExist = await Admin.findOne({ username });
    if (alreadyExist) {
      return res.status(409).json({
        success: false,
        message: "username already exist, please use another unique one",
      });
    }
    const newAdmin = await Admin.create({
      username,
      password,
      membershipCode,
    });
    return res.status(201).json({
      success: true,
      message: "account created successflully",
      data: newAdmin,
    });
  } catch (error) {
    next(error);
  }
};
