const puppeteer = require("puppeteer");

const loginCrawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto("https://nid.naver.com/nidlogin.login", { timeout: 30000 * 2 });
    await page.waitForNavigation();

    const browserContext = browser.defaultBrowserContext();
    const cookieList = await browserContext.cookies();
    await browser.close();

    return (
      cookieList
    );
  } catch (err) {
    throw new Error (`로그인 및 쿠키 추출 로직 에러 = ${err.message}`);
  }
};

module.exports = loginCrawler;