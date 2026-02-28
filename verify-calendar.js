const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });

    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    console.log("Navigating to Schedule...");
    await page.goto('http://localhost:3000/schedule');
    await new Promise(r => setTimeout(r, 3000)); // wait for bookings

    // Select a date with bookings (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayToClick = tomorrow.getDate();

    console.log(`Clicking day ${dayToClick}...`);
    // Find cells that belong to current month and match the day number
    const cells = await page.$$('.day-cell:not(.day-cell--other)');
    for (let cell of cells) {
        const text = await page.evaluate(el => el.textContent, cell);
        // Note: day-cell might contain dots/labels, so we parse the first number found
        if (text && parseInt(text.trim()) === dayToClick) {
            await cell.click();
            break;
        }
    }


    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, 'schedule-calendar.png'), fullPage: true });

    await browser.close();
    console.log("Screenshot saved: screenshots/schedule-calendar.png");
})();
