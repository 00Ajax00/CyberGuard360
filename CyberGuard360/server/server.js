// =================================================================
// CyberGuard360 Backend Server
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

// Rate Limiter: Basic protection against brute-force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
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
app.post('/api/users/register',
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({ message: 'User already exists.' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

            user = new User({ email: req.body.email, password: hashedPassword });
            await user.save();

            res.status(201).json({ message: 'User registered successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error during registration.' });
        }
    }
);

app.post('/api/users/login',
    body('email').isEmail(),
    body('password').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials.' });
            }

            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials.' });
            }

            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ message: 'Server error during login.' });
        }
    }
);

// --- Scanning and History ---
app.post('/api/scan', authMiddleware, async (req, res) => {
    const { url, scripts, behavior } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'URL is required.' });
    }

    let vulnerabilities = [];
    let score = 100;
    
    // 1. Retire.js Scan for outdated JS libraries
    if (scripts && scripts.length > 0) {
        const repo = retire.newRepo();
        await Promise.all(scripts.map(scriptUrl => retire.check(scriptUrl, repo)));
        const retireResults = retire.replace(repo.getResults(), retire.resolve);
        Object.keys(retireResults).forEach(key => {
            retireResults[key].results.forEach(result => {
                vulnerabilities.push({
                    type: 'Outdated Library',
                    description: `Vulnerable library found: ${result.component} v${result.version}. Severity: ${result.vulnerabilities[0].severity}.`,
                    severity: result.vulnerabilities[0].severity,
                    cveId: (result.vulnerabilities[0].identifiers.CVE || []).join(', ')
                });
            });
        });
    }

    // 2. Heuristic Phishing/Behavior Analysis
    if (behavior) {
        if (behavior.redirects > 2) {
            vulnerabilities.push({ type: 'Phishing Behavior', description: 'Site caused multiple rapid redirects.', severity: 'High' });
        }
        if (behavior.suspiciousFormInput) {
            vulnerabilities.push({ type: 'Phishing Behavior', description: 'Detected suspicious input in a form (e.g., a URL).', severity: 'Medium' });
        }
    }
    
    // 3. VirusTotal Domain Reputation Check (Optional)
    if (process.env.VIRUSTOTAL_API_KEY) {
        try {
            const domain = new URL(url).hostname;
            const response = await axios.get(`https://www.virustotal.com/api/v3/domains/${domain}`, {
                headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
            });
            const stats = response.data.data.attributes.last_analysis_stats;
            if (stats.malicious > 0 || stats.suspicious > 0) {
                vulnerabilities.push({ type: 'Domain Reputation', description: `VirusTotal detected this domain as potentially malicious or suspicious (${stats.malicious} hits).`, severity: 'High' });
            }
        } catch (error) {
            console.log('VirusTotal API error:', error.message); // Log error but don't fail the scan
        }
    }

    // 4. Calculate Security Score
    let vulnerabilityWeight = vulnerabilities.reduce((acc, vuln) => {
        if (vuln.severity === 'High') return acc + 15;
        if (vuln.severity === 'Medium') return acc + 10;
        return acc + 5;
    }, 0);
    score -= vulnerabilityWeight;
    score = Math.max(0, score); // Ensure score doesn't go below 0

    // 5. Generate Recommendations
    let recommendations = [];
    if (vulnerabilities.some(v => v.type === 'Phishing Behavior')) {
        recommendations.push("Be cautious with links and forms on this site. It exhibits phishing-like behavior.");
    }
    if (vulnerabilities.some(v => v.type === 'Outdated Library')) {
        recommendations.push("This site uses outdated software, which could be exploited. Avoid entering sensitive information.");
    }
    if (score < 50) {
        recommendations.push("This site has a low security score. Consider Browse elsewhere or using a VPN for added protection.");
    }
    if(recommendations.length === 0) {
        recommendations.push("Looks good! No major issues detected, but always browse safely.");
    }

    // 6. Save and send results
    try {
        const scanResult = new ScanResult({
            userId: req.user.id,
            url,
            vulnerabilities,
            securityScore: score,
        });
        await scanResult.save();

        res.json({ vulnerabilities, securityScore: score, recommendations });
    } catch (error) {
        res.status(500).json({ message: 'Error saving scan results.' });
    }
});

app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        const history = await ScanResult.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .limit(20);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history.' });
    }
});


// --- Community Reporting ---
app.post('/api/reports/submit', async (req, res) => {
    const { url, reportDetails, anonymousId } = req.body;
    if (!url || !reportDetails || !anonymousId) {
        return res.status(400).json({ message: 'URL, details, and anonymous ID are required.' });
    }

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
        const reports = await CommunityReport.find({ timestamp: { $gte: oneDayAgo } })
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching community reports.' });
    }
});

// =================================================================
// Server Start (Robust Debugging Version)
// =================================================================
const startServer = async () => {
    try {
        // Step 1: Verify that the MONGO_URI is loaded from the .env file
        if (!process.env.MONGO_URI) {
            console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
            console.error('Please ensure the .env file exists in the /backend directory and is configured correctly.');
            process.exit(1); // Exit with an error code
        }
        
        console.log('Attempting to connect to MongoDB...');
        
        // Step 2: Attempt to connect to the database
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds
        });
        
        console.log('SUCCESS: MongoDB Connected.');

        // Step 3: Start the Express server only after the DB is connected
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server is running and listening on port ${PORT}`));

    } catch (error) {
        console.error('\n<<<<< FAILED TO START SERVER >>>>>');
        console.error('An error occurred during server startup. This is often due to an incorrect MONGO_URI, a password error, or an IP address not being whitelisted in MongoDB Atlas.');
        console.error('\n--- Error Details ---');
        console.error(error);
        console.error('---------------------\n');
        process.exit(1); // Exit with an error code
    }
};

// Execute the startup function
startServer();