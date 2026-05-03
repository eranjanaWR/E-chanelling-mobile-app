const express = require("express");
const auth = require("../middleware/auth");
const { createNote, getNotesByPatient } = require("../controllers/medicineStripController");

const router = express.Router();

// POST /medicine-strip          → save a new note (doctor must be logged in)
router.post("/", auth, createNote);

// GET  /medicine-strip/:patientId → get all notes for a patient
router.get("/:patientId", auth, getNotesByPatient);

module.exports = router;
