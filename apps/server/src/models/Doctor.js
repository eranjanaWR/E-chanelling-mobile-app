const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: true }
);

const medicalCenterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    centerType: {
      type: String,
      enum: ["private", "public", "specialized"],
      required: true,
    },
    phone: { type: String, default: "", trim: true },
    consultationFee: { type: Number, default: 0 },
    timeSlots: [timeSlotSchema],
  },
  { _id: true }
);

// Legacy availability kept for backward compatibility with listDoctors filter
const availabilitySchema = new mongoose.Schema(
  { day: { type: String, required: true }, slots: [{ type: String }] },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
    name: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    specialty: { type: String, default: "", trim: true },
    qualification: { type: String, default: "", trim: true },
    photoUrl: { type: String, default: "", trim: true },
    experience: { type: Number, default: 0 },
    medicalCenters: [medicalCenterSchema],
    // Legacy fields
    availability: [availabilitySchema],
    fees: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
