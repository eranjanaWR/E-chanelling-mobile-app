const mongoose = require("mongoose");

const dropLegacyIndexes = async () => {
  try {
    const doctorsCollection = mongoose.connection.collection("doctors");
    // The old Doctor schema had unique:true on email — drop it so doctors
    // without an email (new profile flow) don't get duplicate-key errors.
    await doctorsCollection.dropIndex("email_1");
    console.log("Dropped legacy doctors.email_1 unique index");
  } catch {
    // Index doesn't exist or was already dropped — that's fine
  }
};

const connectDb = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(MONGODB_URI);
  await dropLegacyIndexes();
};

module.exports = { connectDb };
