import { chromium } from 'playwright';
import * as fs from 'fs';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: './public/reels/',
      size: { width: 430, height: 932 }
    },
    viewport: { width: 430, height: 932 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log("Navigating to account...");
    await page.goto('https://www.instagram.com/astronatofficial/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000); 
    
    console.log("Checking for popups...");
    try {
      const closeBtn = page.locator('svg[aria-label="Close"]');
      if (await closeBtn.count() > 0) {
         await closeBtn.first().click({timeout: 2000});
      }
    } catch(e) {}
    
    console.log("Clicking first post...");
    const firstPost = page.locator('a[href^="/p/"], a[href^="/reel/"]').first();
    if (await firstPost.count() > 0) {
      await firstPost.click();
      console.log("Recording video for 5 seconds...");
      await page.waitForTimeout(5000); 
    } else {
      console.log("No posts found. Is Instagram blocking access?");
    }
  } catch(e) {
    console.error("Script error:", e);
  }
  
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  
  if (videoPath) {
     console.log("Video saved to:", videoPath);
     fs.renameSync(videoPath, './public/reels/reel1.webm');
  }
})();
