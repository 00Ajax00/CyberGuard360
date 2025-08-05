// =================================================================
// CyberGuard360 Backend Server - Final Version
// =================================================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const retire = require('retire');
const axios = require('axios');

dotenv.config();

const app = express();

// =================================================================
// Middleware
// =================================================================
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// =================================================================
// Database Connection & Schemas
// =================================================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
});

const ScanResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    vulnerabilities: [{
        type: { type: String },
        description: String,
        severity: String,
        cveId: String,
    }],
    securityScore: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
});

const CommunityReportSchema = new mongoose.Schema({
    url: { type: String, required: true, index: true },
    reportDetails: { type: String, required: true },
    anonymousId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const ScanResult = mongoose.model('ScanResult', ScanResultSchema);
const CommunityReport = mongoose.model('CommunityReport', CommunityReportSchema);

// =================================================================
// Authentication Middleware
// =================================================================
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const botAuthMiddleware = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    if (apiKey && apiKey === process.env.BOT_API_KEY) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
    }
};

// =================================================================
// Core Scanning Logic (Refactored)
// =================================================================
async function performScan(url) {
    const vulnerabilities = [];
    let score = 100;
    let recommendations = [];

    // 1. Scan for vulnerable JS libraries
    try {
        const pageResponse = await axios.get(url, { timeout: 15000 });
        const htmlContent = pageResponse.data;
        const scriptTagRegex = /<script.*?src=["'](.*?)["']/g;
        const scriptMatches = [...htmlContent.matchAll(scriptTagRegex)];
        const scriptUrls = scriptMatches.map(match => new URL(match[1], url).href);

        for (const scriptUrl of scriptUrls) {
            try {
                const scriptResponse = await axios.get(scriptUrl, { timeout: 15000 });
                const findings = retire.scanJs(scriptResponse.data, retire.resolve);
                if (findings.length > 0) {
                    findings.forEach(finding => {
                        finding.results.forEach(result => {
                            result.vulnerabilities.forEach(vuln => {
                                vulnerabilities.push({
                                    type: 'Outdated Library',
                                    description: `Found: ${result.component} v${result.version} in ${finding.file}`,
                                    severity: vuln.severity,
                                    cveId: (vuln.identifiers.CVE || [])[0] || 'N/A'
                                });
                            });
                        });
                    });
                }
            } catch (scriptError) {
                console.log(`Could not fetch or scan script: ${scriptUrl}`);
            }
        }
    } catch (error) {
        console.error(`Failed to fetch or analyze main URL ${url}:`, error.message);
        throw new Error("Failed to fetch or analyze the main URL. It may be offline or blocking scanners.");
    }
    
    // 2. Calculate score
    let vulnerabilityWeight = vulnerabilities.reduce((acc, vuln) => {
        if (vuln.severity === 'high' || vuln.severity === 'critical') return acc + 20;
        if (vuln.severity === 'medium') return acc + 10;
        return acc + 5;
    }, 0);
    score -= vulnerabilityWeight;
    score = Math.max(0, score);

    // 3. Generate recommendations
    if (vulnerabilities.length > 0) {
        recommendations.push("This site uses outdated software which could be exploited.");
    }
    if (score < 50) {
        recommendations.push("This site has a low security score. Proceed with caution.");
    }
    if (recommendations.length === 0) {
        recommendations.push("Looks good! No vulnerable JavaScript libraries detected.");
    }
    
    return { vulnerabilities, securityScore: score, recommendations };
}

// =================================================================
// API Routes
// =================================================================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'CyberGuard360 API is running.',
        timestamp: new Date().toISOString()
    });
});

// --- User Authentication ---
app.post('/api/users/register', body('email').isEmail(), body('password').isLength({ min: 6 }), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        if (await User.findOne({ email: req.body.email })) return res.status(400).json({ message: 'User already exists.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const user = new User({ email: req.body.email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/users/login', body('email').isEmail(), body('password').notEmpty(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// --- Scanning Endpoints ---
// Endpoint for the browser extension (requires user login)
app.post('/api/scan', authMiddleware, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required.' });

    try {
        const scanData = await performScan(url);
        // Save results to the specific user's history
        const scanResult = new ScanResult({
            userId: req.user.id,
            url,
            vulnerabilities: scanData.vulnerabilities,
            securityScore: scanData.securityScore,
        });
        await scanResult.save();
        res.json(scanData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint for the Discord bot (requires API key)
app.post('/api/bot-scan', botAuthMiddleware, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required.' });

    try {
        const scanData = await performScan(url);
        // We don't save bot scans to any user history, just return the data
        res.json(scanData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// --- History & Community Reporting ---
app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        const history = await ScanResult.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(20);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history.' });
    }
});

app.post('/api/reports/submit', async (req, res) => {
    const { url, reportDetails, anonymousId } = req.body;
    if (!url || !reportDetails || !anonymousId) return res.status(400).json({ message: 'URL, details, and anonymous ID are required.' });
    try {
        const report = new CommunityReport({ url, reportDetails, anonymousId });
        await report.save();
        res.status(201).json({ message: 'Report submitted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting report.' });
    }
});

app.get('/api/reports/community', async (req, res) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const reports = await CommunityReport.find({ timestamp: { $gte: oneDayAgo } }).sort({ timestamp: -1 }).limit(50);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching community reports.' });
    }
});

// =================================================================
// Server Start
// =================================================================
const startServer = async () => {
    try {
        console.log("--- RENDER SERVER DEBUG ---");
        console.log(`BOT_API_KEY loaded: ${process.env.BOT_API_KEY ? `Yes. Starts with: '${process.env.BOT_API_KEY.substring(0, 5)}'` : 'NO, IT IS UNDEFINED!'}`);
        console.log("--------------------------");

        if (!process.env.MONGO_URI) {
            console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
            process.exit(1);
        }
        
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('SUCCESS: MongoDB Connected.');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server is running and listening on port ${PORT}`));
    } catch (error) {
        console.error('\n<<<<< FAILED TO START SERVER >>>>>');
        console.error('Error Details:', error);
        console.error('---------------------\n');
        process.exit(1);
    }
};

// Only start the server if this file is run directly
if (require.main === module) {
    startServer();
}

// Export the app for testing purposes
module.exports = app;