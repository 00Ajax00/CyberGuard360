document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authView = document.getElementById('auth-view');
    const mainView = document.getElementById('main-view');
    const loader = document.getElementById('loader');

    // --- Utility Functions ---
    const showView = (view) => {
        authView.classList.add('hidden');
        mainView.classList.add('hidden');
        document.getElementById(view).classList.remove('hidden');
    };

    const showLoader = (show) => {
        loader.classList.toggle('hidden', !show);
    };

    const displayError = (view, message) => {
        const errorEl = document.getElementById(`${view}-error`);
        if (errorEl) {
            errorEl.textContent = message;
            setTimeout(() => errorEl.textContent = '', 4000);
        }
    };
    
    // --- API Communication ---
    const API_BASE_URL = 'http://localhost:3000/api';
    
    const apiRequest = async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'An error occurred.');
            }
            return data;
        } catch (error) {
            throw error;
        }
    };

    // --- Authentication ---
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput.value, password: passwordInput.value }),
            });
            await chrome.storage.local.set({ jwt_token: data.token });
            initMainView();
        } catch (error) {
            displayError('auth', error.message);
        }
    });

    registerBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput.value, password: passwordInput.value }),
            });
            alert(data.message); // Simple feedback
            emailInput.value = '';
            passwordInput.value = '';
        } catch (error) {
            displayError('auth', error.message);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await chrome.storage.local.remove('jwt_token');
        showView('auth-view');
    });

    // --- Main Application Logic ---
    const initMainView = () => {
        showView('main-view');
        setupTabs();
        // Load initial data for the default tab
        document.querySelector('.tab-btn[data-view="scan-view"]').click();
    };
    
    const setupTabs = () => {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const viewId = button.getAttribute('data-view');
                tabContents.forEach(content => content.classList.add('hidden'));
                document.getElementById(viewId).classList.remove('hidden');

                // Load data for the selected tab
                if (viewId === 'history-view') fetchHistory();
                if (viewId === 'community-view') fetchCommunityReports();
            });
        });
    };
    
    // --- Scan Functionality ---
    const scanBtn = document.getElementById('scan-btn');
    scanBtn.addEventListener('click', async () => {
        showLoader(true);
        displayError('main', '');

        // 1. Get page data from content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const pageData = await chrome.runtime.sendMessage({ action: 'getPageDataForScan', tabId: tab.id });

        // 2. Send data to background script for API call
        const response = await chrome.runtime.sendMessage({ action: 'api/scan', data: pageData });
        
        showLoader(false);
        if (response.error) {
            displayError('main', response.error);
        } else if (response.success) {
            updateScanUI(response.data);
        }
    });
    
    const updateScanUI = (data) => {
        // Security Score
        const scoreEl = document.getElementById('security-score');
        const scoreBar = document.getElementById('score-bar');
        scoreEl.textContent = data.securityScore;
        scoreBar.style.width = `${data.securityScore}%`;
        if (data.securityScore > 80) scoreBar.style.backgroundColor = '#28a745';
        else if (data.securityScore > 50) scoreBar.style.backgroundColor = '#ffc107';
        else scoreBar.style.backgroundColor = '#dc3545';

        // Vulnerabilities
        const vulnList = document.getElementById('vulnerabilities-list');
        vulnList.innerHTML = '';
        if(data.vulnerabilities.length === 0){
             vulnList.innerHTML = '<li>No vulnerabilities found.</li>';
        } else {
            data.vulnerabilities.forEach(v => {
                const li = document.createElement('li');
                li.innerHTML = `<strong class="vuln-${v.severity.toLowerCase()}">${v.type}:</strong> ${v.description}`;
                vulnList.appendChild(li);
            });
        }
       
        // Recommendations
        const recList = document.getElementById('recommendations-list');
        recList.innerHTML = '';
        data.recommendations.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            recList.appendChild(li);
        });
    };

    // --- History & Community Reports ---
    const fetchHistory = async () => {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '<li>Loading history...</li>';
        const response = await chrome.runtime.sendMessage({ action: 'api/history' });
        
        if (response.error) {
            historyList.innerHTML = `<li class="error-message">${response.error}</li>`;
        } else if(response.success) {
            historyList.innerHTML = '';
            if (response.data.length === 0) {
                 historyList.innerHTML = '<li>No scan history found.</li>';
            } else {
                response.data.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="url">${item.url}</span> - Score: ${item.securityScore}`;
                    historyList.appendChild(li);
                });
            }
        }
    };
    
    const fetchCommunityReports = async () => {
        const communityList = document.getElementById('community-reports-list');
        communityList.innerHTML = '<li>Loading community reports...</li>';
        const response = await chrome.runtime.sendMessage({ action: 'api/reports/community' });

        if (response.error) {
            communityList.innerHTML = `<li class="error-message">${response.error}</li>`;
        } else if (response.success) {
            communityList.innerHTML = '';
            if (response.data.length === 0) {
                communityList.innerHTML = '<li>No recent community reports.</li>';
            } else {
                response.data.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="url">${item.url}</span>: ${item.reportDetails}`;
                    communityList.appendChild(li);
                });
            }
        }
    };

    const submitReportBtn = document.getElementById('submit-report-btn');
    submitReportBtn.addEventListener('click', async () => {
        const details = document.getElementById('report-details').value;
        if (!details) {
            displayError('main', 'Report details cannot be empty.');
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        
        // Get or create an anonymous ID
        const { anonymousId } = await chrome.runtime.sendMessage({ action: 'getAnonymousId' });
        
        const response = await chrome.runtime.sendMessage({
            action: 'api/reports/submit',
            data: { url, reportDetails: details, anonymousId }
        });
        
        if(response.error){
            displayError('main', response.error);
        } else if(response.success) {
            alert('Report submitted. Thank you for contributing!');
            document.getElementById('report-details').value = '';
        }
    });

    // --- Initial Check ---
    (async () => {
        const { jwt_token } = await chrome.storage.local.get('jwt_token');
        if (jwt_token) {
            initMainView();
        } else {
            showView('auth-view');
        }
    })();
});