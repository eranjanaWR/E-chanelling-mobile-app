const mongoose = require("mongoose");

const medicineStripSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: { type: String, required: true, trim: true },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorName: { type: String, required: true, trim: true },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("MedicineStrip", medicineStripSchema);
