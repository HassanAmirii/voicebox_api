import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      minlength: 6,
      trim: true,
    },
    password: {
      select: false,
      type: String,
      required: true,
      minlength: 7,
    },

    membershipCode: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 10,
    },
  },
  { timestamps: true },
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 11);
});

export default mongoose.model("Admin", adminSchema);
