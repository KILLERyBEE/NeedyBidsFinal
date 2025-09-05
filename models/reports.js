const mongoose = require("mongoose")

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    issueType: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Report", reportSchema)