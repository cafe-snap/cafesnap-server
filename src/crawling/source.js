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
          let videoSrcList = [];

          const interceptSrcNetwork = async (response) => {
            const requestUrl = response.url();
            if (requestUrl.includes("apis.naver.com/rmcnmv/rmcnmv/vod/play")) {
              try {
                const responseJson = await response.json();
                const videoList = responseJson.videos?.list;

                if (videoList && Array.isArray(videoList)) {
                  const videoQuality = videoList.find((v) => v.encodingOption.name === "720p")
                    || videoList.find((v) => v.encodingOption.name === "480p")
                    || videoList.find((v) => v.encodingOption.name === "270p");

                  if (videoQuality && videoQuality.source) {
                    videoSrcList.push(videoQuality.source);
                  }
                }
              } catch (err) {
                throw new Error(`동영상 리소스 추출중 네트워크 응답 실패: ${err.message}`);
              }
            }
          };

          page.on("response", interceptSrcNetwork);
          await page.goto(detailInfo.postLink, { waitUntil: "domcontentloaded" });
          await page.waitForSelector("iframe#cafe_main", { timeout: 30000 * 2 });
          const iframeGetter = await page.$("iframe#cafe_main");
          if (!iframeGetter) {
            continue;
          }
          const iframe = await iframeGetter.contentFrame();
          if (!iframe) {
            continue;
          }
          await iframe.waitForSelector(".article_container", { timeout: 30000 * 2 });
          await iframe.waitForSelector(".prismplayer-area", { timeout: 30000 * 2 });

          const imgSrc = await iframe.$$eval("div.article_viewer img",
            (imgs) => imgs.map((img) => img.getAttribute("src"))
          ).catch(() => []);

          await new Promise((resolve) => setTimeout(resolve, 2000));

          const combinedMediaInfo = [...imgSrc, ...videoSrcList].map((src) => ({
            src,
            cafeName: detailInfo.cafeName,
            postName: detailInfo.postName,
            postLink: detailInfo.postLink,
          }));

          mediaSrcList.push(...combinedMediaInfo);
          page.off("response", interceptSrcNetwork);
        } catch (err) {
          throw new Error(`동영상 리소스 추출중 네트워크 성공후 로직에러 발생: ${err.message}`);
        }
      }
    }

    await browser.close();

    const groupedByCafe = mediaSrcList.reduce((acc, info) => {
      if (!acc[info.cafeName]) {
        acc[info.cafeName] = [];
      }
      acc[info.cafeName].push(info);
      return acc;
    }, {});

    return { success: true, message: groupedByCafe };
  } catch (err) {
    throw new Error(`미디어 리소스 추출 에러: ${err.message}`);
  }
};

module.exports = getMediaResource;
