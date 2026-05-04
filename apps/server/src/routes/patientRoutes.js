const express = require("express");
const auth = require("../middleware/auth");
const { listPatients } = require("../controllers/patientController");

const router = express.Router();

// GET /patients  →  any authenticated user can fetch the patient list.
// The auth middleware already verifies the JWT and populates req.user.
router.get("/", auth, listPatients);

module.exports = router;
