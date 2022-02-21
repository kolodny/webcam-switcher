import React from "react";
import { useAsync } from "react-use";
import { settings, defaultSettings } from "./default-settings";

export const App: React.FC = () => {
  const { loading, error, value } = useAsync(async () => {
    const fromSync = (await chrome.storage.sync.get("settings"))
      ?.settings as typeof defaultSettings;
    if (!fromSync || Object.keys(fromSync).length === 0) {
      return defaultSettings;
    }
    return fromSync;
  });
  if (loading || error || !value) return null;
  return (
    <div>
      <h1>Settings</h1>
      {Object.entries(settings)?.map(([name, setting]) => {
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          (value as any)[name] = newValue;
          chrome.storage.sync.set({ settings: value });
        };
        return (
          <div>
            <p>{setting.description}</p>
            <input
              type="text"
              defaultValue={(value as any)[name]}
              onChange={onChange}
            />
          </div>
        );
      })}
    </div>
  );
};
