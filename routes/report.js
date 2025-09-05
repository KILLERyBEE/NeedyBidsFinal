const express = require("express")
const router = express.Router()
const Report = require('../models/reports')
const { sendResultOrRedirect } = require('../utils/respond');

router.post("/report", async (req, res) => {
    try {
        const { userId, itemId, issueType, description } = req.body
        const newReport = new Report({ userId, itemId, issueType, description })
    await newReport.save()
    const result = { success: true, message: "Report created successfully", report: newReport };
    return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
    console.error("Error creating report:", error && (error.stack || error));
    const payload = { success: false, message: 'Internal server error' };
    if (process.env.NODE_ENV === 'development') payload.error = error && (error.message || error);
    res.status(500).json(payload);
    }
})

module.exports = router

