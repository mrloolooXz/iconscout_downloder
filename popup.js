// Popup script for IconScout Downloader Extension

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const countElement = document.getElementById('count');
    const statusElement = document.getElementById('status');
    const getUrlsButton = document.getElementById('getUrls');
    const clearUrlsButton = document.getElementById('clearUrls');
    
    // Update URL count
    function updateUrlCount() {
        chrome.runtime.sendMessage({action: 'getUrls'}, (response) => {
            if (response && response.success) {
                const count = response.urls ? response.urls.length : 0;
                countElement.textContent = count;
                
                if (count > 0) {
                    statusElement.textContent = `Active - ${count} URLs captured`;
                } else {
                    statusElement.textContent = 'Ready - No URLs captured yet';
                }
            }
        });
    }
    
    // Initialize popup
    updateUrlCount();
    
    // Update count every 2 seconds
    setInterval(updateUrlCount, 2000);
    
    // Get URLs button click
    getUrlsButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'getUrls'}, (response) => {
            if (response && response.success && response.urls) {
                if (response.urls.length > 0) {
                    // Create a new window to display URLs
                    const urlsText = response.urls.join('\n');
                    const blob = new Blob([urlsText], {type: 'text/plain'});
                    const url = URL.createObjectURL(blob);
                    
                    chrome.downloads.download({
                        url: url,
                        filename: 'captured_urls.txt',
                        saveAs: true
                    });
                } else {
                    alert('No URLs captured yet. Visit iconscout.com and browse animations to capture URLs.');
                }
            }
        });
    });
    
    // Clear URLs button click
    clearUrlsButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all captured URLs?')) {
            chrome.runtime.sendMessage({action: 'clearUrls'}, (response) => {
                if (response && response.success) {
                    updateUrlCount();
                    statusElement.textContent = 'URLs cleared successfully';
                }
            });
        }
    });
    
    // Add hover effects
    [getUrlsButton, clearUrlsButton].forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}); 