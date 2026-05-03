const express = require("express");
const auth = require("../middleware/auth");
const { listAppointments, createAppointment, updatePaymentProof, adminEditAppointment, adminUpdateAppointment, adminDeleteAppointment } = require("../controllers/appointmentController");

const router = express.Router();

router.get("/", auth, listAppointments);
router.post("/", auth, createAppointment);
router.patch("/:id/payment-proof", auth, updatePaymentProof);
router.patch("/:id/details", auth, adminEditAppointment);
router.patch("/:id/status", auth, adminUpdateAppointment);
router.delete("/:id", auth, adminDeleteAppointment);

module.exports = router;
