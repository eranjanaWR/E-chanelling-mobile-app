const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { listDoctors, createDoctor } = require("../controllers/doctorController");
const {
  getProfile,
  updateProfile,
  addMedicalCenter,
  updateMedicalCenter,
  deleteMedicalCenter,
  addTimeSlot,
  deleteTimeSlot,
  getPublicProfile,
} = require("../controllers/doctorProfileController");

// Public — order matters: static paths before params
router.get("/", listDoctors);
router.get("/public/:doctorId", getPublicProfile);

// Protected — doctor's own profile
router.get("/my-profile", auth, getProfile);
router.patch("/my-profile", auth, updateProfile);

// Medical centers
router.post("/medical-centers", auth, addMedicalCenter);
router.put("/medical-centers/:centerId", auth, updateMedicalCenter);
router.delete("/medical-centers/:centerId", auth, deleteMedicalCenter);

// Time slots within a center
router.post("/medical-centers/:centerId/time-slots", auth, addTimeSlot);
router.delete("/medical-centers/:centerId/time-slots/:slotId", auth, deleteTimeSlot);

// Legacy create endpoint
router.post("/", createDoctor);

module.exports = router;
