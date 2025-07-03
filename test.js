import { igdl } from "btch-downloader";
import axios from "axios";
import fs from "fs";
const url = "https://www.instagram.com/reels/DKZBLeQsUNk/";

async function downloadInstagramReel() {
  try {
    const data = await igdl(url);
    const video = data[0];

    const downloadUrl = video.url;
    const fileName = `reel_${Date.now()}.mp4`;

    console.log("📥 Downloading:", video.title);

    const response = await axios.get(downloadUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(fileName);

    response.data.pipe(writer);

    writer.on("finish", () => {
      console.log(`✅ Download complete: ${fileName}`);
    });

    writer.on("error", (err) => {
      console.error("❌ Error saving file:", err.message);
    });
  } catch (error) {
    console.error("❌ Failed to download reel:", error.message);
  }
}

downloadInstagramReel();
