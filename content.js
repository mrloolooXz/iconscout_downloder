// Content Script for IconScout Extension - ID boxes only

console.log('=== Content Script Activated ===');

// Function to extract number from ID
function extractNumberFromId(id) {
    if (!id) return 'No ID';
    const match = id.match(/\d+/);
    return match ? match[0] : 'No Number';
}

// Function to search for download JSON link based on ID
function findDownloadUrl(animationId) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({action: 'getUrls'}, (response) => {
            if (response && response.success && response.urls) {
                // Search URLs to find JSON related to this ID
                const jsonUrl = response.urls.find(url => 
                    url.includes(animationId) && 
                    (url.includes('.json') || url.includes('application/json'))
                );
                
                if (jsonUrl) {
                    console.log(`🎯 Download link for ID ${animationId}:`, jsonUrl);
                    resolve(jsonUrl);
                } else {
                    console.log(`❌ Download link for ID ${animationId} not found`);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
}

// Function to download JSON file
function downloadJsonFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'animation.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`📥 Download started: ${filename}`);
}

// Function to download image file
function downloadImageFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`📥 Image download started: ${filename}`);
}

// Function to add image download links
function addImageDownloadLinks() {
    const articles = $('article');
    
    articles.each(function() {
        const article = $(this);
        
        // If image download link already added, skip
        if (article.find('.image-download-link').length > 0) {
            return;
        }
        
        // Look for picture tag
        const picture = article.find('picture');
        
        if (picture.length > 0) {
            // Look for source or img inside picture
            let imageUrl = null;
            let imageType = 'jpg';
            
            // First check source
            const source = picture.find('source');
            if (source.length > 0) {
                imageUrl = source.attr('srcset') || source.attr('src');
                if (imageUrl) {
                    // Extract file type from URL
                    const urlMatch = imageUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i);
                    if (urlMatch) {
                        imageType = urlMatch[1];
                    }
                }
            }
            
            // If no source, check img
            if (!imageUrl) {
                const img = picture.find('img');
                if (img.length > 0) {
                    imageUrl = img.attr('src');
                    if (imageUrl) {
                        const urlMatch = imageUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i);
                        if (urlMatch) {
                            imageType = urlMatch[1];
                        }
                    }
                }
            }
            
            // If image found, add download link
            if (imageUrl) {
                // Extract filename from URL
                const fileName = imageUrl.split('/').pop().split('?')[0] || `image.${imageType}`;
                
                const downloadLink = $(`
                    <div class="image-download-link" style="
                        position: absolute;
                        left: 3px;
                        background: #30303061;
                        color: white;
                        padding: 0px 6px;
                        border-radius: 4px;
                        font-size: 12px;
                        z-index: 10;
                        top: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                    " title="Download Image">
                        Download
                    </div>
                `);
                
                // Add click for download
                downloadLink.on('click', function() {
                    // Change appearance during download
                    $(this).css('background', '#ff9800').text('Downloading...');
                    
                    try {
                        downloadImageFile(imageUrl, fileName);
                        
                        // Show success
                        $(this).css('background', '#4CAF50').text('Downloaded!');
                        setTimeout(() => {
                            $(this).css('background', '#30303061').text('Download');
                        }, 2000);
                    } catch (error) {
                        console.log('❌ Error downloading image:', error);
                        $(this).css('background', '#f44336').text('Error');
                        setTimeout(() => {
                            $(this).css('background', '#30303061').text('Download');
                        }, 2000);
                    }
                });
                
                // Add hover effect
                downloadLink.on('mouseenter', function() {
                    $(this).css('background', '#404040');
                }).on('mouseleave', function() {
                    $(this).css('background', '#30303061');
                });
                
                // Ensure relative positioning
                if (article.css('position') === 'static') {
                    article.css('position', 'relative');
                }
                
                article.append(downloadLink);
                console.log(`📷 Image download link added: ${fileName}`);
            }
        }
    });
}

// Function to remove image download links
function removeImageDownloadLinks() {
    $('.image-download-link').remove();
}

