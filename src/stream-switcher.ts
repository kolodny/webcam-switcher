import { SettingsValue } from "./default-settings";

import { scoredStream } from "./scored-stream";

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
  const { constraints, root, videoDevices, getUserMedia, settings } = args;

  const sources = (
    await Promise.all(
      videoDevices.map(async (device) => {
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
        const stream = await getUserMedia.call(
          navigator.mediaDevices,
          streamConstraints
        );
        return scoredStream({
          stream,
          settings,
          root,
        });
      })
    )
  ).filter((v): v is NonNullable<typeof v> => !!v);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  let currentStreamIndex = 0;
  let checks = Date.now();
  const updateStream = () => {
    let smallestSoFar = Infinity;
    let indexOfSmallest = 0;
    for (const [index, source] of Object.entries(sources)) {
      const absScore = Math.abs(source.score);
      if (absScore < smallestSoFar) {
        smallestSoFar = absScore;
        indexOfSmallest = +index;
      }
    }
    if (indexOfSmallest !== currentStreamIndex) {
      if (Date.now() - checks > settings.checksNeededToSwitch) {
        currentStreamIndex = indexOfSmallest;
        checks = Date.now();
      }
    } else {
      checks = Date.now();
    }
    let videoToUse = sources[currentStreamIndex].video;
    canvas.width = videoToUse.videoWidth;
    canvas.height = videoToUse.videoHeight;
    ctx.drawImage(videoToUse, 0, 0, canvas.width, canvas.height);
    requestedAnimationFrame = requestAnimationFrame(() => updateStream());
  };
  let requestedAnimationFrame = requestAnimationFrame(() => updateStream());
  const captured = canvas.captureStream();
  captured.addEventListener("inactive", () => {
    sources.forEach((source) => {
      source.stop();
    });
    cancelAnimationFrame(requestedAnimationFrame);
  });
  return captured;
};
