const express = require("express");
const auth = require("../middleware/auth");
const {
	listAppointments,
	createAppointment,
	createAppointmentAdmin,
	updateAppointment,
	deleteAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

const requireAdmin = (req, res, next) => {
	if (req.user?.role !== "admin") {
		return res.status(403).json({ message: "Admin access required" });
	}
	return next();
};

router.get("/", auth, listAppointments);
router.post("/", auth, createAppointment);
router.post("/admin", auth, requireAdmin, createAppointmentAdmin);
router.put("/:appointmentId", auth, requireAdmin, updateAppointment);
router.delete("/:appointmentId", auth, requireAdmin, deleteAppointment);

module.exports = router;
