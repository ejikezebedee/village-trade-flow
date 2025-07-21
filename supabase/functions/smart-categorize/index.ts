import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryRequest {
  productName: string;
  description: string;
  existingCategory?: string;
  forceRecategorize?: boolean;
}

interface CategoryResponse {
  category: string;
  confidence: number;
  tags: string[];
  reasoning: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      // Fallback to rule-based categorization
      return await handleRuleBasedCategorization(req);
    }

    const { productName, description, existingCategory, forceRecategorize }: CategoryRequest = await req.json();

    console.log('AI Categorizing product:', { productName, description });

    // If we already have a high-confidence category and not forcing recategorization, skip AI
    if (existingCategory && !forceRecategorize) {
      return new Response(
        JSON.stringify({
          category: existingCategory,
          confidence: 0.8,
          tags: await generateTags(productName, description),
          reasoning: 'Using existing category',
          aiUsed: false
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const prompt = `You are an expert product categorizer for a rural marketplace platform. Analyze the following product and provide categorization:

Product Name: "${productName}"
Description: "${description}"

Available Categories:
- fruits: Fresh fruits and fruit products
- vegetables: Fresh vegetables and vegetable products  
- grains: Rice, wheat, corn, cereals, and grain products
- dairy: Milk, cheese, butter, yogurt, and dairy products
- meat: Fresh meat, poultry, and meat products
- seafood: Fish, shellfish, and seafood products
- spices: Spices, herbs, and seasonings
- beverages: Drinks, juices, and liquid products
- electronics: Electronic devices, gadgets, and tech products
- clothing: Garments, apparel, and fashion items
- accessories: Fashion accessories, jewelry, bags
- home_garden: Home goods, furniture, garden supplies
- books_media: Books, magazines, digital media
- sports_fitness: Sports equipment, fitness gear
- beauty_health: Cosmetics, health products, wellness items
- toys_games: Toys, games, entertainment products
- crafts: Handmade items, art supplies, creative products
- tools: Tools, hardware, equipment
- automotive: Car parts, automotive supplies
- other: Items that don't fit other categories

Provide your response in this exact JSON format:
{
  "category": "category_name",
  "confidence": 0.95,
  "tags": ["tag1", "tag2", "tag3"],
  "reasoning": "Brief explanation of categorization choice"
}

Tags should be relevant descriptors like: organic, handmade, premium, local, seasonal, etc.
Confidence should be 0.0-1.0 based on how certain you are.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a product categorization expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const categoryData: CategoryResponse = JSON.parse(aiResponse);
      
      // Validate and sanitize the response
      const validCategories = [
        'fruits', 'vegetables', 'grains', 'dairy', 'meat', 'seafood', 'spices', 'beverages',
        'electronics', 'clothing', 'accessories', 'home_garden', 'books_media', 
        'sports_fitness', 'beauty_health', 'toys_games', 'crafts', 'tools', 'automotive', 'other'
      ];

      if (!validCategories.includes(categoryData.category)) {
        categoryData.category = 'other';
        categoryData.confidence = Math.max(0.3, categoryData.confidence - 0.2);
      }

      // Ensure confidence is in valid range
      categoryData.confidence = Math.max(0.0, Math.min(1.0, categoryData.confidence));

      console.log('AI categorization result:', categoryData);

      return new Response(
        JSON.stringify({ ...categoryData, aiUsed: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to rule-based categorization
      return await handleRuleBasedCategorization(req);
    }

  } catch (error: any) {
    console.error('Error in smart-categorize function:', error);
    // Fallback to rule-based categorization on any error
    return await handleRuleBasedCategorization(req);
  }
};

async function handleRuleBasedCategorization(req: Request): Promise<Response> {
  try {
    const { productName, description }: CategoryRequest = await req.json();
    
    const text = (productName + ' ' + (description || '')).toLowerCase();
    let category = 'other';
    let confidence = 0.3;
    
    // Enhanced rule-based categorization
    if (text.match(/tomato|carrot|onion|potato|lettuce|cabbage|spinach|broccoli|pepper|cucumber|vegetable/)) {
      category = 'vegetables';
      confidence = 0.9;
    } else if (text.match(/apple|banana|orange|mango|berry|grape|pineapple|watermelon|fruit|citrus/)) {
      category = 'fruits';
      confidence = 0.9;
    } else if (text.match(/rice|wheat|corn|grain|cereal|oats|barley|quinoa/)) {
      category = 'grains';
      confidence = 0.8;
    } else if (text.match(/milk|cheese|butter|yogurt|cream|dairy/)) {
      category = 'dairy';
      confidence = 0.85;
    } else if (text.match(/phone|laptop|computer|tablet|electronic|gadget|device|tech|smartphone/)) {
      category = 'electronics';
      confidence = 0.9;
    } else if (text.match(/shirt|dress|pants|shoes|clothing|apparel|fashion|wear|jacket/)) {
      category = 'clothing';
      confidence = 0.85;
    } else if (text.match(/basket|pottery|handmade|craft|woven|handcraft|art|creative/)) {
      category = 'crafts';
      confidence = 0.8;
    } else if (text.match(/honey|jam|sauce|oil|food|edible|snack/)) {
      category = 'food';
      confidence = 0.7;
    }

    const tags = await generateTags(productName, description || '');

    return new Response(
      JSON.stringify({
        category,
        confidence,
        tags,
        reasoning: 'Rule-based categorization',
        aiUsed: false
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function generateTags(productName: string, description: string): Promise<string[]> {
  const text = (productName + ' ' + description).toLowerCase();
  const tags: string[] = [];

  // Always add new-arrival for new products
  tags.push('new-arrival');

  // Quality tags
  if (text.match(/organic|natural|eco|green/)) {
    tags.push('organic');
  }

  if (text.match(/handmade|handcraft|artisan|custom/)) {
    tags.push('handmade');
  }

  if (text.match(/premium|luxury|high.?quality|finest/)) {
    tags.push('premium');
  }

  if (text.match(/seasonal|summer|winter|spring|autumn|fall|holiday/)) {
    tags.push('seasonal');
  }

  if (text.match(/local|village|rural|farm|fresh/)) {
    tags.push('local-favorite');
  }

  return tags;
}

serve(handler);