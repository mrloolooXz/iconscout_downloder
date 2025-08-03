// Background Script for tracking requests

console.log('=== Background Script Activated ===');

// Array to store URLs
let capturedUrls = [];

// Track request start
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.type === 'xmlhttprequest' || details.type === 'main_frame') {
            // Add URL to array (only once)
            if (!capturedUrls.includes(details.url)) {
                capturedUrls.push(details.url);
                console.log(`🔗 ${details.url}`);
                console.log(`📝 Total count: ${capturedUrls.length}`);
            }
        }
    },
    {
        urls: [
            "https://*/*"
        ]
    },
    ["requestBody"]
);

// Display extension status
chrome.runtime.onInstalled.addListener(() => {
    console.log('=== Extension Installed ===');
    console.log('✅ URL tracking activated');
});

// Add listener for startup
chrome.runtime.onStartup.addListener(() => {
    console.log('=== Extension Started ===');
    console.log('✅ URL tracking activated');
});

// Add message listener for communication with content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getUrls') {
        sendResponse({success: true, urls: capturedUrls});
    } else if (request.action === 'clearUrls') {
        capturedUrls = [];
        console.log('🗑️ URL array cleared');
        sendResponse({success: true});
    } else {
        sendResponse({success: true});
    }
}); 