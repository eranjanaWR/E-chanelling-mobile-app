const User = require("../models/User");

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load users" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      role,
      contactNumber,
      age,
      gender,
      address,
      medicalHistory,
    } = req.body;

    const update = {};

    if (name !== undefined) update.name = String(name).trim();
    if (email !== undefined) update.email = String(email).trim().toLowerCase();
    if (role !== undefined) update.role = role;
    if (contactNumber !== undefined) update.contactNumber = String(contactNumber).trim();
    if (age !== undefined) update.age = Number(age) || 0;
    if (gender !== undefined) update.gender = gender;
    if (address !== undefined) update.address = String(address).trim();
    if (medicalHistory !== undefined) update.medicalHistory = String(medicalHistory).trim();

    if (update.role && !["patient", "doctor", "admin"].includes(update.role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (update.gender && !["Male", "Female", "Other"].includes(update.gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Email is already in use" });
    }
    return res.status(500).json({ message: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?._id?.toString() === userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

module.exports = { listUsers, updateUser, deleteUser };
