import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateLyricsSystemPrompt } from "../_shared/lyrics-kb.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Scene {
  order: number;
  title: string;
  narrative: string;
  emotional_tone: string;
}

interface ChiefAim {
  what: string;
  byWhen: string;
  exchange: string;
  plan: string;
}

interface GenerateLyricsRequest {
  action: 'generate-lyrics';
  chiefAim: ChiefAim;
  scenes: Scene[];
  musicStyle: string;
}

interface GenerateMusicRequest {
  action: 'generate-music';
  lyrics: string;
  musicStyle: string;
  title: string;
  vocalGender: 'm' | 'f';
  scriptId: string;
  personaId?: string;
  songCount?: number;
}

// No default persona - let the API generate random voices based on vocalGender
// Users can provide their own persona ID if they find a voice they like

interface CheckStatusRequest {
  action: 'check-status';
  taskId: string;
  scriptId: string;
}

type RequestBody = GenerateLyricsRequest | GenerateMusicRequest | CheckStatusRequest;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log(`[generate-mind-movie-music] Action: ${body.action}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (body.action === 'generate-lyrics') {
      return await handleGenerateLyrics(body);
    } else if (body.action === 'generate-music') {
      return await handleGenerateMusic(body, supabase);
    } else if (body.action === 'check-status') {
      return await handleCheckStatus(body, supabase);
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('[generate-mind-movie-music] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGenerateLyrics(body: GenerateLyricsRequest): Promise<Response> {
  const { chiefAim, scenes, musicStyle } = body;
  
  console.log('[generate-lyrics] Generating lyrics for Chief Aim:', chiefAim.what?.substring(0, 50));
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = generateLyricsSystemPrompt(chiefAim, scenes, musicStyle);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Write the complete ${musicStyle} lyrics for my Mind Movie visualization.` }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[generate-lyrics] AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const lyrics = data.choices?.[0]?.message?.content;

  if (!lyrics) {
    throw new Error('No lyrics generated');
  }

  console.log('[generate-lyrics] Successfully generated lyrics');

  return new Response(
    JSON.stringify({ lyrics }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerateMusic(body: GenerateMusicRequest, supabase: any): Promise<Response> {
  const { lyrics, musicStyle, title, vocalGender, scriptId, songCount = 1 } = body;
  
  console.log('[generate-music] Starting Suno generation for:', title);
  console.log('[generate-music] Config - vocalGender:', vocalGender, 'musicStyle:', musicStyle, 'songCount:', songCount, 'personaId:', body.personaId || 'none');
  
  const KIA_API_KEY = Deno.env.get('KIA_API_KEY');
  if (!KIA_API_KEY) {
    throw new Error('KIA_API_KEY not configured');
  }

  // Map music style to Suno style tags
  const styleMap: Record<string, string> = {
    // Hip-Hop & Rap
    'Hip-Hop Motivational': 'Hip-Hop, Motivational, Upbeat, Inspiring, Energetic',
    'Cinematic Hip-Hop': 'Hip-Hop, Cinematic, Orchestral, Epic, Dramatic',
    'Conscious Rap': 'Hip-Hop, Conscious, Thoughtful, Soulful, Deep',
    'Lo-Fi Hip-Hop': 'Lo-Fi, Hip-Hop, Chill, Reflective, Mellow',
    'Trap Inspirational': 'Trap, Hip-Hop, Modern, Hard-hitting, Motivational',
    'Boom Bap': 'Boom Bap, Hip-Hop, Classic, 90s, Soulful Samples',
    'West Coast Rap': 'West Coast Rap, G-Funk, Laid-back, Groovy, Synth',
    'UK Drill': 'UK Drill, Dark, Bass-heavy, Aggressive, 808s',
    'Jazz Rap': 'Jazz Rap, Hip-Hop, Smooth, Sophisticated, Jazz Samples',
    // Pop & Electronic
    'Uplifting Pop': 'Pop, Uplifting, Catchy, Energetic, Feel-good',
    'Cinematic Electronic': 'Electronic, Cinematic, Atmospheric, Building, Epic',
    'Ambient Chill': 'Ambient, Chill, Peaceful, Meditative, Flowing',
    'Synthwave Retro': 'Synthwave, Retro, Electronic, 80s, Nostalgic, Driving',
    'Indie Pop': 'Indie Pop, Dreamy, Atmospheric, Emotional, Melodic',
    'EDM Anthem': 'EDM, Electronic, Anthemic, High-energy, Euphoric, Festival',
    'Future Bass': 'Future Bass, Melodic, Emotional, Modern, Drops',
    'Deep House': 'Deep House, Groovy, Soulful, Rhythmic, Warm',
    'Tropical House': 'Tropical House, Summery, Upbeat, Breezy, Melodic',
    'Electro Swing': 'Electro Swing, Vintage, Electronic, Jazz, Upbeat',
    'Hyperpop': 'Hyperpop, Glitchy, Maximalist, Experimental, Energetic',
    'Dream Pop': 'Dream Pop, Ethereal, Atmospheric, Hazy, Reverb',
    'Synth-pop': 'Synth-pop, Synthesizers, Catchy, Retro-modern, Dance',
    'Vaporwave': 'Vaporwave, Nostalgic, Slowed, Aesthetic, Lo-fi',
    // Rock & Alternative
    'Indie Rock Anthem': 'Indie Rock, Energetic, Guitar-driven, Inspiring, Anthemic',
    'Alternative Rock': 'Alternative Rock, Raw, Emotional, Edgy, Guitars',
    'Classic Rock': 'Classic Rock, Timeless, Powerful, Guitar Solos, Vintage',
    'Punk Rock': 'Punk Rock, Fast, Rebellious, Raw Energy, Distorted',
    'Pop Rock': 'Pop Rock, Catchy, Melodic, Accessible, Upbeat',
    'Progressive Rock': 'Progressive Rock, Complex, Epic, Experimental, Intricate',
    'Grunge': 'Grunge, Raw, Heavy, Emotional, Alternative',
    'Post-Rock': 'Post-Rock, Atmospheric, Building, Cinematic, Instrumental',
    // Orchestral & Cinematic
    'Epic Orchestral': 'Orchestral, Epic, Cinematic, Powerful, Grand, Triumphant',
    'Inspirational Piano': 'Piano, Inspirational, Emotional, Elegant, Uplifting',
    'Cinematic Drama': 'Cinematic, Drama, Intense, Building, Movie Score',
    'Cinematic Inspirational': 'Cinematic, Inspirational, Emotional, Uplifting, Dramatic',
    'Neoclassical': 'Neoclassical, Modern Classical, Elegant, Refined, Piano',
    'Movie Soundtrack': 'Soundtrack, Theatrical, Emotional, Sweeping, Orchestral',
    // R&B & Soul
    'R&B Soul': 'R&B, Soul, Smooth, Emotional, Groovy',
    'Contemporary R&B': 'Contemporary R&B, Modern, Melodic, Atmospheric, Smooth',
    'Neo Soul': 'Neo Soul, Organic, Jazzy, Conscious, Smooth',
    'Motown': 'Motown, Classic, Groovy, Soulful, Vintage',
    'Funk': 'Funk, Groovy, Bass-heavy, Danceable, Upbeat',
    // Jazz & Blues
    'Smooth Jazz': 'Smooth Jazz, Relaxing, Sophisticated, Melodic, Saxophone',
    'Jazz Fusion': 'Jazz Fusion, Complex, Funky, Experimental, Instrumental',
    'Blues': 'Blues, Soulful, Raw, Emotional, Guitar',
    'Delta Blues': 'Delta Blues, Roots, Acoustic, Storytelling, Traditional',
    'Cool Jazz': 'Cool Jazz, Laid-back, Sophisticated, Smooth, Mellow',
    // Folk & Country
    'Acoustic Folk': 'Acoustic, Folk, Heartfelt, Organic, Storytelling',
    'Indie Folk': 'Indie Folk, Intimate, Heartfelt, Atmospheric, Acoustic',
    'Country Inspirational': 'Country, Inspirational, Heartfelt, Americana, Uplifting',
    'Bluegrass': 'Bluegrass, Acoustic, Lively, Traditional, Banjo',
    'Americana': 'Americana, Roots, Authentic, Storytelling, Folk Rock',
    // Gospel & Spiritual
    'Gospel Inspirational': 'Gospel, Inspirational, Uplifting, Spiritual, Powerful',
    'Contemporary Gospel': 'Contemporary Gospel, Modern, Soulful, Inspiring, Praise',
    'Spiritual': 'Spiritual, Meditative, Peaceful, Transcendent, Healing',
    // World & Latin
    'Reggae': 'Reggae, Laid-back, Positive, Groovy, Caribbean',
    'Afrobeat': 'Afrobeat, Rhythmic, Energetic, Danceable, African',
    'Latin Pop': 'Latin Pop, Passionate, Rhythmic, Vibrant, Spanish',
    'Salsa': 'Salsa, Energetic, Danceable, Vibrant, Latin Percussion',
    'Bossa Nova': 'Bossa Nova, Smooth, Jazzy, Brazilian, Relaxed',
    'K-pop': 'K-pop, Catchy, Polished, Dynamic, Modern Pop',
    'J-pop': 'J-pop, Melodic, Upbeat, Colorful, Energetic',
  };

  const sunoStyle = styleMap[musicStyle] || 'Pop, Inspirational, Uplifting';
  
  // Determine which persona to use (if any)
  // Only use persona if user explicitly provides one - otherwise let vocalGender randomize the voice
  let effectivePersonaId: string | undefined = undefined;
  
  if (body.personaId && body.personaId.trim()) {
    // User provided a custom persona - use it (this overrides vocalGender)
    effectivePersonaId = body.personaId.trim();
    console.log('[generate-music] Using custom personaId:', effectivePersonaId);
  } else {
    // No persona - let vocalGender control the voice (API will randomize within that gender)
    console.log('[generate-music] No persona applied, using vocalGender:', vocalGender, '(random voice)');
  }
  
  // Generate multiple songs if requested
  const taskIds: string[] = [];
  const effectiveSongCount = Math.min(songCount, 2); // Cap at 2 songs
  
  for (let i = 0; i < effectiveSongCount; i++) {
    // Build request body
    const requestBody: Record<string, unknown> = {
      prompt: lyrics,
      customMode: true,
      instrumental: false,
      model: 'V4_5',
      style: sunoStyle,
      title: effectiveSongCount > 1 ? `${title.substring(0, 70)} (v${i + 1})` : title.substring(0, 80),
      vocalGender: vocalGender,
      callBackUrl: 'https://example.com/callback', // Required by Kie.ai but we use polling
    };
    
    // Only add personaId if we have one
    if (effectivePersonaId) {
      requestBody.personaId = effectivePersonaId;
    }
    
    console.log(`[generate-music] Song ${i + 1} request body:`, JSON.stringify(requestBody));
    
    // Call Kie.ai Suno API
    const sunoResponse = await fetch('https://api.kie.ai/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      console.error(`[generate-music] Suno API error for song ${i + 1}:`, sunoResponse.status, errorText);
      throw new Error(`Suno API error: ${sunoResponse.status}`);
    }

    const sunoData = await sunoResponse.json();
    console.log(`[generate-music] Suno response for song ${i + 1}:`, JSON.stringify(sunoData));

    if (sunoData.code !== 200 || !sunoData.data?.taskId) {
      throw new Error(sunoData.msg || `Failed to start music generation for song ${i + 1}`);
    }

    taskIds.push(sunoData.data.taskId);
    
    // Small delay between requests to avoid rate limiting
    if (i < effectiveSongCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Store the first task ID in the database (for backward compatibility)
  const { error: updateError } = await supabase
    .from('mind_movie_scripts')
    .update({ suno_task_id: taskIds[0], music_style: musicStyle })
    .eq('id', scriptId);

  if (updateError) {
    console.error('[generate-music] Failed to save task ID:', updateError);
  }

  console.log('[generate-music] Started generation with taskIds:', taskIds);

  return new Response(
    JSON.stringify({ 
      taskId: taskIds[0], // For backward compatibility
      taskIds,
      status: 'PENDING' 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCheckStatus(body: CheckStatusRequest, supabase: any): Promise<Response> {
  const { taskId, scriptId } = body;
  
  console.log('[check-status] Checking task:', taskId);
  
  const KIA_API_KEY = Deno.env.get('KIA_API_KEY');
  if (!KIA_API_KEY) {
    throw new Error('KIA_API_KEY not configured');
  }

  const statusResponse = await fetch(
    `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIA_API_KEY}`,
      },
    }
  );

  if (!statusResponse.ok) {
    const errorText = await statusResponse.text();
    console.error('[check-status] Status check error:', statusResponse.status, errorText);
    throw new Error(`Status check error: ${statusResponse.status}`);
  }

  const statusData = await statusResponse.json();
  console.log('[check-status] Status response:', JSON.stringify(statusData));

  const status = statusData.data?.status;
  const audioUrl = statusData.data?.response?.sunoData?.[0]?.audioUrl;
  const duration = statusData.data?.response?.sunoData?.[0]?.duration;

  if (status === 'SUCCESS' && audioUrl) {
    // Save the audio URL to the database
    const { error: updateError } = await supabase
      .from('mind_movie_scripts')
      .update({ soundtrack_url: audioUrl })
      .eq('id', scriptId);

    if (updateError) {
      console.error('[check-status] Failed to save audio URL:', updateError);
    }

    console.log('[check-status] Generation complete, audio URL saved');

    return new Response(
      JSON.stringify({ 
        status: 'SUCCESS', 
        audioUrl, 
        duration 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (status === 'FAILED') {
    return new Response(
      JSON.stringify({ status: 'FAILED', error: 'Music generation failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Still processing
  return new Response(
    JSON.stringify({ status: status || 'PENDING' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
