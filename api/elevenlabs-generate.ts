const VALID_NOTES = new Set(['C', 'C#', 'D', 'Db', 'Eb', 'E', 'F', 'F#', 'G', 'Gb', 'Ab', 'A', 'Bb', 'B']);
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

    const { phrase, note, chordType, voiceTone, vibe, effect } = req.body ?? {};
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

    // Hardcoded prompt descriptions — passed verbatim to Eleven Labs when user selects an option
    const VOICE_TONE_PROMPTS: Record<string, string> = {
      Raspy: 'Apply a gritty, textured rasp with a gravelly and slightly hoarse vocal quality.',
      Airy: 'Deliver the vocals with a soft, breathy, and whispered tone full of atmospheric air.',
      'Deep bass': 'Emphasize a low-pitched, resonant chest voice with a heavy and rumbling bass presence.',
      Trebly: 'Boost the high-end frequencies for a sharp, bright, and thin vocal with a crisp bite.',
    };

    const VIBE_PROMPTS: Record<string, string> = {
      Moody: 'Infuse the performance with a somber, dark, and atmospheric mood that feels heavy and introspective.',
      Upbeat: 'Sing with a bright, cheerful, and fast-paced energy that feels optimistic and lively.',
      Energetic: 'Deliver a high-intensity, powerful, and dynamic performance with a punchy and driven delivery.',
      Angsty: 'Channel a sense of raw frustration and emotional strain with an edgy, tense vocal style.',
      Emo: 'Perform with deep melancholy and dramatic vulnerability, emphasizing a raw and expressive sadness.',
    };

    const EFFECT_PROMPTS: Record<string, string> = {
      Radio: 'Process the vocals with narrow bandwidth and static to sound like they are being sung through a vintage AM radio.',
      Phone: 'Apply a lo-fi, compressed filter to mimic the thin and tinny audio quality of a 1990s landline telephone.',
      Bullhorn: 'Add mid-range distortion and metallic projection to simulate a vocal being shouted through a handheld megaphone.',
      Echo: 'Incorporate a rhythmic 8th note delay effect that creates a clean, spacious, and repeating echo.',
      Underwater: 'Apply a heavy low-pass filter and muffled resonance so the singer sounds half-audible and completely submerged underwater.',
    };

    let prompt = `Acapella vocal singing: ${safePhrase}, in the key of ${note} ${chordType}, dry studio quality`;
    if (voiceTone && typeof voiceTone === 'string' && VOICE_TONE_PROMPTS[voiceTone]) {
      prompt += `, ${VOICE_TONE_PROMPTS[voiceTone]}`;
    }
    if (vibe && typeof vibe === 'string' && VIBE_PROMPTS[vibe]) {
      prompt += `, ${VIBE_PROMPTS[vibe]}`;
    }
    if (effect && typeof effect === 'string' && EFFECT_PROMPTS[effect]) {
      prompt += `, ${EFFECT_PROMPTS[effect]}`;
    }
    prompt += ', short phrase, maximum 5 seconds.';

    const elevenRes = await fetch('https://api.elevenlabs.io/v1/music/stream', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'music_v1',
        prompt,
        music_length_ms: 5000,
        output_format: 'mp3_44100_128',
        force_instrumental: false,
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

