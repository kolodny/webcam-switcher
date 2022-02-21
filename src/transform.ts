export const transform = (stream: MediaStream) => {
  const videoTrack = stream.getVideoTracks()[0];

  const trackProcessor = new (window as any).MediaStreamTrackProcessor({
    track: videoTrack,
  });
  const trackGenerator = new (window as any).MediaStreamTrackGenerator({
    kind: "video",
  });

  const transformer = new TransformStream({
    async transform(videoFrame, controller) {
      const newFrame = new (window as any).VideoFrame(videoFrame);
      videoFrame.close();
      controller.enqueue(newFrame);
    },
  });

  trackProcessor.readable
    .pipeThrough(transformer)
    .pipeTo(trackGenerator.writable);
  const processedStream = new MediaStream();
  processedStream.addTrack(trackGenerator);

  return processedStream;
};
