import { SettingsValue } from "./default-settings";
import { rtcStream } from "./rtc-stream";

import { state } from "./state";
import { streamScorer } from "./stream-scorer";

interface Arguments {
  constraints: MediaStreamConstraints;
}

let DEFAULT_INDEX = 0;

export const streamSwitcher = async (streams: MediaStream[]) => {
  const scorer = await streamScorer(streams);

  const rtc = await rtcStream(streams[DEFAULT_INDEX].getVideoTracks()[0]);

  let currentStreamIndex = DEFAULT_INDEX;
  let switchTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  let updateTimeout: ReturnType<typeof setTimeout>;
  const updateStream = async () => {
    const bestIndex = await scorer.getBestStreamIndex();
    if (bestIndex !== -1) {
      if (bestIndex !== currentStreamIndex) {
        if (!switchTimeout) {
          switchTimeout = setTimeout(async () => {
            // console.log(`switching from ${currentStreamIndex} to ${bestIndex}`);
            currentStreamIndex = bestIndex;
            rtc.replaceTrack(streams[currentStreamIndex].getVideoTracks()[0]);

            switchTimeout = undefined;
          }, +state.settings?.checksNeededToSwitch!);
        }
      } else {
        if (switchTimeout) {
          clearTimeout(switchTimeout);
          switchTimeout = undefined;
        }
      }
    }
    updateTimeout = setTimeout(
      () => updateStream(),
      +state.settings?.checkInterval!
    );
  };
  updateTimeout = setTimeout(
    () => updateStream(),
    +state.settings?.checkInterval!
  );

  rtc.stream.addEventListener("inactive", () => {
    clearTimeout(updateTimeout);
    scorer.stop();
  });
  return rtc.stream;
};
