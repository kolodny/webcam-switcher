import { SettingsValue } from "./default-settings";

import { scoredStream } from "./scored-stream";
import { transform } from "./converter";

interface Arguments {
  constraints: MediaStreamConstraints;
  root: string;
  videoDevices: MediaDeviceInfo[];
  settings: SettingsValue;
  getUserMedia: (
    constraints?: MediaStreamConstraints | undefined
  ) => Promise<MediaStream>;
}

export const streamSwitcher = async (args: Arguments) => {
  const { constraints, root, videoDevices, getUserMedia, settings, streams } =
    args;

  const sources = (
    await Promise.all(
      videoDevices.map(async (device, index) => {
        if (!constraints.video || typeof constraints.video === "boolean") {
          return;
        }
        const streamConstraints = {
          ...constraints,
          video: {
            ...constraints.video,
            deviceId: { exact: device.deviceId },
          },
        };
        // const stream = await getUserMedia.call(
        //   navigator.mediaDevices,
        //   streamConstraints
        // );
        const stream = streams[index];
        return scoredStream({
          index,
          stream,
          settings,
          root,
        });
      })
    )
  ).filter((v): v is NonNullable<typeof v> => !!v);

  let currentStreamIndex = 0;
  let checks = Date.now();
  let stopped = false;
  const updateStream = () => {
    // console.log("updateStream");
    if (stopped) {
      return;
    }
    let smallestSoFar = Infinity;
    let indexOfSmallest = 0;
    for (const [index, source] of Object.entries(sources)) {
      const absScore = Math.abs(source.score);
      console.log({ index, absScore });
      if (absScore < smallestSoFar) {
        smallestSoFar = absScore;
        indexOfSmallest = +index;
      }
    }
    if (indexOfSmallest !== currentStreamIndex) {
      if (Date.now() - checks > settings.checksNeededToSwitch) {
        console.log("switching", indexOfSmallest, currentStreamIndex);
        currentStreamIndex = indexOfSmallest;
        checks = Date.now();
      }
    } else {
      checks = Date.now();
    }
    // let videoToUse = sources[currentStreamIndex].video;
    // canvas.width = videoToUse.videoWidth;
    // canvas.height = videoToUse.videoHeight;
    // ctx.drawImage(videoToUse, 0, 0, canvas.width, canvas.height);
    setTimeout(() => updateStream(), +settings.checkInterval);
  };
  requestAnimationFrame(() => updateStream());
  // captured.addEventListener("inactive", () => {
  //   stopped = true;
  //   sources.forEach((source) => {
  //     source.stop();
  //   });
  // });
  // const vid = document.createElement("video");
  // vid.setAttribute(
  //   "style",
  //   `position: fixed;
  // top: 0;
  // right: 0px;
  // height: 100px;
  // width: 100px;
  // z-index: 10000;`
  // );
  // vid.autoplay = true;
  // vid.srcObject = captured;
  // document.body.appendChild(vid);

  // return transform(captured);
};
