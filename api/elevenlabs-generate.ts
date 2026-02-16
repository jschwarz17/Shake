const VALID_NOTES = new Set(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']);
const VALID_CHORDS = new Set(['Major', 'Minor', 'Major7', 'Minor7', 'Dominant7', 'Sus4', 'Diminished']);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const apiKey =
      process.env.ELEVEN_LABS_API_KEY ||
      process.env.ELEVENLABS_API_KEY ||
      process.env.NEXT_PUBLIC_ELEVEN_LABS_KEY;
    if (!apiKey) {
      res.status(500).send('Missing ElevenLabs API key on server. Set ELEVEN_LABS_API_KEY in Vercel project env vars and redeploy.');
      return;
    }

    const { phrase, note, chordType } = req.body ?? {};
    const safePhrase = String(phrase ?? '').trim();
    const words = safePhrase.split(/\s+/).filter(Boolean);
    if (!safePhrase || words.length === 0 || words.length > 10) {
      res.status(400).send('Phrase is required and must be 10 words or fewer.');
      return;
    }
    if (!VALID_NOTES.has(String(note))) {
      res.status(400).send('Invalid note value.');
      return;
    }
    if (!VALID_CHORDS.has(String(chordType))) {
      res.status(400).send('Invalid chord type value.');
      return;
    }

    const prompt = `Acapella vocal singing: ${safePhrase}, in the key of ${note} ${chordType}, dry studio quality, short 5-second phrase, maximum 10 seconds.`;
    const voiceId = process.env.ELEVEN_LABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'eleven_music_v1',
        text: prompt,
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.6,
          style: 0.55,
          use_speaker_boost: true,
        },
      }),
    });

    if (!elevenRes.ok) {
      const message = await elevenRes.text();
      if (elevenRes.status === 401) {
        res.status(401).send(
          message ||
            'ElevenLabs unauthorized. Verify ELEVEN_LABS_API_KEY in Vercel env vars (Production + Preview) and redeploy.'
        );
        return;
      }
      res.status(elevenRes.status).send(message || 'ElevenLabs request failed');
      return;
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).send(message);
  }
}

