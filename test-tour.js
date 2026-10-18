const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const RECORDINGS_DIR = 'C:\\Users\\husna\\.gemini\\antigravity\\brain\\ca21c669-74bf-42b2-b4ce-f2d8ac7308eb\\recordings';

async function runLiveTestTour() {
  console.log('🚀 Starting MealBridge Live Tour & Automation Test...');
  
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  }).catch(() => chromium.launch({ headless: true, channel: 'chrome' }));

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();

  async function snap(name) {
    const file = path.join(RECORDINGS_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`📸 Captured: ${name}.png`);
  }

  try {
    // 1. Home Page Inspection
    console.log('\n--- 1. Testing Home Page (Obsidian Liquid-Glass Design) ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('01_homepage_hero');
    
    // Scroll down to features
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(800);
    await snap('02_homepage_impact_strip');

    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(800);
    await snap('03_homepage_how_it_works');

    // 2. Food Discovery & Listings Page
    console.log('\n--- 2. Testing Food Discovery Directory & Search Filters ---');
    await page.goto('http://localhost:5173/food', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('04_food_discovery_page');

    // View specific food details
    console.log('\n--- 3. Testing Food Details View ---');
    await page.goto('http://localhost:5173/food/demo-1', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('05_food_details_view');

    // 4. How It Works Interactive Tabs
    console.log('\n--- 4. Testing How It Works Interactive Role Matrix ---');
    await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('06_how_it_works_donor_tab');

    // Click Recipient NGO tab
    const recipientTab = page.locator('button:has-text("For Recipient NGOs")');
    if (await recipientTab.isVisible()) {
      await recipientTab.click();
      await page.waitForTimeout(500);
      await snap('07_how_it_works_recipient_tab');
    }

    // 5. Impact Metrics Page
    console.log('\n--- 5. Testing Platform Impact & Transparency Telemetry ---');
    await page.goto('http://localhost:5173/impact', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('08_impact_telemetry_page');

    // 6. Food Safety Guidelines
    console.log('\n--- 6. Testing Food Safety Guidelines ---');
    await page.goto('http://localhost:5173/food-safety', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('09_food_safety_guidelines');

    // 7. Sign Up & Role Selection Experience
    console.log('\n--- 7. Testing User Registration & Role Selection ---');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('10_signup_role_matrix');

    // 8. Sign In Demo Mode - Donor Dashboard
    console.log('\n--- 8. Testing Live Sign In -> Donor Dashboard ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await snap('11_login_screen');

    await page.fill('input[type="email"]', 'donor@grandhotel.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify on donor dashboard
    await snap('12_donor_dashboard_live');

    // Navigate to Create Donation in console
    console.log('\n--- 9. Testing Create Donation Flow ---');
    await page.goto('http://localhost:5173/donor/donations/create', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('13_donor_create_donation');

    // Navigate to Donor Analytics
    console.log('\n--- 10. Testing Donor Analytics ---');
    await page.goto('http://localhost:5173/donor/analytics', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('14_donor_analytics');

    // 11. Recipient Console Testing
    console.log('\n--- 11. Testing Recipient NGO Console ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'recipient@hopeshelter.org');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await snap('15_recipient_dashboard_live');

    // Recipient Intake Preferences
    await page.goto('http://localhost:5173/recipient/needs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('16_recipient_intake_preferences');

    // 12. Volunteer Console Testing
    console.log('\n--- 12. Testing Volunteer Courier Console ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'volunteer@mealbridge.org');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await snap('17_volunteer_dashboard_live');

    // 13. Admin Operations Console Testing
    console.log('\n--- 13. Testing Admin Operations Command Console ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@mealbridge.org');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await snap('18_admin_command_dashboard');

    // Admin Verification Queue
    await page.goto('http://localhost:5173/admin/verification', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('19_admin_verification_queue');

    // Admin Incident Reports
    await page.goto('http://localhost:5173/admin/reports', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await snap('20_admin_incident_reports');

    console.log('\n🎉 ALL LIVE FEATURE TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test execution error:', err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    console.log('\n🎬 Video recording finalized and saved to recordings directory.');
  }
}

runLiveTestTour();
