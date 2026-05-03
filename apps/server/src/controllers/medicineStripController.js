const MedicineStrip = require("../models/MedicineStrip");

/**
 * POST /medicine-strip
 * Body: { note, patientId, patientName }
 * Saves a new note. Doctor info is taken from req.user (JWT).
 */
const createNote = async (req, res) => {
  try {
    const { note, patientId, patientName } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Note text is required" });
    }
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const newNote = await MedicineStrip.create({
      note: note.trim(),
      patientId,
      patientName: patientName || "Unknown",
      doctorId: req.user._id,
      doctorName: req.user.name || "Unknown Doctor",
    });

    return res.status(201).json({ note: newNote });
  } catch (error) {
    console.error("[MedicineStrip] createNote error:", error);
    return res.status(500).json({ message: "Failed to save note" });
  }
};

/**
 * GET /medicine-strip/:patientId
 * Returns all notes for a specific patient, newest first.
 */
const getNotesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const notes = await MedicineStrip.find({ patientId })
      .sort({ createdAt: -1 }); // newest first

    return res.json({ notes });
  } catch (error) {
    console.error("[MedicineStrip] getNotesByPatient error:", error);
    return res.status(500).json({ message: "Failed to fetch notes" });
  }
};

module.exports = { createNote, getNotesByPatient };
