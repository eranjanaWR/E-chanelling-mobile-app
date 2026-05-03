const express = require("express");
const auth = require("../middleware/auth");
const { listAppointments, createAppointment } = require("../controllers/appointmentController");

const router = express.Router();

router.get("/", auth, listAppointments);
router.post("/", auth, createAppointment);

module.exports = router;
