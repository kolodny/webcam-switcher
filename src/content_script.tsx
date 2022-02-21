import { defaultSettings } from "./default-settings";
import { mixableStream } from "./rtc";
import { streamSwitcher } from "./stream-switcher";

const script = document.querySelector<HTMLElement>("script[data-root]");
const root = script?.dataset.root ?? "/";

const settings =
  JSON.parse(script?.dataset.settings ?? "null") ?? defaultSettings;
script?.remove();

const enumerateDevicesFn = MediaDevices.prototype.enumerateDevices;
const getUserMedia = MediaDevices.prototype.getUserMedia;

let videoDevices: MediaDeviceInfo[] = [];

MediaDevices.prototype.enumerateDevices = async function () {
  videoDevices = [];
  const devices = await enumerateDevicesFn.call(navigator.mediaDevices);
  for (const device of devices) {
    if (device.kind === "videoinput") {
      videoDevices.push(device);
    }
  }
  // We could add "Virtual VHS" or "Virtual Median Filter" and map devices with filters.
  const virtualDevice = {
    deviceId: "enhancedWebcam",
    groupId: "N/A",
    kind: "videoinput",
    label: "Enhanced Virtual Webcam",
  } as const;
  devices.push({
    ...virtualDevice,
    toJSON: () => JSON.stringify(virtualDevice),
  });
  return devices;
};

MediaDevices.prototype.getUserMedia = async function (constraints) {
  if (
    constraints?.video !== true &&
    constraints?.video &&
    "deviceId" in constraints.video
  ) {
    if (
      constraints.video.deviceId === "enhancedWebcam" ||
      (constraints.video.deviceId as any).exact === "enhancedWebcam"
    ) {
      const streamConstraints = {
        ...constraints,
        video: {
          ...constraints.video,
          deviceId: { exact: videoDevices[0].deviceId },
        },
      };
      const stream = await getUserMedia.call(
        navigator.mediaDevices,
        streamConstraints
      );
      const rtc = await mixableStream(stream.getTracks()[0]);
      const makeStreams = videoDevices.map((device) => {
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
        return () =>
          getUserMedia.call(navigator.mediaDevices, streamConstraints);
      });
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
            return stream;
          })
        )
      ).filter((v): v is NonNullable<typeof v> => !!v);
      (window as any).sources = sources;
      (window as any).makeStreams = makeStreams;
      (window as any).rtc = rtc;
      // rtc.stream.

      await streamSwitcher({
        streams: sources,
        constraints,
        root,
        videoDevices,
        getUserMedia,
        settings: settings as any,
      });
      return rtc.stream;
    }
  }

  return getUserMedia.call(navigator.mediaDevices, ...arguments);
};
