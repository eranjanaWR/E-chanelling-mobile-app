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

/**
 * PATCH /medicine-strip/:id
 * Body: { note }
 * Updates an existing note. Only the doctor who created it can edit it.
 */
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Note text is required" });
    }

    const existingNote = await MedicineStrip.findById(id);
    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Optional: check if req.user._id matches existingNote.doctorId if only the creator can edit.
    if (existingNote.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to edit this note" });
    }

    existingNote.note = note.trim();
    await existingNote.save();

    return res.json({ note: existingNote });
  } catch (error) {
    console.error("[MedicineStrip] updateNote error:", error);
    return res.status(500).json({ message: "Failed to update note" });
  }
};

/**
 * DELETE /medicine-strip/:id
 * Deletes an existing note.
 */
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const existingNote = await MedicineStrip.findById(id);
    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (existingNote.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this note" });
    }

    await MedicineStrip.findByIdAndDelete(id);

    return res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("[MedicineStrip] deleteNote error:", error);
    return res.status(500).json({ message: "Failed to delete note" });
  }
};

module.exports = { createNote, getNotesByPatient, updateNote, deleteNote };
