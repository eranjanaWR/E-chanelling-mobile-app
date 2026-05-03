const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
  override: true,
});

const { connectDb } = require("./config/db");
const app = require("./app");
const User = require("./models/User");

const port = process.env.PORT || 4000;

const ensureAdminUser = async () => {
  const adminEmail = "adminchanneling@gmail.com";
  const adminPassword = "admin123";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      await existingAdmin.save();
    }
    return;
  }

  await User.create({
    name: "Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });
};

connectDb()
  .then(async () => {
    await ensureAdminUser();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
