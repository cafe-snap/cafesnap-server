const puppeteer = require("puppeteer");

const getCafeUrlCrawler = async (cookies) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let listMoreBtn = true;

    await page.setCookie(...cookies);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto("https://section.cafe.naver.com/ca-fe/home");
    await page.waitForSelector(".mycafe_list", { timeout: 30000 * 2 });

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
      const cafeLogo = document.querySelectorAll(".mycafe_area");

      const logoData = Array.from(cafeLogo).map(logo => {
        const areaLink = logo.querySelector("a")?.href || null;
        const logoSrc = logo.querySelector("img")?.src || null;
        return (
          { areaLink, logoSrc }
        );
      });

      return Array.from(cafeList).map(info => {
        const cafeLink = info.querySelector("a").href;
        const cafeName = info.querySelector("a").textContent;

        const matchedArea = logoData.find(area => area.areaLink === cafeLink);
        const cafeLogo = matchedArea?.logoSrc || null;

        return (
          { cafeName, cafeLink, cafeLogo }
        );
      });
    });

    await browser.close();

    return (
      getMyAllCafeList
    );
  } catch (err) {
    console.error(`가입 카페목록 크롤링 로직 에러 = ${err.message}`);
  }
};

module.exports = getCafeUrlCrawler;
