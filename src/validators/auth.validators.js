import Joi from "joi";

export const validateRegisterSchema = Joi.object({
  username: Joi.string().trim().min(6).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 6 characters long",
    "any.required": "Username is a required field",
  }),

  password: Joi.string().min(7).required().messages({
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 7 characters long",
    "any.required": "Password is required",
  }),

  membershipCode: Joi.string().length(10).required().messages({
    "string.length": "Membership code must be exactly 10 characters",
    "any.required": "Membership code is required",
  }),
});

export const validateLoginSchema = Joi.object({
  username: Joi.string().trim().min(6).required().messages({
    "string.empty": "Username is required",
    "any.required": "Username is required",
  }),

  password: Joi.string().min(7).required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});
