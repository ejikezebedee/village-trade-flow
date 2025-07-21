import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleTranslateApiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
    if (!googleTranslateApiKey) {
      throw new Error('Google Translate API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      text, 
      targetLanguage, 
      sourceLanguage = 'auto',
      type = 'text', // 'text', 'message', 'product'
      messageId,
      productId 
    } = await req.json();

    console.log('Translation request:', { 
      text: text?.substring(0, 100), 
      targetLanguage, 
      sourceLanguage, 
      type 
    });

    if (!text || !targetLanguage) {
      throw new Error('Text and target language are required');
    }

    // Check if translation already exists in cache
    let cachedTranslation = null;
    if (type === 'message' && messageId) {
      const { data } = await supabase
        .from('message_translations')
        .select('translated_text, confidence_score')
        .eq('message_id', messageId)
        .eq('language_code', targetLanguage)
        .single();
      
      cachedTranslation = data;
    }

    if (cachedTranslation) {
      console.log('Using cached translation');
      return new Response(
        JSON.stringify({
          success: true,
          translatedText: cachedTranslation.translated_text,
          confidence: cachedTranslation.confidence_score,
          cached: true,
          sourceLanguage: sourceLanguage
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Call Google Translate API
    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleTranslateApiKey}`;
    
    const translateResponse = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        format: 'text'
      }),
    });

    if (!translateResponse.ok) {
      const errorData = await translateResponse.text();
      console.error('Google Translate API error:', errorData);
      throw new Error(`Translation service error: ${translateResponse.status}`);
    }

    const translateData = await translateResponse.json();
    
    if (!translateData.data || !translateData.data.translations || translateData.data.translations.length === 0) {
      throw new Error('No translation returned from service');
    }

    const translation = translateData.data.translations[0];
    const translatedText = translation.translatedText;
    const detectedSourceLanguage = translation.detectedSourceLanguage || sourceLanguage;

    console.log('Translation successful:', {
      originalLength: text.length,
      translatedLength: translatedText.length,
      detectedSource: detectedSourceLanguage
    });

    // Cache the translation if it's a message
    if (type === 'message' && messageId) {
      try {
        await supabase
          .from('message_translations')
          .insert({
            message_id: messageId,
            language_code: targetLanguage,
            translated_text: translatedText,
            confidence_score: 0.95, // Google Translate doesn't provide confidence scores
            translation_service: 'google_translate'
          });
      } catch (error) {
        console.error('Error caching translation:', error);
        // Don't fail the request if caching fails
      }
    }

    // Cache product translations
    if (type === 'product' && productId) {
      try {
        const { data: existingTranslation } = await supabase
          .from('product_translations')
          .select('id')
          .eq('product_id', productId)
          .eq('language_code', targetLanguage)
          .single();

        if (!existingTranslation) {
          await supabase
            .from('product_translations')
            .insert({
              product_id: productId,
              language_code: targetLanguage,
              name: translatedText,
              description: translatedText, // For now, same as name
              is_auto_translated: true
            });
        }
      } catch (error) {
        console.error('Error caching product translation:', error);
      }
    }

    // Log the translation event
    await supabase.rpc('log_security_event', {
      p_event_type: 'content_translated',
      p_severity: 'info',
      p_action_performed: `Content translated from ${detectedSourceLanguage} to ${targetLanguage}`,
      p_metadata: {
        source_language: detectedSourceLanguage,
        target_language: targetLanguage,
        content_type: type,
        content_length: text.length,
        translation_service: 'google_translate'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        translatedText: translatedText,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage: targetLanguage,
        confidence: 0.95,
        cached: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});