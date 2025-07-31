import mongoose from 'mongoose';

const communityReportSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  reportDetails: {
    type: String,
    required: true,
    trim: true
  },
  anonymousId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
communityReportSchema.index({ url: 1 });
communityReportSchema.index({ timestamp: -1 });

const CommunityReport = mongoose.model('CommunityReport', communityReportSchema);

export default CommunityReport;