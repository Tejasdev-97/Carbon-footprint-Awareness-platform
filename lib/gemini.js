/**
 * gemini.js
 * Client-side Gemini AI integration for Prithvi eco-insights.
 *
 * Security rules:
 * - API key is read from Dexie ONLY — never from env vars or localStorage
 * - Key is never sent to a backend server
 * - All user input is sanitized before sending
 * - On any failure, silently return a locale-appropriate fallback
 * - Raw API errors are never exposed to the user
 */

import { getSetting } from './db.js'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Gemini model to use — change here only, in one place */
const GEMINI_MODEL = 'gemini-2.5-flash'

/** Gemini API base URL */
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Maximum input characters allowed */
const MAX_INPUT_LENGTH = 500

// ─── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Sanitizes user input before sending to Gemini.
 * - Strips <script> tags and HTML markup
 * - Limits to MAX_INPUT_LENGTH characters
 * - Removes null bytes and control characters
 *
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return ''

  return input
    // Remove script tags (and their contents)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove null bytes and control characters (except newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim
    .trim()
    // Enforce max length
    .slice(0, MAX_INPUT_LENGTH)
}

// ─── Locale Fallback Templates ────────────────────────────────────────────────

/**
 * Fallback responses when no API key is set or the call fails.
 * Keyed by BCP-47 language code.
 * @type {Object<string, string[]>}
 */
