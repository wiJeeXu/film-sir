#!/usr/bin/env node
const prompt = require("prompt");
const download = require("./download");
prompt.start();

prompt.get(
  [
    {
      name: "m3u8Url",
      description: "请输入m3u8文本URL",
      type: "string",
      required: true,
    },
    {
      name: "videoUrl",
      description: "请输入视频下载地址",
      type: "string",
      required: true,
    },
    {
      name: "tempDir",
      description: "请输入临时下载目录",
      type: "string",
      required: true,
    },
    {
      name: "targetDir",
      description: "请输入目标文件夹",
      type: "string",
      required: true,
    },
    {
      name: "fileName",
      description: "请输入存储视频名称",
      type: "string",
      required: true,
    },
  ],
  function (err, results) {
    if (err) throw new Error(err);
    download(results);
  }
);
