const puppeteer = require("puppeteer");

const getMediaResource = async (cookies, cafeInfoArray) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const mediaSrcList = [];

    await page.setCookie(...cookies);
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    for (const cafeInfo of cafeInfoArray) {
      for (const detailInfo of cafeInfo.message) {
        try {
          await page.goto(detailInfo.postLink, { waitUntil: "domcontentloaded" });
          await page.waitForSelector("iframe#cafe_main", { timeout: 10000 });

          const iframeGetter = await page.$("iframe#cafe_main");
          const iframe = await iframeGetter.contentFrame();
          await iframe.waitForSelector(".article_container", { timeout: 10000 });

          const imgSrc = await iframe.$eval("div.article_viewer img",
            (img) => img.getAttribute("src")
          ).catch(() => null);

          const videoSrc = await iframe.$eval("video",
            (video) => video.getAttribute("src")
          ).catch(() => null);

          mediaSrcList.push(imgSrc);
          mediaSrcList.push(videoSrc);
        } catch (err) {
          throw new Error(`미디어 리소스 추출 내부로직 에러발생 = ${err.message}`);
        }
      }
    }

    await browser.close();
    return (
      { success: true, message: mediaSrcList }
    );
  } catch (err) {
    throw new Error(`미디어 리소스 추출 에러 = ${err.message}`);
  }
};

module.exports = getMediaResource;
