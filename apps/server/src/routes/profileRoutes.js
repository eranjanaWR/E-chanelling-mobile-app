const express = require("express");
const auth = require("../middleware/auth");
const { getProfile, updateProfile } = require("../controllers/profileController");

const router = express.Router();

router.get("/", auth, getProfile);
router.patch("/", auth, updateProfile);

module.exports = router;
