const Doctor = require("../models/Doctor");

const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (existing, candidate) => {
  const cs = timeToMinutes(candidate.startTime);
  const ce = timeToMinutes(candidate.endTime);
  return existing.some((s) => {
    if (s.day !== candidate.day) return false;
    const ss = timeToMinutes(s.startTime);
    const se = timeToMinutes(s.endTime);
    return cs < se && ce > ss;
  });
};

// Auto-create Doctor document from User on first access.
// Uses upsert so it's safe for concurrent requests and legacy data.
const ensureDoctor = async (user) => {
  const doctor = await Doctor.findOneAndUpdate(
    { user: user._id },
    {
      $setOnInsert: {
        name: user.name || "",
        email: user.email || "",
        specialty: "",
        experience: 0,
        medicalCenters: [],
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doctor;
};

const getProfile = async (req, res) => {
  try {
    const doctor = await ensureDoctor(req.user);
    return res.json({ doctor });
  } catch (error) {
    console.error("getProfile error", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { specialty, experience } = req.body;
    await ensureDoctor(req.user);

    const update = {};
    if (specialty !== undefined) update.specialty = specialty.trim();
    if (experience !== undefined) update.experience = Number(experience) || 0;

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { new: true }
    );
    return res.json({ doctor });
  } catch (error) {
    console.error("updateProfile error", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

const addMedicalCenter = async (req, res) => {
  try {
    const { name, location, centerType, phone, consultationFee } = req.body;

    if (!name || !location || !centerType) {
      return res.status(400).json({ message: "Name, location, and center type are required" });
    }

    const validTypes = ["private", "public", "specialized"];
    if (!validTypes.includes(centerType)) {
      return res.status(400).json({ message: "Center type must be private, public, or specialized" });
    }

    await ensureDoctor(req.user);

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: {
          medicalCenters: {
            name: name.trim(),
            location: location.trim(),
            centerType,
            phone: (phone || "").trim(),
            consultationFee: Number(consultationFee) || 0,
            timeSlots: [],
          },
        },
      },
      { new: true }
    );
    return res.status(201).json({ doctor });
  } catch (error) {
    console.error("addMedicalCenter error", error);
    return res.status(500).json({ message: "Failed to add medical center" });
  }
};

const updateMedicalCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { name, location, centerType, phone, consultationFee } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const center = doctor.medicalCenters.id(centerId);
    if (!center) return res.status(404).json({ message: "Medical center not found" });

    if (name !== undefined) center.name = name.trim();
    if (location !== undefined) center.location = location.trim();
    if (centerType !== undefined) center.centerType = centerType;
    if (phone !== undefined) center.phone = phone.trim();
    if (consultationFee !== undefined) center.consultationFee = Number(consultationFee) || 0;

    await doctor.save();
    return res.json({ doctor });
  } catch (error) {
    console.error("updateMedicalCenter error", error);
    return res.status(500).json({ message: "Failed to update medical center" });
  }
};

const deleteMedicalCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const center = doctor.medicalCenters.id(centerId);
    if (!center) return res.status(404).json({ message: "Medical center not found" });

    center.deleteOne();
    await doctor.save();
    return res.json({ doctor });
  } catch (error) {
    console.error("deleteMedicalCenter error", error);
    return res.status(500).json({ message: "Failed to delete medical center" });
  }
};

const addTimeSlot = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { day, startTime, endTime } = req.body;

    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: "Day, start time, and end time are required" });
    }

    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: "Invalid day" });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: "Times must be in HH:MM format (e.g. 09:00)" });
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ message: "Start time must be before end time" });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const center = doctor.medicalCenters.id(centerId);
    if (!center) return res.status(404).json({ message: "Medical center not found" });

    if (overlaps(center.timeSlots, { day, startTime, endTime })) {
      return res.status(409).json({ message: "This slot overlaps with an existing slot" });
    }

    center.timeSlots.push({ day, startTime, endTime });
    await doctor.save();
    return res.status(201).json({ doctor });
  } catch (error) {
    console.error("addTimeSlot error", error);
    return res.status(500).json({ message: "Failed to add time slot" });
  }
};

const deleteTimeSlot = async (req, res) => {
  try {
    const { centerId, slotId } = req.params;
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const center = doctor.medicalCenters.id(centerId);
    if (!center) return res.status(404).json({ message: "Medical center not found" });

    const slot = center.timeSlots.id(slotId);
    if (!slot) return res.status(404).json({ message: "Time slot not found" });

    slot.deleteOne();
    await doctor.save();
    return res.json({ doctor });
  } catch (error) {
    console.error("deleteTimeSlot error", error);
    return res.status(500).json({ message: "Failed to delete time slot" });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId).populate("user", "name email");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    return res.json({ doctor });
  } catch (error) {
    console.error("getPublicProfile error", error);
    return res.status(500).json({ message: "Failed to fetch doctor profile" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addMedicalCenter,
  updateMedicalCenter,
  deleteMedicalCenter,
  addTimeSlot,
  deleteTimeSlot,
  getPublicProfile,
};
