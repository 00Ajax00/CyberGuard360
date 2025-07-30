import mongoose from 'mongoose';

const vulnerabilitySchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'XSS', 'CSRF', 'OutdatedLib'
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  cveId: { type: String },
  source: { type: String } // e.g., 'Retire.js', 'Heuristic', 'VirusTotal'
});

const scanResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  vulnerabilities: [vulnerabilitySchema],
  userBehavior: {
    formSubmissions: { type: Number, default: 0 },
    linkClicks: { type: Number, default: 0 },
    redirects: { type: Number, default: 0 }
  },
  securityScore: { type: Number, min: 0, max: 100, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for faster queries
scanResultSchema.index({ userId: 1, timestamp: -1 });
scanResultSchema.index({ url: 1 });

const ScanResult = mongoose.model('ScanResult', scanResultSchema);

export default ScanResult;