// Function to add ID boxes with download capability
function addIdBoxes() {
    const allLottiePlayers = $('lottie-player');
    
    allLottiePlayers.each(function(index) {
        const lottie = $(this);
        const fullId = lottie.attr('id') || 'No ID';
        const numberId = extractNumberFromId(fullId);
        
        // First search for article
        let parentElement = lottie.closest('article');
        
        // If article not found, search for main with gridContainer class
        if (parentElement.length === 0) {
            parentElement = lottie.closest('main.gridContainer, main[class*="gridContainer"]');
        }
        
        if (parentElement.length > 0) {
            if (parentElement.find('.id-box').length === 0) {
                const idBox = $(`
                    <div class="id-box" style="
                        position: absolute;
                        left: 3px;
                        background: #30303061;
                        color: white;
                        padding: 0px 6px;
                        border-radius: 4px;
                        font-size: 12px;
                        z-index: 10;
                        top: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                    " title="Click to download JSON">
                        Download
                    </div>
                `);
                
                // Add click for download
                idBox.on('click', async function() {
                    if (numberId === 'No Number') {
                        console.log('❌ Invalid ID');
                        return;
                    }
                    
                    // Change appearance during search
                    $(this).css('background', '#ff9800').text('Searching...');
                    
                    try {
                        const downloadUrl = await findDownloadUrl(numberId);
                        
                        if (downloadUrl) {
                            // Download file
                            const filename = `animation_${numberId}.json`;
                            downloadJsonFile(downloadUrl, filename);
                            
                            // Show success
                            $(this).css('background', '#4CAF50').text('Downloaded!');
                            setTimeout(() => {
                                $(this).css('background', '#30303061').text('Download');
                            }, 2000);
                        } else {
                            // Show error
                            $(this).css('background', '#f44336').text('Not Found');
                            setTimeout(() => {
                                $(this).css('background', '#30303061').text('Download');
                            }, 2000);
                        }
                    } catch (error) {
                        console.log('❌ Download error:', error);
                        $(this).css('background', '#f44336').text('Error');
                        setTimeout(() => {
                            $(this).css('background', '#30303061').text('Download');
                        }, 2000);
                    }
                });
                
                // Add hover effect
                idBox.on('mouseenter', function() {
                    $(this).css('background', '#404040');
                }).on('mouseleave', function() {
                    $(this).css('background', '#30303061');
                });
                
                if (parentElement.css('position') === 'static') {
                    parentElement.css('position', 'relative');
                }
                
                parentElement.append(idBox);
            }
        }
    });
}

// Function to remove ID boxes
function removeIdBoxes() {
    $('.id-box').remove();
}

// Function to get saved URLs
function getUrls() {
    chrome.runtime.sendMessage({action: 'getUrls'}, (response) => {
        if (response && response.success) {
            console.log('📋 Saved URLs:', response.urls);
            console.log('📊 Count:', response.urls.length);
        }
    });
}

// Function to clear URLs
function clearUrls() {
    chrome.runtime.sendMessage({action: 'clearUrls'}, (response) => {
        if (response && response.success) {
            console.log('🗑️ URLs cleared');
        }
    });
}

// Auto start
function startEverything() {
    console.log('🚀 Starting ID boxes and image download links...');
    
    // Add ID boxes
    addIdBoxes();
    
    // Add image download links
    addImageDownloadLinks();
    
    // Continuous scan every second
    setInterval(() => {
        addIdBoxes();
        addImageDownloadLinks();
    }, 1000);
    
    console.log('✅ Ready! ID boxes and image download links are displayed.');
    console.log('📋 To see URLs: getUrls()');
    console.log('🗑️ To clear URLs: clearUrls()');
    console.log('💡 Click on boxes to download JSON');
    console.log('📷 Click on image icon to download image');
}

// Auto execute
startEverything();

// Add to window for console access
window.addIdBoxes = addIdBoxes;
window.removeIdBoxes = removeIdBoxes;
window.addImageDownloadLinks = addImageDownloadLinks;
window.removeImageDownloadLinks = removeImageDownloadLinks;
window.getUrls = getUrls;
window.clearUrls = clearUrls; 