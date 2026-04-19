import "dotenv/config";
import mongoose from "mongoose";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import Admin from "../models/admin.models.js";
import MemberCode from "../models/membercode.models.js";
import { generateStrings } from "../utils/str_generator.utils.js";

const MONGO_URI = process.env.MONGO_URI;

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

const askRequired = async (rl, label) => {
  while (true) {
    const value = (await rl.question(`${label}: `)).trim();
    if (value) return value;
    console.log(`${label} is required.`);
  }
};

const run = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is required in .env");
  }

  const rl = readline.createInterface({ input, output });

  try {
    console.log("Interactive bootstrap for first admin and membership code");

    const username = await askRequired(rl, "Admin username");
    const password = await askRequired(rl, "Admin password");
    const bootstrapCodeInput = (
      await rl.question("Initial admin membershipCode (optional, 10 chars): ")
    ).trim();
    const firstCodeInput = (
      await rl.question(
        "First generated membership code (optional, 10 chars): ",
      )
    ).trim();

    const adminMembershipCode =
      bootstrapCodeInput.length === 10
        ? bootstrapCodeInput
        : generateStrings(10);

    await mongoose.connect(MONGO_URI);

    let admin = await Admin.findOne({ username });
    if (!admin) {
      admin = await Admin.create({
        username,
        password,
        membershipCode: adminMembershipCode,
      });
      console.log(`created bootstrap admin: ${username}`);
    } else {
      console.log(`bootstrap admin already exists: ${username}`);
    }

    const availableCode = await MemberCode.findOne({
      generatedBy: admin._id,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (availableCode) {
      console.log(
        `active membership code already exists: ${availableCode.code}`,
      );
      return;
    }

    const code = await pickUniqueCode(
      firstCodeInput.length === 10 ? firstCodeInput : undefined,
    );
    const createdCode = await MemberCode.create({
      code,
      generatedBy: admin._id,
    });

    console.log(`membership code created: ${createdCode.code}`);
  } finally {
    rl.close();
  }
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
