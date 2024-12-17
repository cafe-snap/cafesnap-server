const puppeteer = require("puppeteer");

const getadditionMediaCrawler = async (cookies, nextUrl, cafeInfo) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setCookie(...cookies);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto(nextUrl);
    await page.waitForSelector("iframe#cafe_main", { timeout: 30000 * 2 });

    let returnResultArray = [];
    let currentPageIndex = 1;
    const iframeElement = await page.$("iframe#cafe_main");
    let iframe = await iframeElement.contentFrame();
    const urlMarker = [];

    while ((returnResultArray.length < 6)) {
      await iframe.waitForSelector(".board-list", { timeout: 30000 * 2 });

      const articles = await iframe.evaluate(() => {
        const resultArray = [];
        const articleList = document.querySelectorAll(".board-list");

        articleList.forEach((list) => {
          const haveMedia = list.querySelector(".list-i-movie");
          const articleLink = list.querySelector("a.article");

          if (haveMedia && articleLink) {
            resultArray.push({
              postLink: articleLink.href,
              postName: articleLink.textContent.replace(/[\n\t]+/g, "").trim(),
            });
          }
        });
        return resultArray;
      });

      returnResultArray = returnResultArray.concat(
        articles.map((article) => ({
          cafeName: cafeInfo.cafeName,
          ...article,
        }))
      );

      if (returnResultArray.length >= 5) {
        break;
      }

      await iframe.waitForSelector(".prev-next");
      const paginationExists = await iframe.$(".prev-next");
      if (paginationExists) {
        const paginationLinks = await iframe.$$(".prev-next a");

        if (currentPageIndex < paginationLinks.length) {
          const nextPageHref = await paginationLinks[currentPageIndex].evaluate(
            (link) => link.href
          );

          if (nextPageHref) {
            urlMarker.push(nextPageHref);
            await page.goto(nextPageHref, { waitUntil: "networkidle2" });
            currentPageIndex++;
            iframe = await (await page.$("iframe#cafe_main")).contentFrame();
          } else {
            break;
          }
        } else {
          break;
        }
      } else {
        break;
      }
    }
    await browser.close();

    const returnUrl = (urlMarker.length > 1) ? urlMarker[urlMarker.length - 2] : null;

    return { success: true, message: returnResultArray, returnUrl };

  } catch (err) {
    throw new Error(`추가 미디어 리스트 크롤링 로직 에러 = ${err.message}`);
  }

};

module.exports = getadditionMediaCrawler;
