// Content Script برای اکستنشن IconScout - فقط باکس‌های ID

console.log('=== Content Script فعال شد ===');

// تابع استخراج عدد از ID
function extractNumberFromId(id) {
    if (!id) return 'بدون ID';
    const match = id.match(/\d+/);
    return match ? match[0] : 'بدون عدد';
}

// تابع جستجوی لینک دانلود JSON بر اساس ID
function findDownloadUrl(animationId) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({action: 'getUrls'}, (response) => {
            if (response && response.success && response.urls) {
                // جستجو در URL ها برای پیدا کردن JSON مربوط به این ID
                const jsonUrl = response.urls.find(url => 
                    url.includes(animationId) && 
                    (url.includes('.json') || url.includes('application/json'))
                );
                
                if (jsonUrl) {
                    console.log(`🎯 لینک دانلود برای ID ${animationId}:`, jsonUrl);
                    resolve(jsonUrl);
                } else {
                    console.log(`❌ لینک دانلود برای ID ${animationId} پیدا نشد`);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
}

// تابع دانلود فایل JSON
function downloadJsonFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'animation.json';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`📥 دانلود شروع شد: ${filename}`);
}

// تابع دانلود فایل عکس
function downloadImageFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'image.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`📥 دانلود عکس شروع شد: ${filename}`);
}

