import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  contentType?: 'product' | 'notification' | 'faq' | 'general';
  contentId?: string;
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleTranslateApiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
    
    if (!googleTranslateApiKey) {
      throw new Error("Google Translate API key not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { text, targetLanguage, sourceLanguage, contentType, contentId }: TranslationRequest = await req.json();

    if (!text || !targetLanguage) {
      throw new Error("Text and target language are required");
    }

    // Check if translation already exists in cache
    const { data: existingTranslation } = await supabaseClient
      .from('content_translations')
      .select('translated_text, confidence_score')
      .eq('original_text', text)
      .eq('target_language', targetLanguage)
      .eq('source_language', sourceLanguage || 'auto')
      .single();

    if (existingTranslation) {
      console.log('Translation found in cache');
      return new Response(JSON.stringify({
        translatedText: existingTranslation.translated_text,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        cached: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Google Translate API request
    const translateUrl = new URL("https://translation.googleapis.com/language/translate/v2");
    translateUrl.searchParams.set("key", googleTranslateApiKey);

    const translateBody = {
      q: text,
      target: targetLanguage,
      format: "text"
    };

    if (sourceLanguage && sourceLanguage !== 'auto') {
      translateBody.source = sourceLanguage;
    }

    console.log('Calling Google Translate API:', { targetLanguage, sourceLanguage });

    const response = await fetch(translateUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(translateBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Translate API error:', errorText);
      throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
    }

    const result: GoogleTranslateResponse = await response.json();
    
    if (!result.data?.translations?.[0]) {
      throw new Error("Invalid response from Google Translate API");
    }

    const translation = result.data.translations[0];
    const detectedSourceLanguage = translation.detectedSourceLanguage || sourceLanguage || 'auto';

    // Cache the translation
    await supabaseClient
      .from('content_translations')
      .insert({
        original_text: text,
        translated_text: translation.translatedText,
        source_language: detectedSourceLanguage,
        target_language: targetLanguage,
        content_type: contentType || 'general',
        content_id: contentId,
        translation_service: 'google_translate',
        confidence_score: 0.95 // Google Translate typically has high confidence
      });

    // Log translation usage for analytics
    await supabaseClient
      .from('translation_usage_logs')
      .insert({
        source_language: detectedSourceLanguage,
        target_language: targetLanguage,
        character_count: text.length,
        content_type: contentType || 'general',
        translation_service: 'google_translate'
      });

    return new Response(JSON.stringify({
      translatedText: translation.translatedText,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage,
      cached: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Translation error:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message || "Translation failed",
      fallbackText: "Translation unavailable"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});