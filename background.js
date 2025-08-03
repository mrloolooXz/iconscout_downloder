// Background Script برای ردیابی درخواست‌ها

console.log('=== Background Script فعال شد ===');

// آرایه برای ذخیره URL ها
let capturedUrls = [];

// ردیابی شروع درخواست
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.type === 'xmlhttprequest' || details.type === 'main_frame') {
            // اضافه کردن URL به آرایه (فقط یک بار)
            if (!capturedUrls.includes(details.url)) {
                capturedUrls.push(details.url);
                console.log(`🔗 ${details.url}`);
                console.log(`📝 تعداد کل: ${capturedUrls.length}`);
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

// نمایش وضعیت extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('=== Extension نصب شد ===');
    console.log('✅ ردیابی URL ها فعال شد');
});

// اضافه کردن listener برای شروع
chrome.runtime.onStartup.addListener(() => {
    console.log('=== Extension شروع شد ===');
    console.log('✅ ردیابی URL ها فعال شد');
});

// اضافه کردن message listener برای ارتباط با content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getUrls') {
        sendResponse({success: true, urls: capturedUrls});
    } else if (request.action === 'clearUrls') {
        capturedUrls = [];
        console.log('🗑️ آرایه URL ها پاک شد');
        sendResponse({success: true});
    } else {
        sendResponse({success: true});
    }
}); 