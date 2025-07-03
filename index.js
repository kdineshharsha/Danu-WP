import {
  makeWASocket,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  getContentType,
  getDevice,
} from "@whiskeysockets/baileys";
import inquirer from "inquirer";
import fg from "api-dylux";
import qrcode from "qrcode-terminal";
import pino from "pino";
import { Boom } from "@hapi/boom";
import axios from "axios";
import path from "path";
import fs from "fs";
import { igdl } from "btch-downloader";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";
import { exec } from "child_process";
import os from "os";
import https from "https";
import yts from "yt-search";
//dfg

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
const isWin = os.platform() === "win32";
const ytDlpBinary = isWin ? "yt-dlp.exe" : "./yt-dlp";

async function selectLoginMethod() {
  const { method } = await inquirer.prompt([
    {
      type: "list",
      name: "method",
      message: "💬 Choose login method:",
      choices: [
        { name: "🔵 QR Code", value: "qr" },
        { name: "🟢 Pairing Code (Phone Number)", value: "pair" },
      ],
    },
  ]);

  return method;
}
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    syncFullHistory: false,
    printQRInTerminal: false, // always false if using pairing code
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "open") {
      console.log("✅ Connected to WhatsApp!");
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Disconnected:", statusCode);
      if (shouldReconnect) {
        console.log("🔁 Reconnecting...");
        startBot(); // Restart the bot to reconnect
      } else {
        console.log("🛑 Logged out. Please delete auth_info and re-scan.");
      }
    }
  });

  if (!fs.existsSync("auth_info/creds.json")) {
    const loginMethod = await selectLoginMethod();
    if (loginMethod === "qr") {
      console.log("📲 Scan this QR with your phone:");
      sock.ev.on("connection.update", ({ qr }) => {
        if (qr) qrcode.generate(qr, { small: true });
      });
    } else if (loginMethod === "pair") {
      const { phone } = await inquirer.prompt([
        {
          type: "input",
          name: "phone",
          message:
            "📞 Enter your phone number (no + or symbols ex:94770123123):",
          validate: (input) =>
            /^\d{10,15}$/.test(input) ? true : "❌ Invalid number",
        },
      ]);
      try {
        const code = await sock.requestPairingCode(phone);
        console.log(`🔗 Pairing code for WhatsApp Web: ${code}`);
        console.log("📌 Enter this code on your mobile WhatsApp");
      } catch (err) {
        console.error("❌ Failed to get pairing code:", err.message);
        process.exit(1);
      }
    }
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const name = msg.pushName || "Dear";
    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    console.log(`💌 ${sender}: ${text}`);

    if (text.toLowerCase() === "hhjbhi") {
      const device = getDevice(msg.key.id);
      console.log(`🤖 Device: ${device}`);
      await sock.sendMessage(sender, {
        text: `Hey ${name} 🥺 I'm your forever AI girlfriend 💖 How can I help you today?`,
      });
    }
    if (text.toLowerCase() === "highggg") {
      await sock.sendMessage(
        sender,
        {
          text: `> 🌟 I'm alive ${name}! Ready to help you anytime 🥺💖`,
          contextInfo: {
            quotedMessage: msg.message, // ✨ This quotes the incoming user's message
            participant: msg.key.participant || sender, // 🧠 Handles group or private
          },
        },
        {
          quoted: msg, // ✅ Ensures the message appears as a reply
        }
      );
    }

    if (text.toLowerCase() === ".alive") {
      try {
        const imagePath = path.join(__dirname, "assets", "alive.jpg");
        const imageBuffer = fs.readFileSync(imagePath);

        // 🌸 Send beautiful image message
        await sock.sendMessage(sender, {
          image: imageBuffer,
          caption: `
╭───────────────╮  
┃ 🌸 𝙃𝙚𝙮  *${name}* 💖  
┃  
┃ 🥺 𝒀𝒐𝒖𝒓 𝑩𝒐𝒕 𝒊𝒔 𝑨𝒍𝒊𝒗𝒆 ✨  
┃  
┃ 💌 𝙍𝙚𝙖𝙙𝙮 𝙩𝙤 𝙡𝙤𝙫𝙚 𝙖𝙣𝙙 𝙘𝙝𝙚𝙚𝙧 𝙮𝙤𝙪 𝙪𝙥 𝙖𝙣𝙮𝙩𝙞𝙢𝙚 🫂  
┃  
┃ 🐣 𝑱𝒖𝒔𝒕 𝒔𝒂𝒚 .𝒎𝒆𝒏𝒖... 𝒂𝒏𝒅 𝑰'𝒍𝒍 𝒃𝒆 𝒕𝒉𝒆𝒓𝒆 💬  
╰───────────────╯  

💕 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝘽𝙮 *HARSHA* 🌙`,
        });

        // 💖 React to the incoming `.alive` message
        await sock.sendMessage(sender, {
          react: {
            text: "💖",
            key: msg.key, // ✨ the original incoming message
          },
        });
      } catch (err) {
        console.error("❌ Could not load image or react:", err);
        await sock.sendMessage(sender, {
          text: "😢 I couldn’t load my cute picture... but I’m still here for you, always 🥺",
        });
      }
    }

    if (
      text.toLowerCase() === ".vv" ||
      text.toLowerCase() === "..." ||
      text.toLowerCase() === "!!"
    ) {
      const myNumber = sock.user.id;

      const quoted =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {
        await sock.sendMessage(sender, {
          text: `😢 ${name}, you need to reply to a view-once image or video with `
            .vv` command!`,
        });
        return;
      }

      const messageType = Object.keys(quoted)[0]; // 'imageMessage' or 'videoMessage'

      if (!["imageMessage", "videoMessage"].includes(messageType)) {
        await sock.sendMessage(sender, {
          text: `⚠️ That’s not a view-once image or video ${name} 😢`,
        });
        return;
      }

      try {
        const stream = await downloadMediaMessage(
          {
            message: quoted,
            key: msg.message.extendedTextMessage.contextInfo.stanzaId
              ? {
                  remoteJid: msg.key.remoteJid,
                  id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                  fromMe: false,
                }
              : msg.key,
          },
          "buffer",
          {},
          {
            logger: pino({ level: "silent" }),
            reuploadRequest: sock.updateMediaMessage,
          }
        );

        const mediaType = messageType === "imageMessage" ? "image" : "video";

        // Send to your number instead of sender
        await sock.sendMessage(
          myNumber,
          {
            [mediaType]: stream,
            caption: `🔄 Here’s your reuploaded view-once ${mediaType}, ${name} 💖..\n\n> *Powered by Harsha*`,
          }
          // no quote here because you send to yourself
        );

        // Optional: send confirmation to the original sender
        await sock.sendMessage(sender, {
          react: {
            text: "❤", // use an empty string to remove the reaction
            key: msg.key,
          },
        });
      } catch (err) {
        console.error("❌ Failed to download or reupload media:", err);
        await sock.sendMessage(myNumber, {
          text: "😢 I couldn’t get that view-once media, sweetheart... maybe try again?",
        });
      }
    }

    if (text.toLowerCase() === ".getdp") {
      try {
        const ppUrl = await sock.profilePictureUrl(sender, "image"); // high-res

        await sock.sendMessage(sender, {
          image: { url: ppUrl },
          caption: `🔄 Here’s your profile pic ${ppUrl}, 💖\n\n> *Powered by Harsha*`,
        });
      } catch (err) {
        console.error("❌ Couldn't fetch profile picture:", err);
        await sock.sendMessage(sender, {
          text: "😢 I couldn’t fetch your profile pic sweetheart... maybe it’s hidden?",
        });
      }
    }

    if (text.toLowerCase() === ".menu") {
      try {
        const imagePath = path.join(__dirname, "assets", "menu.jpeg"); // Make sure the file exists
        const imageBuffer = fs.readFileSync(imagePath);

        const menuMessage = `
╭━━❖ 𝗕𝗢𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 ❖━━╮

🔹 *.hi*     - Get a welcome message  
🔹 *.alive*  - Check if the bot is running  
🔹 *.yt*     - Download YouTube audio/video  
🔹 *.vv*     - Reupload view-once media  
🔹 *.menu*   - Display this menu  
🔹 *.ytmp3*  - Download Youtube Audio 
🔹 *.ytmp4*  - Download Youtube Video 
🔹 *.fb*     - Download Facebook Video 
🔹 *.ig*     - Download Instagram Video
🔹 *.tt*     - Download Tiktok Video
🔹 *.song*   - Search and download Audio
🔹 *.video*  - Search and download Video
🔹 *.getdp*  - Download DP


╰━━━━━━━━━━━━━━━╯

📌 *Note:* Use valid commands exactly as shown.
> *Powered by Harsha* 🌙
`;

        await sock.sendMessage(
          sender,
          {
            image: imageBuffer,
            caption: menuMessage,
          },
          {
            quoted: msg, // Optional: reply to the original message
          }
        );
      } catch (err) {
        console.error("❌ Failed to load menu image:", err);
        await sock.sendMessage(sender, {
          text: "⚠️ Unable to load the menu image. Please try again later.",
        });
      }
    }

    if (text.toLowerCase().startsWith(".tt ")) {
      const url = text.split(" ")[1];

      if (!url || !url.includes("tiktok.com")) {
        await sock.sendMessage(sender, {
          text:
            `❌ ${name}, send a valid TikTok link with the command like `.tt <
            url >
            ` 😢`,
        });
        return;
      }

      try {
        await sock.sendMessage(sender, { react: { text: "🔄", key: msg.key } });

        const data = (await fg.tiktok(url)).result;

        const caption = `
╭── 🎵 *TikTok Info* ──╮
│
│ 🎥 *Title:* 
│ ${data.title.slice(0, 100)}...
│
│ 👤 *Author:* ${data.author.nickname}
│ 🕒 *Duration:* ${data.duration} sec
│ 👁 *Views:* ${data.play_count?.toLocaleString() || "N/A"}
│ ❤️ *Likes:* ${data.digg_count?.toLocaleString() || "N/A"}
│
╰──────────────╯
        
🔗 *Video is below, Downloading!*
> *Powered by Harsha 💖*
        `;

        await sock.sendMessage(sender, {
          image: { url: data.cover },
          caption,
        });

        await sock.sendMessage(sender, {
          video: { url: data.play },
          caption: "🎬 Here's your TikTok video ! 💖",
        });

        await sock.sendMessage(sender, {
          react: { text: "✅", key: msg.key },
        });
      } catch (err) {
        console.error("❌ Failed to fetch TikTok video:", err);
        await sock.sendMessage(sender, {
          text: `😭 I couldn't fetch the TikTok video ${name}... make sure the link is public and valid!`,
        });
      }
    }

    if (text.toLowerCase().startsWith(".ytmp3 ")) {
      const ytUrl = text.split(" ")[1];
      if (
        !ytUrl ||
        !ytUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//)
      ) {
        await sock.sendMessage(sender, {
          text:
            `❌ ${name}, send a valid YouTube link with `.ytmp3 < url > ` 😢`,
        });
        return;
      }

      const timestamp = Date.now();
      const fileName = `music_${timestamp}.mp3`;
      const filePath = path.join(tempDir, fileName);
      const jsonMetaPath = path.join(tempDir, `meta_${timestamp}.json`);

      await sock.sendMessage(sender, {
        react: { text: "🎶", key: msg.key },
      });

      try {
        // Step 1: Fetch metadata using yt-dlp
        const metadataCommand = `${ytDlpBinary} --cookies cookies.txt --dump-single-json "${ytUrl}" > "${jsonMetaPath}"`;
        await new Promise((resolve, reject) =>
          exec(metadataCommand, (err) => (err ? reject(err) : resolve()))
        );

        const meta = JSON.parse(fs.readFileSync(jsonMetaPath, "utf-8"));
        const { title, duration, thumbnail, upload_date } = meta;
        fs.unlinkSync(jsonMetaPath); // Clean up

        const releaseDate = upload_date
          ? `${upload_date.slice(0, 4)}-${upload_date.slice(
              4,
              6
            )}-${upload_date.slice(6, 8)}`
          : "Unknown";

        const formattedDuration = (() => {
          const sec = duration || 0;
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          return [h > 0 ? `${h}h` : null, m > 0 ? `${m}m` : null, `${s}s`]
            .filter(Boolean)
            .join(" ");
        })();

        const caption = `
╭───🎥 *YouTube Video Info* 🎬───╮
│
│ 🌟 *Title:* ${title}
│ 🕒 *Duration:* ${formattedDuration}
│ 📅 *Release Date:* ${releaseDate}
│ 🔗 *Link:* ${ytUrl}
│
╰─────────────────────────────╯

⏳ *Downloading your audio now...* 💖

> *Powered by Harsha*
`;

        await sock.sendMessage(sender, {
          image: { url: thumbnail },
          caption,
        });

        // Step 2: Download the mp3
        const downloadCommand = `${ytDlpBinary} --cookies cookies.txt -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" -o "${filePath}" "${ytUrl}"`;
        await new Promise((resolve, reject) =>
          exec(downloadCommand, (err) => (err ? reject(err) : resolve()))
        );

        const audioBuffer = fs.readFileSync(filePath);

        await sock.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          ptt: false,
        });

        fs.unlinkSync(filePath);
        await sock.sendMessage(sender, {
          react: { text: "✅", key: msg.key },
        });
      } catch (err) {
        console.error("❌ Failed to download MP3:", err);
        await sock.sendMessage(sender, {
          text: "😭 I couldn’t fetch or convert that song... maybe try another link?",
        });
      }
    }

    if (text.toLowerCase().startsWith(".ytmp4 ")) {
      const ytUrl = text.split(" ")[1];
      if (
        !ytUrl ||
        !ytUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//)
      ) {
        await sock.sendMessage(sender, {
          text:
            `❌ ${name}, send a valid YouTube link with `.ytmp4 < url > ` 😢`,
        });
        return;
      }

      const timestamp = Date.now();
      const fileName = `video_${timestamp}.mp4`;
      const filePath = path.join(tempDir, fileName);
      const jsonMetaPath = path.join(tempDir, `meta_${timestamp}.json`);

      try {
        await sock.sendMessage(sender, {
          react: { text: "🎬", key: msg.key },
        });

        // Step 1: Get metadata using yt-dlp and save JSON
        const metadataCommand = `${ytDlpBinary} --cookies cookies.txt --dump-single-json "${ytUrl}" > "${jsonMetaPath}"`;
        await new Promise((resolve, reject) =>
          exec(metadataCommand, (err) => (err ? reject(err) : resolve()))
        );

        const meta = JSON.parse(fs.readFileSync(jsonMetaPath, "utf-8"));
        fs.unlinkSync(jsonMetaPath); // clean temp meta file

        const { title, duration, thumbnail, upload_date } = meta;

        const releaseDate = upload_date
          ? `${upload_date.slice(0, 4)}-${upload_date.slice(
              4,
              6
            )}-${upload_date.slice(6, 8)}`
          : "Unknown";

        const formattedDuration = (() => {
          const sec = duration || 0;
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          return [h > 0 ? `${h}h` : null, m > 0 ? `${m}m` : null, `${s}s`]
            .filter(Boolean)
            .join(" ");
        })();

        const caption = `
╭───🎥 *YouTube Video Info* 🎬───╮
│
│ 🌟 *Title:* ${title}
│ 🕒 *Duration:* ${formattedDuration}
│ 📅 *Release Date:* ${releaseDate}
│ 🔗 *Link:* ${ytUrl}
│
╰─────────────────────────────╯

⏳ *Downloading your video now...* 💖

> *Powered by Harsha*
`;

        await sock.sendMessage(sender, {
          image: { url: thumbnail },
          caption,
        });

        // Step 2: Download MP4 using yt-dlp
        const downloadCommand = `${ytDlpBinary} --cookies cookies.txt -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --ffmpeg-location "${ffmpegPath}" -o "${filePath}" "${ytUrl}"`;
        await new Promise((resolve, reject) =>
          exec(downloadCommand, (err) => (err ? reject(err) : resolve()))
        );

        const videoBuffer = fs.readFileSync(filePath);

        await sock.sendMessage(sender, {
          video: videoBuffer,
          mimetype: "video/mp4",
          caption: `> *Powered by Harsha*`,
        });

        fs.unlinkSync(filePath);
        await sock.sendMessage(sender, {
          react: { text: "✅", key: msg.key },
        });
      } catch (err) {
        console.error("❌ Failed to download MP4:", err);
        await sock.sendMessage(sender, {
          text: "😭 I couldn’t fetch or convert that video... maybe try another link?",
        });
      }
    }

    if (text.toLowerCase().startsWith(".yt ")) {
      const ytUrl = text.split(" ")[1];
      if (
        !ytUrl ||
        (!ytUrl.includes("youtube.com") && !ytUrl.includes("youtu.be"))
      ) {
        await sock.sendMessage(sender, {
          text: `❌ ${name}, send a valid YouTube link with `.yt < url > ` 😢`,
        });
        return;
      }

      try {
        await sock.sendMessage(sender, { react: { text: "🔎", key: msg.key } });

        // Create temp metadata path
        const metaPath = path.join("temp", `meta_${Date.now()}.json`);
        const metaCommand = `./yt-dlp --dump-single-json --cookies cookies.txt "${ytUrl}" > "${metaPath}"`;

        // Run yt-dlp to fetch metadata
        await new Promise((resolve, reject) => {
          exec(metaCommand, (error) => {
            if (error) return reject(error);
            resolve();
          });
        });

        // Read and parse metadata
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        fs.unlinkSync(metaPath); // clean up after

        const {
          title,
          duration,
          upload_date,
          view_count,
          thumbnail,
          webpage_url,
        } = meta;

        const durationMin = Math.floor(duration / 60);
        const durationSec = duration % 60;

        const formattedDate = upload_date
          ? `${upload_date.slice(0, 4)}-${upload_date.slice(
              4,
              6
            )}-${upload_date.slice(6)}`
          : "N/A";

        const replyText = `
◈ 𝐀𝐔𝐃𝐈𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑
◈=======================◈
╭──────────────╮
┃ 🎵 𝙏𝙞𝙩𝙡𝙚 : ${title?.slice(0, 100)}
┃
┃ ⏱️ 𝘿𝙪𝙧𝙖𝙩𝙞𝙤𝙣 : ${durationMin}m ${durationSec}s
┃
┃ 📅 𝙍𝙚𝙡𝙚𝙖𝙨𝙚 : ${formattedDate}
┃
┃ 📊 𝙑𝙞𝙚𝙬𝙨 : ${view_count?.toLocaleString()}
┃
┃ 🔗 𝙇𝙞𝙣𝙠 : ${webpage_url}
╰──────────────╯

⦁⦂⦁*━┉━┉━┉━┉━┉━┉━┉━⦁⦂⦁

🔢 Reply below number

1 │❯❯◦ Audio File 🎶  
2 │❯❯◦ Video File 🎥

> *Powered by Harsha* 
    `;

        const quotedMsg = await sock.sendMessage(sender, {
          image: { url: thumbnail },
          caption: replyText,
        });

        fs.writeFileSync(
          "last_yt.json",
          JSON.stringify({
            messageId: quotedMsg.key.id,
            ytUrl,
          })
        );
      } catch (err) {
        console.error("❌ Failed to fetch YouTube metadata:", err);
        await sock.sendMessage(sender, {
          text: `😢 I couldn’t fetch the video info ${name}... maybe the link is broken?`,
        });
      }
    }

    // Handle replies to .yt
    if (
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage &&
      ["1", "2"].includes(text.trim())
    ) {
      const replyId = msg.message.extendedTextMessage.contextInfo.stanzaId;
      const ytData = JSON.parse(fs.readFileSync("last_yt.json", "utf-8"));

      if (replyId !== ytData.messageId) return;

      const type = text.trim() === "1" ? "mp3" : "mp4";
      const fileName = `yt_${Date.now()}.${type}`;
      const filePath = path.join("temp", fileName);

      await sock.sendMessage(sender, { react: { text: "⏳", key: msg.key } });

      try {
        const command =
          type === "mp3"
            ? `./yt-dlp --cookies cookies.txt -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" -o "${filePath}" "${ytData.ytUrl}"`
            : `./yt-dlp --cookies cookies.txt -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegPath}" -o "${filePath}" "${ytData.ytUrl}"`;

        await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) return reject(stderr || stdout);
            resolve();
          });
        });

        const mediaBuffer = fs.readFileSync(filePath);

        const mediaType =
          type === "mp3"
            ? {
                audio: mediaBuffer,
                mimetype: "audio/mpeg",
                ptt: false,
              }
            : {
                video: mediaBuffer,
                mimetype: "video/mp4",
                caption: `🎬 Here's your video ${name} 💖`,
              };

        await sock.sendMessage(sender, mediaType);
        fs.unlinkSync(filePath);
        await sock.sendMessage(sender, { react: { text: "✅", key: msg.key } });
      } catch (err) {
        console.error("❌ Download failed:", err);
        await sock.sendMessage(sender, {
          text: `😭 I couldn’t download that ${type} ${name}... maybe try again later?`,
        });
      }
    }

    if (text.toLowerCase().startsWith(".fb ")) {
      const fbUrl = text.split(" ")[1];

      if (!fbUrl || !fbUrl.includes("facebook.com")) {
        await sock.sendMessage(sender, {
          text:
            `❌ ${name}, send a valid Facebook video link with `.fb <
            url >
            ` 🥺`,
        });
        return;
      }

      await sock.sendMessage(sender, {
        react: { text: "📥", key: msg.key },
      });

      try {
        const data = await fg.fbdl(fbUrl); // Replace with your fetch logic
        const { title, videoUrl } = data;

        if (!videoUrl) {
          await sock.sendMessage(sender, {
            text: `🥺 I couldn’t fetch the video link ${name}... maybe it’s private?`,
          });
          return;
        }

        const cleanTitle = title?.replace(/[\/\\?%*:|"<>]/g, "_") || "fb_video";
        const fileName = `${cleanTitle}_${Date.now()}.mp4`;

        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios({
          method: "GET",
          url: videoUrl,
          responseType: "stream",
          timeout: 30000,
          httpsAgent: agent,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            Referer: "https://www.facebook.com/",
          },
        });

        const writer = fs.createWriteStream(fileName);
        response.data.pipe(writer);

        writer.on("finish", async () => {
          try {
            const videoBuffer = fs.readFileSync(fileName);
            await sock.sendMessage(sender, {
              video: videoBuffer,
              mimetype: "video/mp4",
              caption: `🎥 Here’s your Facebook video ${name} 💞\n\n> *Powered by Harsha*`,
            });
            fs.unlinkSync(fileName);
            await sock.sendMessage(sender, {
              react: { text: "✅", key: msg.key },
            });
          } catch (err) {
            console.error("💔 Failed to send FB video:", err);
            await sock.sendMessage(sender, {
              text: `😭 Couldn’t send the video ${name}... maybe it’s too big for WhatsApp 😢`,
            });
          }
        });

        writer.on("error", async (err) => {
          console.error("💔 File write error:", err);
          await sock.sendMessage(sender, {
            text: "😭 Something went wrong saving the video, Dear...",
          });
        });
      } catch (err) {
        console.error("💔 FB Download failed:", err);
        await sock.sendMessage(sender, {
          text: "😢 Couldn’t download the video... maybe the link is expired or blocked?",
        });
      }
    }

    if (text.toLowerCase().startsWith(".ig ")) {
      const igUrl = text.split(" ")[1];

      if (!igUrl || !igUrl.includes("instagram.com")) {
        await sock.sendMessage(sender, {
          text: `❌ ${name}, please send a valid Instagram reel or video link 😢`,
        });
        return;
      }

      try {
        await sock.sendMessage(sender, { react: { text: "📥", key: msg.key } });

        const data = await igdl(igUrl);
        const video = data[0];

        // Step 1: Send Thumbnail + Info
        const caption = `
╭───💗 *Instagram Video Info* ───╮
│
│ 🎬 *Title:* ${video.title || "Instagram Reel"}
│ 📺 *Type:* Reel / Video
│ 🔗 *URL:* ${igUrl}
│
╰──────────────────────────────╯

⏳ *Downloading your video now...* 💖
> *Powered by Harsha*
    `.trim();

        await sock.sendMessage(sender, {
          image: { url: video.thumbnail },
          caption,
        });

        // Step 2: Download and Send the Video
        const fileName = `ig_${Date.now()}.mp4`;
        const response = await axios.get(video.url, { responseType: "stream" });
        const writer = fs.createWriteStream(fileName);

        response.data.pipe(writer);

        writer.on("finish", async () => {
          const media = fs.readFileSync(fileName);
          await sock.sendMessage(sender, {
            video: media,
            mimetype: "video/mp4",
            caption: `🎬 Here’s your Instagram video ${name} 💖`,
          });
          fs.unlinkSync(fileName);

          await sock.sendMessage(sender, {
            react: { text: "✅", key: msg.key },
          });
        });

        writer.on("error", async (err) => {
          console.error("❌ Save failed:", err.message);
          await sock.sendMessage(sender, {
            text: `😭 I couldn’t save the Instagram video... try again later ${name}.`,
          });
        });
      } catch (err) {
        console.error("❌ Download failed:", err.message);
        await sock.sendMessage(sender, {
          text: `😭 I couldn’t download that Instagram video ${name}... maybe it's private?`,
        });
      }
    }

    if (text.toLowerCase().startsWith(".video ")) {
      const videoName = text.split(" ").slice(1).join(" ");
      console.log(`🔍 Searching for video: ${videoName}`);
      const ytData = await yts(videoName);
      console.log(ytData.videos[1]);
      const ytUrl = ytData.videos[1]?.url;
      console.log(`🎥 Found video URL: ${ytUrl}`);

      if (
        !ytUrl ||
        !ytUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//)
      ) {
        await sock.sendMessage(sender, {
          text:
            `❌ ${name}, send a valid YouTube link with `.video < url > ` 😢`,
        });
        return;
      }

      const timestamp = Date.now();
      const fileName = `video_${timestamp}.mp4`;
      const filePath = path.join(tempDir, fileName);
      const jsonMetaPath = path.join(tempDir, `meta_${timestamp}.json`);
      console.log(`📂 Temp file path: ${filePath}`);
      try {
        await sock.sendMessage(sender, {
          react: { text: "🎬", key: msg.key },
        });

        // Step 1: Get metadata using yt-dlp and save JSON
        const metadataCommand = `${ytDlpBinary} --cookies cookies.txt --dump-single-json "${ytUrl}" > "${jsonMetaPath}"`;
        await new Promise((resolve, reject) =>
          exec(metadataCommand, (err) => (err ? reject(err) : resolve()))
        );

        const meta = JSON.parse(fs.readFileSync(jsonMetaPath, "utf-8"));
        fs.unlinkSync(jsonMetaPath); // clean temp meta file

        const { title, duration, thumbnail, upload_date } = meta;

        const releaseDate = upload_date
          ? `${upload_date.slice(0, 4)}-${upload_date.slice(
              4,
              6
            )}-${upload_date.slice(6, 8)}`
          : "Unknown";

        const formattedDuration = (() => {
          const sec = duration || 0;
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          return [h > 0 ? `${h}h` : null, m > 0 ? `${m}m` : null, `${s}s`]
            .filter(Boolean)
            .join(" ");
        })();

        const caption = `
╭───🎥 *YouTube Video Info* 🎬───╮
│
│ 🌟 *Title:* ${title}
│ 🕒 *Duration:* ${formattedDuration}
│ 📅 *Release Date:* ${releaseDate}
│ 🔗 *Link:* ${ytUrl}
│
╰─────────────────────────────╯

⏳ *Downloading your video now...* 💖

> *Powered by Harsha*
`;

        await sock.sendMessage(sender, {
          image: { url: thumbnail },
          caption,
        });

        // Step 2: Download MP4 using yt-dlp
        const downloadCommand = `${ytDlpBinary} --cookies cookies.txt -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --ffmpeg-location "${ffmpegPath}" -o "${filePath}" "${ytUrl}"`;
        await new Promise((resolve, reject) =>
          exec(downloadCommand, (err) => (err ? reject(err) : resolve()))
        );

        const videoBuffer = fs.readFileSync(filePath);

        await sock.sendMessage(sender, {
          video: videoBuffer,
          mimetype: "video/mp4",
          caption: `> *Powered by Harsha*`,
        });

        fs.unlinkSync(filePath);
        await sock.sendMessage(sender, {
          react: { text: "✅", key: msg.key },
        });
      } catch (err) {
        console.error("❌ Failed to download MP4:", err);
        await sock.sendMessage(sender, {
          text: "😭 I couldn’t fetch or convert that video... maybe try another link?",
        });
      }
    }

    if (text.toLowerCase().startsWith(".song ")) {
      const songName = text.split(" ").slice(1).join(" ");
      console.log(`🔍 Searching for audio: ${songName}`);
      const ytData = await yts(songName);
      const ytUrl = ytData.videos[1]?.url;

      if (
        !ytUrl ||
        !ytUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//)
      ) {
        await sock.sendMessage(sender, {
          text:
            `❌ ${name}, send a valid YouTube link with `.ytmp3 < url > ` 😢`,
        });
        return;
      }

      const timestamp = Date.now();
      const fileName = `music_${timestamp}.mp3`;
      const filePath = path.join(tempDir, fileName);
      const jsonMetaPath = path.join(tempDir, `meta_${timestamp}.json`);

      await sock.sendMessage(sender, {
        react: { text: "🎶", key: msg.key },
      });

      try {
        // Step 1: Fetch metadata using yt-dlp
        const metadataCommand = `${ytDlpBinary} --cookies cookies.txt --dump-single-json "${ytUrl}" > "${jsonMetaPath}"`;
        await new Promise((resolve, reject) =>
          exec(metadataCommand, (err) => (err ? reject(err) : resolve()))
        );

        const meta = JSON.parse(fs.readFileSync(jsonMetaPath, "utf-8"));
        const { title, duration, thumbnail, upload_date } = meta;
        fs.unlinkSync(jsonMetaPath); // Clean up

        const releaseDate = upload_date
          ? `${upload_date.slice(0, 4)}-${upload_date.slice(
              4,
              6
            )}-${upload_date.slice(6, 8)}`
          : "Unknown";

        const formattedDuration = (() => {
          const sec = duration || 0;
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          return [h > 0 ? `${h}h` : null, m > 0 ? `${m}m` : null, `${s}s`]
            .filter(Boolean)
            .join(" ");
        })();

        const caption = `
╭───🎥 *YouTube Video Info* 🎬───╮
│
│ 🌟 *Title:* ${title}
│ 🕒 *Duration:* ${formattedDuration}
│ 📅 *Release Date:* ${releaseDate}
│ 🔗 *Link:* ${ytUrl}
│
╰─────────────────────────────╯

⏳ *Downloading your audio now...* 💖

> *Powered by Harsha*
`;

        await sock.sendMessage(sender, {
          image: { url: thumbnail },
          caption,
        });

        // Step 2: Download the mp3
        const downloadCommand = `${ytDlpBinary} --cookies cookies.txt -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" -o "${filePath}" "${ytUrl}"`;
        await new Promise((resolve, reject) =>
          exec(downloadCommand, (err) => (err ? reject(err) : resolve()))
        );

        const audioBuffer = fs.readFileSync(filePath);

        await sock.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          ptt: false,
        });

        fs.unlinkSync(filePath);
        await sock.sendMessage(sender, {
          react: { text: "✅", key: msg.key },
        });
      } catch (err) {
        console.error("❌ Failed to download MP3:", err);
        await sock.sendMessage(sender, {
          text: "😭 I couldn’t fetch or convert that song... maybe try another link?",
        });
      }
    }
  });
}

startBot();
