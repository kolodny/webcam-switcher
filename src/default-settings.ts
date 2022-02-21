export type Setting = {
  description: string;
};

const defaultSettingsHelper = <T extends string>(
  settings: Record<T, Setting>
) => settings;

export const settings = defaultSettingsHelper({
  checkInterval: {
    description: "Check interval in ms",
  },
  checksNeededToSwitch: {
    description: "How many ms to wait before switching cameras",
  },
});

export type Settings = typeof settings;
export type SettingsValue = {
  [K in keyof Settings]: string;
};

interface TypeMap {
  string: string;
  number: number;
}

export const defaultSettings: SettingsValue = {
  checkInterval: "1000",
  checksNeededToSwitch: "3000",
};
