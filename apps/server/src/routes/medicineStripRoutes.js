const express = require("express");
const auth = require("../middleware/auth");
const { createNote, getNotesByPatient, updateNote, deleteNote, getMyNotes } = require("../controllers/medicineStripController");

const router = express.Router();

// POST /medicine-strip          → save a new note (doctor must be logged in)
router.post("/", auth, createNote);

// GET /medicine-strip/my-notes  → get notes for the logged-in patient
router.get("/my-notes", auth, getMyNotes);

// GET  /medicine-strip/:patientId → get all notes for a patient
router.get("/:patientId", auth, getNotesByPatient);

// PATCH /medicine-strip/:id     → update an existing note
router.patch("/:id", auth, updateNote);

// DELETE /medicine-strip/:id    → delete a note
router.delete("/:id", auth, deleteNote);

module.exports = router;
