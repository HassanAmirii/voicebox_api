import "dotenv/config";
import mongoose from "mongoose";
import Admin from "../models/admin.models.js";
import MemberCode from "../models/membercode.models.js";
import { generateStrings } from "../utils/str_generator.utils.js";

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME;
const PROVIDED_CODE = process.env.SEED_MEMBERSHIP_CODE;

const pickUniqueCode = async (preferredCode) => {
  if (preferredCode?.length === 10) {
    const exists = await MemberCode.findOne({ code: preferredCode });
    if (!exists) return preferredCode;
  }

  for (let i = 0; i < 20; i++) {
    const candidate = generateStrings(10);
    const exists = await MemberCode.findOne({ code: candidate });
    if (!exists) return candidate;
  }

  throw new Error("could not generate a unique membership code");
};

const run = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is required in .env");
  }

  if (!ADMIN_USERNAME) {
    throw new Error("SEED_ADMIN_USERNAME is required");
  }

  await mongoose.connect(MONGO_URI);

  const admin = await Admin.findOne({ username: ADMIN_USERNAME });
  if (!admin) {
    throw new Error("admin not found for SEED_ADMIN_USERNAME");
  }

  const code = await pickUniqueCode(PROVIDED_CODE);
  const createdCode = await MemberCode.create({
    code,
    generatedBy: admin._id,
  });

  console.log(`membership code created: ${createdCode.code}`);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
