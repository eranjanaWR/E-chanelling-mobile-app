const express = require("express");
const auth = require("../middleware/auth");
const { listUsers, updateUser, deleteUser } = require("../controllers/userController");

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

router.get("/", auth, requireAdmin, listUsers);
router.put("/:userId", auth, requireAdmin, updateUser);
router.delete("/:userId", auth, requireAdmin, deleteUser);

module.exports = router;
