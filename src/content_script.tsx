import { defaultSettings } from "./default-settings";
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
      return streamSwitcher({
        constraints,
        root,
        videoDevices,
        getUserMedia,
        settings: settings as any,
      });
    }
  }

  return getUserMedia.call(navigator.mediaDevices, ...arguments);
};
