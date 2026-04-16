import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/admin.models";
import jwt from "jsonwebtoken";
import MemberCode from "../models/membercode.models";
import { generateToken } from "../utils/token_generator.utils";

import {
  validateRegisterSchema,
  validateLoginSchema,
} from "../validators/auth.validators";

export const register = async (req, res, next) => {
  try {
    const { error } = (validateRegisterSchema.validate = req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { username, password, membershipCode } = req.body;

    const alreadyExist = await Admin.findOne({ username });
    if (alreadyExist) {
      return res.status(409).json({
        success: false,
        message: "username already exist, please use another unique one",
      });
    }

    const invitation = await MemberCode.findOne({ membershipCode });
    if (!invitation || invitation.isUsed === true) {
      return res.status(400).json({
        success: false,
        message: "invalid memebership code, consult admin",
      });
    }
    const newAdmin = await Admin.create({
      username,
      password,
      membershipCode,
    });

    invitation.isUsed = true;
    await invitation.save();

    const token = generateToken(newAdmin);

    return res.status(201).json({
      success: true,
      message: "account created successfully",
      data: newAdmin,
      token: token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { error } = (validateLoginSchema.validate = req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, password } = req.body;
    const admin = await Admin.findOne({ username }).select("+password");

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const token = generateToken(admin);

    return res
      .status(200)
      .json({ success: true, message: "login successful", token: token });
  } catch (error) {
    next(error);
  }
};