// تابع اضافه کردن لینک دانلود عکس
function addImageDownloadLinks() {
    const articles = $('article');
    
    articles.each(function() {
        const article = $(this);
        
        // اگر قبلاً لینک دانلود عکس اضافه شده، نادیده بگیر
        if (article.find('.image-download-link').length > 0) {
            return;
        }
        
        // دنبال تگ picture بگرد
        const picture = article.find('picture');
        
        if (picture.length > 0) {
            // دنبال source یا img داخل picture
            let imageUrl = null;
            let imageType = 'jpg';
            
            // ابتدا source را چک کن
            const source = picture.find('source');
            if (source.length > 0) {
                imageUrl = source.attr('srcset') || source.attr('src');
                if (imageUrl) {
                    // استخراج نوع فایل از URL
                    const urlMatch = imageUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i);
                    if (urlMatch) {
                        imageType = urlMatch[1];
                    }
                }
            }
            
            // اگر source نبود، img را چک کن
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
            
            // اگر عکس پیدا شد، لینک دانلود اضافه کن
            if (imageUrl) {
                // استخراج نام فایل از URL
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
                    " title="دانلود عکس">
                        دانلود
                    </div>
                `);
                
                // اضافه کردن کلیک برای دانلود
                downloadLink.on('click', function() {
                                            // تغییر ظاهر در حین دانلود
                        $(this).css('background', '#ff9800').text('در حال...');
                    
                    try {
                        downloadImageFile(imageUrl, fileName);
                        
                        // نمایش موفقیت
                        $(this).css('background', '#4CAF50').text('دانلود شد!');
                        setTimeout(() => {
                            $(this).css('background', '#30303061').text('دانلود');
                        }, 2000);
                    } catch (error) {
                        console.log('❌ خطا در دانلود عکس:', error);
                        $(this).css('background', '#f44336').text('خطا');
                        setTimeout(() => {
                            $(this).css('background', '#30303061').text('دانلود');
                        }, 2000);
                    }
                });
                
                // اضافه کردن hover effect
                downloadLink.on('mouseenter', function() {
                    $(this).css('background', '#404040');
                }).on('mouseleave', function() {
                    $(this).css('background', '#30303061');
                });
                
                // اطمینان از relative positioning
                if (article.css('position') === 'static') {
                    article.css('position', 'relative');
                }
                
                article.append(downloadLink);
                console.log(`📷 لینک دانلود عکس اضافه شد: ${fileName}`);
            }
        }
    });
}

// تابع حذف لینک‌های دانلود عکس
function removeImageDownloadLinks() {
    $('.image-download-link').remove();
}

// تابع اضافه کردن باکس ID با قابلیت دانلود
function addIdBoxes() {
    const allLottiePlayers = $('lottie-player');
    
    allLottiePlayers.each(function(index) {
        const lottie = $(this);
        const fullId = lottie.attr('id') || 'بدون ID';
        const numberId = extractNumberFromId(fullId);
        
        // ابتدا article را جستجو کن
        let parentElement = lottie.closest('article');
        
        // اگر article پیدا نکرد، main با کلاس gridContainer را جستجو کن
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
                    " title="کلیک برای دانلود JSON">
                        ${numberId}
                    </div>
                `);
                
                // اضافه کردن کلیک برای دانلود
                idBox.on('click', async function() {
                    if (numberId === 'بدون عدد') {
                        console.log('❌ ID معتبر نیست');
                        return;
                    }
                    
                    // تغییر ظاهر در حین جستجو
                    $(this).css('background', '#ff9800').text('جستجو...');
                    
                    try {
                        const downloadUrl = await findDownloadUrl(numberId);
                        
                        if (downloadUrl) {
                            // دانلود فایل
                            const filename = `animation_${numberId}.json`;
                            downloadJsonFile(downloadUrl, filename);
                            
                            // نمایش موفقیت
                            $(this).css('background', '#4CAF50').text('دانلود شد!');
                            setTimeout(() => {
                                $(this).css('background', '#30303061').text(numberId);
                            }, 2000);
                        } else {
                            // نمایش خطا
                            $(this).css('background', '#f44336').text('یافت نشد');
                            setTimeout(() => {
                                $(this).css('background', '#30303061').text(numberId);
                            }, 2000);
                        }
                    } catch (error) {
                        console.log('❌ خطا در دانلود:', error);
                        $(this).css('background', '#f44336').text('خطا');
                        setTimeout(() => {
                            $(this).css('background', '#30303061').text(numberId);
                        }, 2000);
                    }
                });
                
                // اضافه کردن hover effect
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

// تابع حذف باکس‌های ID
function removeIdBoxes() {
    $('.id-box').remove();
}

// تابع دریافت URL های ذخیره شده
function getUrls() {
    chrome.runtime.sendMessage({action: 'getUrls'}, (response) => {
        if (response && response.success) {
            console.log('📋 URL های ذخیره شده:', response.urls);
            console.log('📊 تعداد:', response.urls.length);
        }
    });
}

// تابع پاک کردن URL ها
function clearUrls() {
    chrome.runtime.sendMessage({action: 'clearUrls'}, (response) => {
        if (response && response.success) {
            console.log('🗑️ URL ها پاک شدند');
        }
    });
}

// شروع خودکار
function startEverything() {
    console.log('🚀 شروع باکس‌های ID و لینک‌های دانلود عکس...');
    
    // اضافه کردن باکس‌های ID
    addIdBoxes();
    
    // اضافه کردن لینک‌های دانلود عکس
    addImageDownloadLinks();
    
    // اسکن مداوم هر ثانیه
    setInterval(() => {
        addIdBoxes();
        addImageDownloadLinks();
    }, 1000);
    
    console.log('✅ آماده! باکس‌های ID و لینک‌های دانلود عکس نمایش داده می‌شوند.');
    console.log('📋 برای دیدن URL ها: getUrls()');
    console.log('🗑️ برای پاک کردن URL ها: clearUrls()');
    console.log('💡 کلیک روی باکس‌ها برای دانلود JSON');
    console.log('📷 کلیک روی آیکون عکس برای دانلود تصویر');
}

// اجرای خودکار
startEverything();

// اضافه کردن به window برای دسترسی از کنسول
window.addIdBoxes = addIdBoxes;
window.removeIdBoxes = removeIdBoxes;
window.addImageDownloadLinks = addImageDownloadLinks;
window.removeImageDownloadLinks = removeImageDownloadLinks;
window.getUrls = getUrls;
window.clearUrls = clearUrls; 