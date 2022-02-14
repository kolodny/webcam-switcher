export type Setting = {
  description: string;
  type: "string" | "number";
};

const defaultSettingsHelper = <T extends string>(
  settings: Record<T, Setting>
) => settings;

export const settings = defaultSettingsHelper({
  checkInterval: {
    description: "Check interval in ms",
    type: "number",
  },
  checksNeededToSwitch: {
    description: "How many ms to wait before switching cameras",
    type: "number",
  },
});

export type Settings = typeof settings;
export type SettingsValue = {
  [K in keyof Settings]: TypeMap[Settings[K]["type"]];
};

interface TypeMap {
  string: string;
  number: number;
}

export const defaultSettings: SettingsValue = {
  checkInterval: 1000,
  checksNeededToSwitch: 300,
};
