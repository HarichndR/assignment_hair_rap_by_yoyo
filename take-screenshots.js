const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    console.log("Navigating to Dashboard...");
    await page.goto('http://localhost:3000/');
    await new Promise(r => setTimeout(r, 4000)); // wait for charts and AI
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png'), fullPage: true });

    console.log("Opening AI Assistant...");
    await page.click('.ai-fab');
    await new Promise(r => setTimeout(r, 2000)); // wait for animation
    await page.screenshot({ path: path.join(screenshotsDir, 'ai-assistant.png') });

    // Close AI Assistant
    await page.click('.ai-fab');
    await new Promise(r => setTimeout(r, 500));

    console.log("Navigating to Services...");
    await page.goto('http://localhost:3000/services');
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, 'services.png'), fullPage: true });

    console.log("Navigating to Staff...");
    await page.goto('http://localhost:3000/staff');
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, 'staff.png'), fullPage: true });

    console.log("Navigating to API Tester...");
    await page.goto('http://localhost:3000/api-tester');
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, 'api-tester.png'), fullPage: true });

    await browser.close();
    console.log("Screenshots saved successfully.");
})();