const FALLBACK_RESPONSES = {
  'en-IN': [
    'Every small action counts. Taking the metro instead of a car can save over 1 kg of CO₂ per day.',
    'Your food choices matter. Switching one meat meal to vegetarian weekly can reduce your annual footprint by up to 50 kg CO₂.',
    'Energy at home: turning off the AC 2 hours earlier each day saves about 0.6 kg CO₂ and lowers your electricity bill.',
    'Green tip: carrying a reusable bag eliminates single-use plastic and reduces your waste footprint with zero extra effort.',
    'You are doing great! Keep logging your actions daily to track your impact and unlock more eco-badges.',
  ],
  'hi-IN': [
    'हर छोटा कदम मायने रखता है। मेट्रो लेने से रोज़ाना 1 किलो से ज़्यादा CO₂ बचाई जा सकती है।',
    'आपके खाने के विकल्प महत्वपूर्ण हैं। सप्ताह में एक मांसाहारी भोजन को शाकाहारी में बदलने से सालाना 50 किलो CO₂ कम हो सकती है।',
    'घर में ऊर्जा बचाएं: AC को 2 घंटे पहले बंद करने से रोज़ 0.6 किलो CO₂ और बिजली का बिल कम होगा।',
    'हरा कदम: पुनः उपयोग योग्य थैला लेकर चलने से प्लास्टिक अपशिष्ट कम होता है।',
    'बहुत अच्छा! अपनी दैनिक गतिविधियाँ लॉग करते रहें और eco-badges अर्जित करें।',
  ],
  'ta-IN': [
    'ஒவ்வொரு சிறிய செயலும் முக்கியம். மெட்ரோ பயன்படுத்துவதால் நாளொன்றுக்கு 1 கிலோ CO₂ சேமிக்கலாம்.',
    'உங்கள் உணவு தேர்வுகள் முக்கியம். வாரம் ஒரு முறை சைவ உணவு சாப்பிடுவதால் ஆண்டுக்கு 50 கிலோ CO₂ குறையும்.',
    'வீட்டில் ஆற்றல்: AC-ஐ 2 மணி நேரம் முன்பே அணைப்பதால் 0.6 கிலோ CO₂ மிச்சமாகும்.',
    'நல்ல பழக்கம்: மறுபயன்பாட்டு பை கொண்டு செல்வதால் பிளாஸ்டிக் கழிவு குறையும்.',
    'நீங்கள் சிறப்பாக செய்கிறீர்கள்! தினமும் உங்கள் செயல்களை பதிவு செய்யுங்கள்.',
  ],
  'te-IN': [
    'ప్రతి చిన్న చర్య ముఖ్యమైనది. మెట్రో వాడటం వల్ల రోజుకు 1 కిలో CO₂ ఆదా చేయవచ్చు.',
    'మీ ఆహార ఎంపికలు ముఖ్యమైనవి. వారానికి ఒక మాంసాహారం బదులు శాకాహారం తినడం వల్ల సంవత్సరానికి 50 కిలో CO₂ తగ్గుతుంది.',
    'ఇంట్లో శక్తి: AC ని 2 గంటలు ముందే ఆపడం వల్ల 0.6 కిలో CO₂ మరియు విద్యుత్ బిల్లు తగ్గుతాయి.',
    'పచ్చని అలవాటు: రీయూజబుల్ సంచి తీసుకెళ్ళడం వల్ల ప్లాస్టిక్ వ్యర్థాలు తగ్గుతాయి.',
    'బాగా చేస్తున్నారు! ప్రతిరోజూ మీ చర్యలను నమోదు చేయండి.',
  ],
  'kn-IN': [
    'ಪ್ರತಿ ಸಣ್ಣ ಕ್ರಮವೂ ಮುಖ್ಯ. ಮೆಟ್ರೋ ಬಳಸಿದರೆ ದಿನಕ್ಕೆ 1 ಕಿಲೋ CO₂ ಉಳಿಸಬಹುದು.',
    'ನಿಮ್ಮ ಆಹಾರ ಆಯ್ಕೆಗಳು ಮುಖ್ಯ. ವಾರಕ್ಕೊಮ್ಮೆ ಸಸ್ಯಾಹಾರ ಸೇವಿಸಿದರೆ ವಾರ್ಷಿಕ 50 ಕಿಲೋ CO₂ ಕಡಿಮೆಯಾಗುತ್ತದೆ.',
    'ಮನೆಯಲ್ಲಿ ಶಕ್ತಿ ಉಳಿಸಿ: AC ಅನ್ನು 2 ಗಂಟೆ ಮೊದಲು ಆಫ್ ಮಾಡಿ 0.6 ಕಿಲೋ CO₂ ಮತ್ತು ವಿದ್ಯುತ್ ಶುಲ್ಕ ಉಳಿಸಿ.',
    'ಹಸಿರು ಅಭ್ಯಾಸ: ಮರುಬಳಕೆ ಚೀಲ ತರುವುದರಿಂದ ಪ್ಲಾಸ್ಟಿಕ್ ತ್ಯಾಜ್ಯ ಕಡಿಮೆಯಾಗುತ್ತದೆ.',
    'ಉತ್ತಮ ಕಾರ್ಯ! ಪ್ರತಿದಿನ ನಿಮ್ಮ ಚಟುವಟಿಕೆಗಳನ್ನು ದಾಖಲಿಸಿ.',
  ],
  'mr-IN': [
    'प्रत्येक छोटी कृती महत्त्वाची आहे. मेट्रो वापरल्याने दररोज 1 किलो CO₂ वाचवता येते.',
    'तुमच्या खाण्याच्या सवयी महत्त्वाच्या आहेत. आठवड्यातून एकदा शाकाहारी जेवण घेतल्याने वार्षिक 50 किलो CO₂ कमी होते.',
    'घरी ऊर्जा वाचवा: AC 2 तास आधी बंद केल्यास 0.6 किलो CO₂ आणि वीज बिल कमी होते.',
    'हिरवी सवय: पुनर्वापरयोग्य पिशवी वापरल्याने प्लास्टिक कचरा कमी होतो.',
    'छान काम! दररोज तुमच्या कृती नोंदवा आणि eco-badges मिळवा.',
  ],
  'bn-IN': [
    'প্রতিটি ছোট পদক্ষেপ গুরুত্বপূর্ণ। মেট্রো ব্যবহার করলে প্রতিদিন ১ কিলো CO₂ বাঁচানো যায়।',
    'আপনার খাদ্যাভ্যাস গুরুত্বপূর্ণ। সপ্তাহে একদিন নিরামিষ খাওয়া বার্ষিক ৫০ কিলো CO₂ কমাতে পারে।',
    'ঘরে শক্তি সাশ্রয়: AC ২ ঘণ্টা আগে বন্ধ করলে ০.৬ কিলো CO₂ এবং বিদ্যুৎ বিল কমে।',
    'সবুজ অভ্যাস: পুনর্ব্যবহারযোগ্য ব্যাগ বহন করলে প্লাস্টিক বর্জ্য কমে।',
    'দারুণ কাজ! প্রতিদিন আপনার কার্যকলাপ লগ করুন এবং eco-badges অর্জন করুন।',
  ],
  'gu-IN': [
    'દરેક નાનો કદમ મહત્વનો છે. મેટ્રો વાપરવાથી દરરોજ 1 કિલો CO₂ બચાવી શકાય છે.',
    'તમારી ખાણીપીણીની પસંદ મહત્વની છે. અઠવાડિયામાં એક વખત શાકાહારી ભોજન લેવાથી વાર્ષિક 50 કિલો CO₂ ઘટે છે.',
    'ઘરે ઉર્જા બચાવો: AC 2 કલાક વહેલા બંધ કરવાથી 0.6 કિલો CO₂ અને વીજળી બિલ ઘટે છે.',
    'લીલો વ્યવહાર: ફરી વાપરી શકાય તેવી થેલી વાપરવાથી પ્લાસ્ટિક કચરો ઘટે છે.',
    'સરસ કામ! દરરોજ તમારી ક્રિયાઓ નોંધો અને eco-badges મેળવો.',
  ],
  'ml-IN': [
    'ഓരോ ചെറിയ പ്രവൃത്തിയും പ്രധാനമാണ്. മെട്രോ ഉപയോഗിച്ചാൽ ദിവസേന 1 കിലോ CO₂ ലാഭിക്കാം.',
    'നിങ്ങളുടെ ഭക്ഷണ തിരഞ്ഞെടുപ്പ് പ്രധാനമാണ്. ആഴ്ചയിൽ ഒരു സസ്യഭക്ഷണം കഴിക്കുന്നതിലൂടെ വർഷം 50 കിലോ CO₂ കുറയ്ക്കാം.',
    'വീട്ടിൽ ഊർജ്ജം ലാഭിക്കുക: AC 2 മണിക്കൂർ നേരത്തേ ഓഫ് ചെയ്ത് 0.6 കിലോ CO₂ ലാഭിക്കാം.',
    'ഹരിത ശീലം: ആവർത്തിച്ച് ഉപയോഗിക്കാവുന്ന ബാഗ് കൊണ്ടുനടക്കുന്നത് പ്ലാസ്റ്റിക് മാലിന്യം കുറയ്ക്കും.',
    'നല്ല പ്രവൃത്തി! ദിവസേന നിങ്ങളുടെ പ്രവൃത്തികൾ ലോഗ് ചെയ്ത് eco-badges നേടൂ.',
  ],
}

