const puppeteer = require("puppeteer");

const getMediaCrawler = async (cookies, urlArray) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setCookie(...cookies);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto(urlArray.cafeLink);
    await page.waitForSelector(".box-g-m", { timeout: 10000 });
    await page.click("#menuLink0", { delay: 49 });
    await page.waitForSelector("iframe#cafe_main", {timeout: 10000});

    const iframeGetter = await page.$("iframe#cafe_main");
    const iframe = await iframeGetter.contentFrame();
    await iframe.waitForSelector(".board-list", { timeout: 10000 });

    const getArticleInfo = await iframe.evaluate((urlArray) => {
      const articleList = document.querySelectorAll(".board-list");
      const resultArray = [];

      articleList.forEach((list) => {
        const haveMedia = list.querySelector(".list-i-img, .list-i-movie");

        if (haveMedia) {
          const articleLink = list.querySelector("a.article");

          if (articleLink) {
            resultArray.push({
              cafeName: urlArray.cafeName,
              postLink: articleLink.href,
              postName: articleLink.textContent.replace(/[\n\t]+/g, "").trim(),
            });
          }
        }
      });

      return (
        resultArray
      );
    }, urlArray);

    await browser.close();

    return (
      { success: true, message: getArticleInfo }
    );
  } catch (err) {
    throw new Error(`카페별 미디어 크롤링 로직 에러 = ${err.message}`);
  }
};

module.exports = getMediaCrawler;
