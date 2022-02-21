import { defaultSettings } from "./default-settings";
import { state } from "./state";
import { streamSwitcher } from "./stream-switcher";

const script = document.querySelector<HTMLElement>("script[data-root]");

state.root = script?.dataset.root ?? "/";

state.settings =
  JSON.parse(script?.dataset.settings ?? "null") ?? defaultSettings;
script?.remove();

MediaDevices.prototype.enumerateDevices = async function () {
  state.videoDevices = [];
  const devices = await state.enumerateDevices.call(navigator.mediaDevices);
  for (const device of devices) {
    if (device.kind === "videoinput") {
      state.videoDevices.push(device);
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
      const sources = (
        await Promise.all(
          state.videoDevices.map(async (device) => {
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
            const stream = await state.getUserMedia.call(
              navigator.mediaDevices,
              streamConstraints
            );
            return stream;
          })
        )
      ).filter((v): v is NonNullable<typeof v> => !!v);
      return streamSwitcher(sources);
    }
  }

  return state.getUserMedia.call(navigator.mediaDevices, ...arguments);
};
