import * as faceapi from "face-api.js";

import { state } from "./state";

function getMeanPosition(l: faceapi.Point[]) {
  return l
    .map((a) => [a.x, a.y])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
    .map((a: number) => a / l.length);
}

export const streamScorer = async (streams: MediaStream[]) => {
  if (!state.isModelReady) {
    Promise.resolve().then(async () => {
      await Promise.all([
        faceapi.loadTinyFaceDetectorModel(`${state.root}models`),
        faceapi.loadFaceLandmarkTinyModel(`${state.root}models`),
      ]);
      state.isModelReady = true;
    });
  }

  const wrappedStreams = streams.map((stream, index) => {
    const track = stream.getTracks()[0];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Used to kick the stream back to active unmuted state.
    const videoKicker = document.createElement("video");
    videoKicker.autoplay = true;

    const getScore = async () => {
      if (track.readyState !== "live") return Infinity;
      const imageCapture = new (window as any).ImageCapture(track);
      if (track.muted) {
        videoKicker.srcObject = stream;
        await new Promise((res) => (track.onunmute = res));
        videoKicker.srcObject = null;
      }
      if (!track.muted) {
        const photo = await imageCapture.grabFrame();
        if (canvas.width !== photo.width || canvas.height !== photo.height) {
          canvas.width = photo.width;
          canvas.height = photo.height;
        }
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

            return Math.abs(
              (eyeLeft[0] + (eyeRight[0] - eyeLeft[0]) / 2 - nose[0]) /
                detection.detection.box.width
            );
          }
        } catch {
          // Models not loaded?
        }
      } else {
        // console.log("still muted");
      }
      return Infinity;
    };

    return {
      getScore,
    };
  });

  return {
    stop: () => {
      for (const stream of streams) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    },
    getBestStreamIndex: async () => {
      if (!state.isModelReady) {
        return -1;
      }
      const scores = await Promise.all(
        wrappedStreams.map((wrapped) => wrapped.getScore())
      );
      let lowestScore = Infinity;
      let lowestIndex = -1;
      for (let index = 0; index < scores.length; index++) {
        const score = scores[index];
        if (score < lowestScore) {
          lowestScore = score;
          lowestIndex = index;
        }
      }
      return lowestIndex;
    },
  };
};
