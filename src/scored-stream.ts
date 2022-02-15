import * as faceapi from "face-api.js";
import { SettingsValue } from "./default-settings";

function getMeanPosition(l: faceapi.Point[]) {
  return l
    .map((a) => [a.x, a.y])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
    .map((a: number) => a / l.length);
}

interface Arguments {
  stream: MediaStream;
  root: string;
  settings: SettingsValue;
}

export const scoredStream = (args: Arguments) => {
  const { stream, root, settings } = args;
  let modelIsReady = false;
  setTimeout(async () => {
    await Promise.all([
      faceapi.loadTinyFaceDetectorModel(`${root}models`),
      faceapi.loadFaceLandmarkTinyModel(`${root}models`),
    ]);
    modelIsReady = true;
  }, 100);
  const video = document.createElement("video");
  let requestedAnimationFrame: number;
  const scored = {
    video,
    score: 0,
    stop: () => {
      cancelAnimationFrame(requestedAnimationFrame);
      for (const track of stream.getTracks()) {
        track.stop();
      }
    },
  };
  let i = 0;
  const update = async () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const checkEvery = Math.floor((settings.checkInterval as number) / 16);
    if (modelIsReady && i++ % checkEvery === 0) {
      i = 1;
      try {
        const detection = await faceapi
          .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);
        if (detection) {
          // Face is detected
          const eyeRight = getMeanPosition(detection.landmarks.getRightEye());
          const eyeLeft = getMeanPosition(detection.landmarks.getLeftEye());
          const nose = getMeanPosition(detection.landmarks.getNose());

          scored.score =
            (eyeLeft[0] + (eyeRight[0] - eyeLeft[0]) / 2 - nose[0]) /
            detection.detection.box.width;
        } else {
          // Face was not detected
        }
      } catch {
        // Models not loaded?
      }
    }

    requestedAnimationFrame = requestAnimationFrame(() => update());
  };
  video.addEventListener("playing", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    update();
  });
  video.srcObject = stream;
  video.autoplay = true;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  return scored;
};
