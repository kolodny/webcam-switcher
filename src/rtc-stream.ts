export async function rtcStream(initialTrack: MediaStreamTrack) {
  const pc1 = new RTCPeerConnection();
  const pc2 = new RTCPeerConnection();
  pc1.onicecandidate = (evt) => pc2.addIceCandidate(evt.candidate!);
  pc2.onicecandidate = (evt) => pc1.addIceCandidate(evt.candidate!);

  const streamPromise = new Promise<MediaStream>((res) => {
    pc2.addEventListener("track", (evt) => res(new MediaStream([evt.track])), {
      once: true,
    });
  });

  pc1.addTrack(initialTrack);

  await new Promise((res) =>
    pc1.addEventListener("negotiationneeded", res, { once: true })
  );
  try {
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);
  } catch (err) {
    console.error(err);
  }

  const replaceTrack = async (newTrack: MediaStreamTrack) => {
    const sender = pc1
      .getSenders()
      .find(({ track }) => track?.kind == newTrack.kind);
    if (sender) {
      return sender.replaceTrack(newTrack);
    } else {
      return pc1.addTrack(newTrack);
    }
  };

  const stream = await streamPromise;

  return {
    stream,
    replaceTrack,
  };
}
