const express = require("express");
const auth = require("../middleware/auth");
const {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/", auth, listReviews);
router.post("/", auth, createReview);
router.put("/:reviewId", auth, updateReview);
router.delete("/:reviewId", auth, deleteReview);

module.exports = router;
