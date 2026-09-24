/**
 * Seamless Pink Noise Buffer Generator for warm, organic cosmic audio:
 * - Uses Paul Kellet 6-pole 1/f filter algorithm
 * - Independent channel seeds for authentic stereo width and spatial immersion
 * - 500ms equal-power cosine crossfade at loop boundaries for zero audible clicks
 * - DC offset removal for clean AC headroom
 */
export function createPinkNoiseBuffer(ctx: AudioContext, durationSeconds = 8): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

  const crossfadeSamples = Math.floor(sampleRate * 0.5); // 500ms smooth seam

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    let sum = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
      data[i] = sample;
      sum += sample;
      b6 = white * 0.115926;
    }

    // 1. Remove DC bias
    const dcOffset = sum / bufferSize;
    for (let i = 0; i < bufferSize; i++) {
      data[i] -= dcOffset;
    }

    // 2. Apply equal-power crossfade between start and end of buffer for zero-click seamless looping
    for (let i = 0; i < crossfadeSamples; i++) {
      const t = i / crossfadeSamples;
      const gainIn = Math.sin((t * Math.PI) / 2);
      const gainOut = Math.cos((t * Math.PI) / 2);
      const endIdx = bufferSize - crossfadeSamples + i;

      const blended = data[i] * gainIn + data[endIdx] * gainOut;
      data[i] = blended;
      data[endIdx] = blended;
    }
  }

  return buffer;
}
