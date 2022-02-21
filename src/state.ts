import { SettingsValue } from "./default-settings";

interface State {
  root?: string;
  isModelReady: boolean;
  settings?: SettingsValue;
  videoDevices: MediaDeviceInfo[];
  enumerateDevices: () => Promise<MediaDeviceInfo[]>;
  getUserMedia: (
    constraints?: MediaStreamConstraints | undefined
  ) => Promise<MediaStream>;
  otherWindow?: any;
  virtualStream: MediaStream;
}

export const state: State = {
  isModelReady: false,
  videoDevices: [],
  enumerateDevices: MediaDevices.prototype.enumerateDevices,
  getUserMedia: MediaDevices.prototype.getUserMedia,
  virtualStream: new MediaStream(),
};
