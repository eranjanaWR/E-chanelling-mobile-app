const User = require("../models/User");

/**
 * GET /patients
 * Returns all registered users with role === "patient".
 * Sensitive fields (password) are excluded automatically.
 */
const listPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" })
      .select("_id name email contactNumber")   // only what the app needs
      .sort({ name: 1 });                        // alphabetical order

    return res.json({ patients });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load patients" });
  }
};

module.exports = { listPatients };
