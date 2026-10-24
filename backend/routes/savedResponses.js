const express = require("express");
const SavedResponse = require("../models/SavedResponse");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Save an AI response
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, type, language, code, response } = req.body;

    if (!type || !language || !code || !response) {
      return res.status(400).json({
        message: "Type, language, code and response are required",
      });
    }

    if (!["Explain", "Debug", "Optimize"].includes(type)) {
      return res.status(400).json({
        message: "Invalid response type",
      });
    }

    const savedResponse = await SavedResponse.create({
      user: req.user.id,
      title: title || `${type} - ${language}`,
      type,
      language,
      code,
      response,
    });

    return res.status(201).json({
      message: "Response saved successfully",
      savedResponse,
    });
  } catch (error) {
    console.error("Save response error:", error.message);

    return res.status(500).json({
      message: "Unable to save response",
    });
  }
});

// Get only the logged-in user's saved responses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const responses = await SavedResponse.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ responses });
  } catch (error) {
    console.error("Fetch saved responses error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch saved responses",
    });
  }
});

// Delete a saved response belonging to the logged-in user
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid saved response ID",
      });
    }

    // Delete only if this response belongs to the logged-in user
    const deletedResponse = await SavedResponse.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!deletedResponse) {
      return res.status(404).json({
        message: "Saved response not found",
      });
    }

    return res.status(200).json({
      message: "Saved response deleted successfully",
    });
  } catch (error) {
    console.error("Delete saved response error:", error.message);

    return res.status(500).json({
      message: "Unable to delete saved response",
    });
  }
});

module.exports = router;
