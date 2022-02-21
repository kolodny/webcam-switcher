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

let id = 0;

export const scoredStream = (args: Arguments) => {
  const { stream, root, settings, index } = args;
  const track = stream.getTracks()[0];
  let modelIsReady = false;
  setTimeout(async () => {
    await Promise.all([
      faceapi.loadTinyFaceDetectorModel(`${root}models`),
      faceapi.loadFaceLandmarkTinyModel(`${root}models`),
    ]);
    modelIsReady = true;
  }, 100);
  // const video = document.createElement("video");
  const scored = {
    // video,
    score: Infinity,
    stop: () => {
      console.log("stopping");
      stopped = true;
      for (const track of stream.getTracks()) {
        track.stop();
      }
    },
  };
  let stopped = false;
  let lastChecked = 0;
  const update = async () => {
    if (stopped) {
      return;
    }
    // console.log("update");
    const now = Date.now();
    if (
      modelIsReady
      // && now - lastChecked > (settings.checkInterval as number)
    ) {
      lastChecked = now;
      let track = stream.getTracks()[0];
      // track.enabled = true;
      // if (track.muted) {
      //   console.log("was muted");
      //   track = (await (window as any).makeStreams[1]()).getTracks()[0];
      //   track.onunmute = () => {
      //     console.log("unmuted", index);
      //   };
      //   console.log("track.muted", track.muted, index);
      // }
      const imageCapture = new (window as any).ImageCapture(track);
      if (!track.muted) {
        const photo = await imageCapture.grabFrame();
        if (canvas.width !== photo.width || canvas.height !== photo.height) {
          canvas.width = photo.width;
          canvas.height = photo.height;
        }
        // track.enabled = false;

        ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
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
      } else {
        // console.log("muted", track);
      }
    }

    setTimeout(() => update(), +settings.checkInterval);
  };
  const video = document.createElement("video");
  video.addEventListener("playing", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    update();
  });
  // video.setAttribute(
  //   "style",
  //   `position: fixed;
  // top: 0;
  // left: ${id++ * 100}px;
  // height: 100px;
  // width: 100px;
  // z-index: 10000;`
  // );
  // document.body.appendChild(video);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  video.autoplay = true;
  video.srcObject = canvas.captureStream();
  requestAnimationFrame(() => update());

  return scored;
};
