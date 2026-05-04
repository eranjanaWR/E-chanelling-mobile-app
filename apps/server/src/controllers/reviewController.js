const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Review = require("../models/Review");
const mongoose = require("mongoose");

const listReviews = async (req, res) => {
  try {
    const { appointmentIds } = req.query;

    if (!appointmentIds) {
      return res.status(400).json({ message: "appointmentIds query param is required" });
    }

    const ids = String(appointmentIds)
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (!ids.length) {
      return res.json({ reviews: [] });
    }

    const reviews = await Review.find({ appointment: { $in: ids } })
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    return res.json({ reviews });
  } catch (error) {
    console.error("listReviews error", error);
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

const listReviewsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const limit = Number(req.query.limit) || 5;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId" });
    }

    const normalizedLimit = Math.max(1, Math.min(limit, 50));
    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

    const findReviews = async (resolvedDoctorId) =>
      Review.find({ doctor: resolvedDoctorId })
        .sort({ createdAt: -1 })
        .limit(normalizedLimit)
        .populate("patient", "name email")
        .populate("doctor", "name specialty");

    let reviews = await findReviews(doctorObjectId);
    let summary = { averageRating: 0, totalReviews: 0 };

    if (!reviews.length) {
      const doctor = await Doctor.findOne({ user: doctorObjectId });
      if (doctor) {
        reviews = await findReviews(doctor._id);
        if (reviews.length) {
          const stats = await Review.aggregate([
            { $match: { doctor: doctor._id } },
            {
              $group: {
                _id: "$doctor",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
              },
            },
          ]);
          if (stats[0]) {
            summary = {
              averageRating: Number(stats[0].averageRating.toFixed(1)),
              totalReviews: stats[0].totalReviews,
            };
          }
        }
      }
    }

    if (reviews.length && summary.totalReviews === 0) {
      const stats = await Review.aggregate([
        { $match: { doctor: doctorObjectId } },
        {
          $group: {
            _id: "$doctor",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);
      if (stats[0]) {
        summary = {
          averageRating: Number(stats[0].averageRating.toFixed(1)),
          totalReviews: stats[0].totalReviews,
        };
      }
    }

    return res.json({ reviews, summary });
  } catch (error) {
    console.error("listReviewsByDoctor error", error);
    return res.status(500).json({ message: "Failed to fetch doctor reviews" });
  }
};

const createReview = async (req, res) => {
  try {
    if (req.user?.role !== "patient") {
      return res.status(403).json({ message: "Patient access required" });
    }

    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || rating === undefined || comment === undefined) {
      return res.status(400).json({ message: "appointmentId, rating, and comment are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointmentId" });
    }

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const trimmedComment = String(comment).trim();
    if (!trimmedComment) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (String(appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed to review this appointment" });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({ message: "Only completed appointments can be reviewed" });
    }

    const existing = await Review.findOne({ appointment: appointmentId });
    if (existing) {
      return res.status(409).json({ message: "Review already exists" });
    }

    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const review = await Review.create({
      appointment: appointment._id,
      patient: req.user._id,
      doctor: doctor._id,
      rating: parsedRating,
      comment: trimmedComment,
    });

    const populated = await Review.findById(review._id)
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    return res.status(201).json({ review: populated || review });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Review already exists" });
    }
    console.error("createReview error", error);
    return res.status(500).json({ message: error?.message || "Failed to create review" });
  }
};

const updateReview = async (req, res) => {
  try {
    if (req.user?.role !== "patient") {
      return res.status(403).json({ message: "Patient access required" });
    }

    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid reviewId" });
    }

    const { rating, comment } = req.body;
    const update = {};

    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      update.rating = parsedRating;
    }

    if (comment !== undefined) {
      const trimmedComment = String(comment).trim();
      if (!trimmedComment) {
        return res.status(400).json({ message: "Comment is required" });
      }
      update.comment = trimmedComment;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed to edit this review" });
    }

    const updated = await Review.findByIdAndUpdate(reviewId, { $set: update }, { new: true })
      .populate("patient", "name email")
      .populate("doctor", "name specialty");

    return res.json({ review: updated });
  } catch (error) {
    console.error("updateReview error", error);
    return res.status(500).json({ message: error?.message || "Failed to update review" });
  }
};

const deleteReview = async (req, res) => {
  try {
    if (req.user?.role !== "patient") {
      return res.status(403).json({ message: "Patient access required" });
    }

    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid reviewId" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed to delete this review" });
    }

    await Review.deleteOne({ _id: reviewId });

    return res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("deleteReview error", error);
    return res.status(500).json({ message: error?.message || "Failed to delete review" });
  }
};

module.exports = {
  listReviews,
  listReviewsByDoctor,
  createReview,
  updateReview,
  deleteReview,
};
