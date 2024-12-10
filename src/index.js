const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const app = express();
let myAllCafeList = null;
let cookiesFromLogin = null;

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

const startCrawling = async (cookies) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    let listMoreBtn = true;

    await page.setCookie(...cookies);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto("https://section.cafe.naver.com/ca-fe/home");
    await page.waitForSelector(".mycafe_list", { timeout: 128 });

    while (listMoreBtn) {
      try {
        await page.waitForSelector(".btn_item_more", { visible: true, timeout: 3000 });
        await page.click(".btn_item_more", { delay: 103 });
      } catch {
        listMoreBtn = false;
      }
    }

    const getMyAllCafeList = await page.evaluate(() => {
      const cafeList = document.querySelectorAll(".mycafe_info");

      return Array.from(cafeList).map(info => {
        const cafeLink = info.querySelector("a").href;
        const cafeName = info.querySelector("a").textContent;

        return (
          { cafeName, cafeLink }
        );
      });
    });
    myAllCafeList = getMyAllCafeList;

    await browser.close();

    return (
      { success: true, message: myAllCafeList }
    );
  } catch (err) {
    throw new Error (`크롤링 로직 에러 = ${err.message}`);
  }
};

app.post("/login", async (_, res) => {
  try {
    cookiesFromLogin = await loginHelper();

    if (cookiesFromLogin !== null) {
      res.json({ success: true, message: "로그인 성공" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/crowling", async (_, res) => {
  try {
    const cafeData = await startCrawling(cookiesFromLogin);
    res.json(cafeData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(3000);
