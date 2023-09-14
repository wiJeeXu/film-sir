const axios = require("axios");
const fs = require("fs");
var ProgressBar = require("progress");

async function getList(url) {
  const res = await axios.get(url);
  return res.data.split("\n").filter((str) => !/^#/.test(str) && str != "");
}

async function writeVideo(list, videoUrl, tempDir) {
  let index = 0;
  const length = list.length;
  let start = 0;
  let offset = 5;
  var bar = new ProgressBar(":bar", { total: Math.ceil(length / offset) });

  while (start < length) {
    let end = start + offset;
    if (end > length) {
      end = length;
    }

    async function getData() {
      const chunks = await getChunks(list.slice(start, end), videoUrl);
      let bufData = Buffer.alloc(0);
      bufData = Buffer.concat([
        bufData,
        ...chunks.map((chunk) => Buffer.from(chunk)),
      ]);
      start = end;
      try {
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir);
        }
        fs.writeFileSync(`${tempDir}/tmp${index}.mp4`, bufData, () => {});
      } catch (error) {
        console.log("报错---->");
        console.log(error);
      }
    }
    try {
      await getData();
    } catch (error) {
      console.log(error);
      await getData();
    }
    index++;
    bar.tick();
  }
  console.log("完成下载");
}
async function getRange(url, str) {
  const res = await axios.get(`${url}${str}`, {
    responseType: "arraybuffer", // 获取二进制数据
  });
  // console.log(res.data);
  return res.data;
}

async function getChunks(list, videoUrl) {
  return await Promise.all(list.map((str) => getRange(videoUrl, str)));
}

function mergeVideos(videos, output) {
  console.log("合并视频开始");
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(output);
    writeStream.on("close", () => {
      console.log("合并视频结束");
      resolve();
    });

    let currentIndex = 0;

    function appendNext() {
      if (currentIndex >= videos.length) {
        writeStream.end();
        return;
      }

      const readStream = fs.createReadStream(videos[currentIndex]);
      readStream.on("end", () => {
        currentIndex++;
        appendNext();
      });

      readStream.pipe(writeStream, { end: false });
    }

    appendNext();
  });
}

function download({ m3u8Url, videoUrl, tempDir, targetDir, fileName }) {
  getList(m3u8Url).then(async (list) => {
    console.log("开始下载视频");
    await writeVideo(list, videoUrl, tempDir);
    const files = fs.readdirSync(tempDir);

    function extractNumber(filename) {
      const match = filename.match(/(\d+)\.mp4$/);
      return match ? parseInt(match[1]) : 0;
    }

    const sortedFiles = files.sort((a, b) => {
      return extractNumber(a) - extractNumber(b);
    });

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }
    const outputVideo = `${targetDir}/${fileName}.mp4`;

    mergeVideos(
      sortedFiles.map((str) => `${tempDir}/${str}`),
      outputVideo
    ).then(() => {
      const path = require("path");

      function deleteDirectory(directory) {
        if (fs.existsSync(directory)) {
          fs.readdirSync(directory).forEach((file) => {
            const currentPath = path.join(directory, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
              deleteDirectory(currentPath); // recurse
            } else {
              fs.unlinkSync(currentPath); // delete file
            }
          });
          fs.rmdirSync(directory); // delete directory
        }
      }

      const directoryPath = tempDir; // 替换为你的目录路径
      deleteDirectory(directoryPath);
    });
  });
}
module.exports = download;
