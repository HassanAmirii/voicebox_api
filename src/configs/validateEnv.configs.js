export const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
};
