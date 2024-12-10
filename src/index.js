const express = require("express");
const cors = require("cors");
const loginCrawler = require("../src/crawling/login.js");
const getCafeUrlCrawler = require("../src/crawling/cafeUrl.js");
const getMediaCrawler = require("../src/crawling/media.js");
const app = express();
let cookiesFromLogin = null;

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.post("/login", async (_, res) => {
  try {
    cookiesFromLogin = await loginCrawler();

    if (cookiesFromLogin !== null) {
      res.json({ success: true, message: "로그인 성공" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/crowling", async (_, res) => {
  try {
    const cafeUrl = await getCafeUrlCrawler(cookiesFromLogin);
    const resultInfo = await getMediaCrawler(cookiesFromLogin, cafeUrl.message[1]);
    res.json(resultInfo);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(3000);
