import "dotenv/config";
import mongoose from "mongoose";
import Admin from "../models/admin.models.js";
import MemberCode from "../models/membercode.models.js";
import { generateStrings } from "../utils/str_generator.utils.js";

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_USERNAME = process.env.BOOTSTRAP_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const ADMIN_MEMBERSHIP_CODE =
  process.env.BOOTSTRAP_ADMIN_MEMBERSHIP_CODE || generateStrings(10);
const FIRST_CODE = process.env.FIRST_MEMBERSHIP_CODE || generateStrings(10);

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

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error(
      "BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD are required",
    );
  }

  await mongoose.connect(MONGO_URI);

  let admin = await Admin.findOne({ username: ADMIN_USERNAME });

  if (!admin) {
    admin = await Admin.create({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      membershipCode: ADMIN_MEMBERSHIP_CODE,
    });
    console.log(`created bootstrap admin: ${ADMIN_USERNAME}`);
  } else {
    console.log(`bootstrap admin already exists: ${ADMIN_USERNAME}`);
  }

  const availableCode = await MemberCode.findOne({
    generatedBy: admin._id,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (availableCode) {
    console.log(`active membership code already exists: ${availableCode.code}`);
    return;
  }

  const code = await pickUniqueCode(FIRST_CODE);
  const createdCode = await MemberCode.create({
    code,
    generatedBy: admin._id,
  });

  console.log("first membership code created");
  console.log(`membership code: ${createdCode.code}`);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
