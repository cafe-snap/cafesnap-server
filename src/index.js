const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

const loginHelper = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto("https://nid.naver.com/nidlogin.login");
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

const startCrawling = async (cookies) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setCookie(...cookies);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto("https://section.cafe.naver.com/ca-fe/home");
    await browser.close();

    return (
      { success: true, message: "네이버 카페 크롤링 성공" }
    );
  } catch (err) {
    throw new Error (`크롤링 로직 에러 = ${err.message}`);
  }
};

app.post("/main", async (_,res) => {
  try {
    const cookiesFromLogin = await loginHelper();
    const cafeData = await startCrawling(cookiesFromLogin);

    res.json(cafeData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(3000);
