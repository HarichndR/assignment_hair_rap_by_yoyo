const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function verifyDashboard() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        console.log("Navigating to Dashboard...");
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });

        // Wait for stats to load
        await page.waitForSelector('.stat-card__value');

        console.log("Taking Dashboard screenshot...");
        if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
        await page.screenshot({ path: 'screenshots/dashboard-verify.png', fullPage: true });

        console.log("Navigating to Bookings...");
        await page.goto('http://localhost:3000/bookings', { waitUntil: 'networkidle2' });

        await page.waitForSelector('.data-table');

        console.log("Taking Bookings screenshot...");
        await page.screenshot({ path: 'screenshots/bookings-verify.png', fullPage: true });

        console.log("Verification screenshots saved.");

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await browser.close();
    }
}

verifyDashboard();
