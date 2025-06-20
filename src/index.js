const express = require("express");
const cors = require("cors");
const loginCrawler = require("../src/crawling/login.js");
const getInitialResource = require("../src/crawling/initial.js");
const getCafeUrlCrawler = require("../src/crawling/cafeUrl.js");
const getMediaCrawler = require("../src/crawling/media.js");
const getKeywordCrawler = require("../src/crawling/keyword.js");
const getadditionMediaCrawler = require("../src/crawling/additionMedia.js");
const app = express();
let cookiesFromLogin = null;

app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://www.cafe-snap.com", "https://cafe-snap.com"]
    : "http://localhost:5173"
}));

app.get("/health", (req, res) => {
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.post("/login", async (_, res) => {
  try {
    cookiesFromLogin = await loginCrawler();

    if (cookiesFromLogin !== null) {
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/posts/initial", async (_, res) => {
  try {
    const cafeUrlList = await getCafeUrlCrawler(cookiesFromLogin);
    const initialMediaList = await getMediaCrawler(cookiesFromLogin, cafeUrlList[0]);
    const returnUrl = initialMediaList.returnUrl;
    const mediaResource = await getInitialResource(cookiesFromLogin, initialMediaList.message);
    res.json({ success: true, message: { cafeUrlList, mediaResource, returnUrl }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/posts/selection", async (req, res) => {
  try {
    const url = req.body;
    if (!url) {
      return (
        res.status(400).json({ success: false, message: "url 수신 실패" })
      );
    }
    const initialMediaList = await getMediaCrawler(cookiesFromLogin, url);
    const returnUrl = initialMediaList.returnUrl;
    const mediaResource = await getInitialResource(cookiesFromLogin, initialMediaList.message);
    res.json({ success: true, message: { mediaResource, returnUrl }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/posts/keyword", async (req, res) => {
  try {
    const { keyword, cafeInfo } = req.body;
    if (!keyword || !cafeInfo) {
      return (
        res.status(400).json({ success: false, message: "데이터 수신 실패" })
      );
    }
    const mediaList = await getKeywordCrawler(cookiesFromLogin, cafeInfo, keyword);
    const mediaResource = await getInitialResource(cookiesFromLogin, mediaList.message);
    res.json({ success: true, message: mediaResource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/posts/addition", async (req, res) => {
  try {
    const { nextUrl, cafeInfo }  = req.body;
    if (!nextUrl || !cafeInfo) {
      return (
        res.status(400).json({ success: false, message: "데이터 수신 실패" })
      );
    }
    const MediaList = await getadditionMediaCrawler(cookiesFromLogin, nextUrl, cafeInfo);
    const returnUrl = MediaList.returnUrl;
    const mediaResource = await getInitialResource(cookiesFromLogin, MediaList.message);
    res.json({ success: true, message: { mediaResource, returnUrl }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