/**
 * Returns a random fallback response for the given language.
 * @param {string} language - BCP-47 language code e.g. 'hi-IN'
 * @returns {string}
 */
function getFallbackResponse(language) {
  const responses = FALLBACK_RESPONSES[language] || FALLBACK_RESPONSES['en-IN']
  return responses[Math.floor(Math.random() * responses.length)]
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Fetches an AI-generated insight from Gemini for the given prompt.
 * Reads the API key from Dexie settings only.
 *
 * Falls back silently to locale templates if:
 * - No API key is stored
 * - The API call fails for any reason
 *
 * @param {string} prompt - The user's question or context
 * @param {string} [language='en-IN'] - BCP-47 language code
 * @returns {Promise<{ text: string, source: 'ai' | 'fallback' }>}
 */
export async function getAIInsight(prompt, language = 'en-IN') {
  // Always sanitize input first
  const sanitized = sanitizeInput(prompt)
  if (!sanitized) {
    return { text: getFallbackResponse(language), source: 'fallback' }
  }

  // Read API key from Dexie only — never from env vars
  let apiKey
  try {
    apiKey = await getSetting('geminiApiKey')
  } catch {
    return { text: getFallbackResponse(language), source: 'fallback' }
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return { text: getFallbackResponse(language), source: 'fallback' }
  }

  // Build the system prompt with language and context
  const languageNames = {
    'en-IN': 'English',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'kn-IN': 'Kannada',
    'mr-IN': 'Marathi',
    'bn-IN': 'Bengali',
    'gu-IN': 'Gujarati',
    'ml-IN': 'Malayalam',
  }
  const langName = languageNames[language] || 'English'

  const systemPrompt = `You are Prithvi's eco-assistant helping Indian users reduce their carbon footprint.

Respond in ${langName}.
Keep responses concise (2-3 sentences maximum).
Focus on practical, India-specific sustainability advice.
Never use emojis.

You may only answer questions related to:
- Carbon footprint
- Sustainability
- Climate change
- Recycling
- Energy consumption
- Transportation emissions
- Waste management
- Environmental impact
- Green lifestyle choices

If the user's question is unrelated to environmental sustainability, politely respond:

"I can only help with carbon footprint, sustainability, and environmental topics."

Context: The user is tracking their daily carbon footprint through the Prithvi app.`

  try {
    const controller = new AbortController()

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey.trim()}`,
      {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: sanitized }] }],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.3,
          },
        }),
      }
    )

    if (!response.ok) {
      // Don't expose HTTP error details to user
      return { text: getFallbackResponse(language), source: 'fallback' }
    }
    clearTimeout(timeoutId)
    const data = await response.json()

    if (
      !data?.candidates ||
      !data.candidates[0]?.content?.parts?.length
    ) {
      return {
        text: getFallbackResponse(language),
        source: 'fallback',
      }
    }

    const text =
      data.candidates[0].content.parts[0].text?.trim()

    if (!text) {
      return {
        text: getFallbackResponse(language),
        source: 'fallback',
      }
    }

    return { text, source: 'ai' }
  } catch {
    // Network error, timeout, parse error — silently fall back
    return { text: getFallbackResponse(language), source: 'fallback' }
  }
}

export { GEMINI_MODEL, sanitizeInput, getFallbackResponse }
