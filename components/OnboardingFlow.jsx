"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  Globe,
  MapPin,
  User,
  ClipboardList,
  ChevronLeft,
  ChevronDown,
  Search,
  Check,
  Car,
  Bus,
  Train,
  Bike,
  Footprints,
  Beef,
  Drumstick,
  Leaf,
  Zap,
  Flame,
  Sun,
  Trash2,
  Recycle,
  ShoppingBag,
  Home,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

/* ─── Static data ────────────────────────────────────────────────────── */

const LANGUAGES = [
  { code: "en", label: "English"    },
  { code: "hi", label: "हिन्दी"     },
  { code: "ta", label: "தமிழ்"      },
  { code: "te", label: "తెలుగు"     },
  { code: "bn", label: "বাংলা"      },
  { code: "mr", label: "मराठी"      },
  { code: "kn", label: "ಕನ್ನಡ"      },
  { code: "gu", label: "ગુજરાતી"   },
  { code: "ml", label: "മലയാളം"    },
];

const CITIES = [
  "Agra", "Ahmedabad", "Bengaluru", "Bhopal", "Chennai",
  "Delhi", "Hyderabad", "Jaipur", "Kochi", "Kolkata",
  "Lucknow", "Mumbai", "Nagpur", "Patna", "Pune",
  "Surat", "Vadodara", "Varanasi", "Visakhapatnam",
];

const AVATARS = [
  { id: "leaf",    emoji: "🌿", label: "Leaf"    },
  { id: "sun",     emoji: "☀️", label: "Sun"     },
  { id: "drop",    emoji: "💧", label: "Drop"    },
  { id: "seedling",emoji: "🌱", label: "Seedling"},
  { id: "earth",   emoji: "🌍", label: "Earth"   },
  { id: "cloud",   emoji: "☁️", label: "Cloud"   },
];

const QUIZ = [
  {
    id: "commute",
    question: "How do you usually commute to work or school?",
    options: [
      { id: "walk",   label: "Walk or cycle",          icon: Footprints, impact: "lowest"  },
      { id: "metro",  label: "Metro / bus / train",     icon: Train,      impact: "low"     },
      { id: "carpool",label: "Carpool with others",     icon: Car,        impact: "medium"  },
      { id: "car",    label: "Drive alone",             icon: Car,        impact: "high"    },
    ],
  },
  {
    id: "diet",
    question: "Which best describes your typical diet?",
    options: [
      { id: "vegan",  label: "Vegan",                  icon: Leaf,       impact: "lowest"  },
      { id: "veg",    label: "Vegetarian",              icon: Leaf,       impact: "low"     },
      { id: "omni",   label: "Eat everything",          icon: Drumstick,  impact: "medium"  },
      { id: "beef",   label: "High red meat",           icon: Beef,       impact: "high"    },
    ],
  },
  {
    id: "energy",
    question: "How is your home primarily powered?",
    options: [
      { id: "solar",  label: "Rooftop solar",           icon: Sun,        impact: "lowest"  },
      { id: "renew",  label: "Green electricity plan",  icon: Zap,        impact: "low"     },
      { id: "grid",   label: "Standard grid power",     icon: Home,       impact: "medium"  },
      { id: "coal",   label: "Coal / diesel backup",    icon: Flame,      impact: "high"    },
    ],
  },
  {
    id: "shopping",
    question: "How often do you buy new clothes or electronics?",
    options: [
      { id: "rare",   label: "Rarely — buy second-hand", icon: Recycle,   impact: "lowest"  },
      { id: "few",    label: "A few times a year",       icon: ShoppingBag,impact: "low"    },
      { id: "monthly",label: "Once a month",             icon: ShoppingBag,impact: "medium" },
      { id: "weekly", label: "Every week",               icon: Building2,  impact: "high"   },
    ],
  },
  {
    id: "waste",
    question: "How do you handle most of your household waste?",
    options: [
      { id: "zero",   label: "Zero waste / composting", icon: Leaf,       impact: "lowest"  },
      { id: "recycle",label: "Recycle most items",      icon: Recycle,    impact: "low"     },
      { id: "some",   label: "Recycle sometimes",       icon: Trash2,     impact: "medium"  },
      { id: "bin",    label: "Mostly landfill bin",     icon: Trash2,     impact: "high"    },
    ],
  },
];

const STEP_META = [
  { id: "language", label: "Language", icon: Globe        },
  { id: "city",     label: "City",     icon: MapPin       },
  { id: "profile",  label: "Profile",  icon: User         },
  { id: "quiz",     label: "Quiz",     icon: ClipboardList},
];

/* ─── Translations Dictionary ────────────────────────────────────────── */

const TRANSLATIONS = {
  en: {
    languageTitle: "Language",
    languageSubtitle: "Choose the language you are most comfortable with.",
    cityTitle: "Location",
    citySubtitle: "Tell us where you live so we can show your city's environmental health score.",
    cityPlaceholder: "Search your city…",
    citySearchLabel: "Search your city",
    profileTitle: "Profile",
    profileSubtitle: "Let us know your name and pick an avatar for your profile.",
    profileName: "Your name",
    profileRequired: "(required)",
    profileOptional: "(optional)",
    profilePlaceholder: "e.g. Aaditya",
    avatarLabel: "Avatar",
    btnBack: "Back",
    btnNext: "Next",
    btnFinish: "Finish Setup",
    btnRestart: "Restart setup",
    welcomeTitle: "Welcome to Prithvi!",
    welcomeSubtitle: "Your baseline carbon footprint is ready. Let's start your journey to heal the Earth.",
    btnDashboard: "Go to Dashboard",
    q_commute: "How do you usually commute to work or school?",
    opt_commute_walk: "Walk or cycle",
    opt_commute_metro: "Metro / bus / train",
    opt_commute_carpool: "Carpool with others",
    opt_commute_car: "Drive alone",
    q_diet: "Which best describes your typical diet?",
    opt_diet_vegan: "Vegan",
    opt_diet_veg: "Vegetarian",
    opt_diet_omni: "Eat everything",
    opt_diet_beef: "High red meat",
    q_energy: "How is your home primarily powered?",
    opt_energy_solar: "Rooftop solar",
    opt_energy_renew: "Green electricity plan",
    opt_energy_grid: "Standard grid power",
    opt_energy_coal: "Coal / diesel backup",
    q_shopping: "How often do you buy new clothes or electronics?",
    opt_shopping_rare: "Rarely — buy second-hand",
    opt_shopping_few: "A few times a year",
    opt_shopping_monthly: "Once a month",
    opt_shopping_weekly: "Every week",
    q_waste: "How do you handle most of your household waste?",
    opt_waste_zero: "Zero waste / composting",
    opt_waste_recycle: "Recycle most items",
    opt_waste_some: "Recycle sometimes",
    opt_waste_bin: "Mostly landfill bin",
    lowest: "Low impact",
    low: "Some impact",
    medium: "Moderate",
    high: "High impact",
  },
  hi: {
    languageTitle: "भाषा",
    languageSubtitle: "अपनी पसंदीदा भाषा चुनें। इसे बाद में बदला जा सकता है।",
    cityTitle: "स्थान",
    citySubtitle: "बताएं कि आप कहां रहते हैं ताकि हम पर्यावरण स्वास्थ्य स्कोर दिखा सकें।",
    cityPlaceholder: "अपने शहर की खोज करें…",
    citySearchLabel: "अपने शहर की खोज करें",
    profileTitle: "प्रोफ़ाइल",
    profileSubtitle: "अपना नाम बताएं और प्रोफ़ाइल अवतार चुनें।",
    profileName: "आपका नाम",
    profileRequired: "(आवश्यक)",
    profileOptional: "(वैकल्पिक)",
    profilePlaceholder: "उदा. आदित्य",
    avatarLabel: "अवतार",
    btnBack: "पीछे",
    btnNext: "आगे",
    btnFinish: "समाप्त करें",
    btnRestart: "पुनः प्रारंभ करें",
    welcomeTitle: "Prithvi में आपका स्वागत है!",
    welcomeSubtitle: "आपकी आधारभूत कार्बन पदचिह्न रिपोर्ट तैयार है। पृथ्वी को स्वस्थ बनाने की यात्रा शुरू करें।",
    btnDashboard: "डैशबोर्ड पर जाएं",
    q_commute: "आमतौर पर आप काम या स्कूल कैसे जाते हैं?",
    opt_commute_walk: "पैदल या साइकिल",
    opt_commute_metro: "मेट्रो / बस / ट्रेन",
    opt_commute_carpool: "दूसरों के साथ कारपूल",
    opt_commute_car: "अकेले ड्राइव",
    q_diet: "आपका सामान्य भोजन कैसा है?",
    opt_diet_vegan: "वीगन",
    opt_diet_veg: "शाकाहारी",
    opt_diet_omni: "सब कुछ खाते हैं",
    opt_diet_beef: "अधिक मांसाहारी",
    q_energy: "आपके घर में मुख्य रूप से बिजली कहाँ से आती है?",
    opt_energy_solar: "रूफटॉप सोलर",
    opt_energy_renew: "हरित ऊर्जा योजना",
    opt_energy_grid: "सामान्य ग्रिड पावर",
    opt_energy_coal: "कोयला / डीजल जनरेटर",
    q_shopping: "आप नए कपड़े या इलेक्ट्रॉनिक सामान कितनी बार खरीदते हैं?",
    opt_shopping_rare: "शायद ही कभी - सेकेंड हैंड",
    opt_shopping_few: "साल में कुछ ही बार",
    opt_shopping_monthly: "महीने में एक बार",
    opt_shopping_weekly: "हर हफ्ते / फास्ट फैशन",
    q_waste: "आप घर के कचरे को कैसे संभालते हैं?",
    opt_waste_zero: "शून्य-कचरा / जैविक खाद",
    opt_waste_recycle: "रीसायकल और खाद",
    opt_waste_some: "गीला-सूखा अलग, बाकी कचरा",
    opt_waste_bin: "सब कुछ एक ही डब्बे में",
    lowest: "कम प्रभाव",
    low: "कुछ प्रभाव",
    medium: "मध्यम",
    high: "उच्च प्रभाव",
  },
  ta: {
    languageTitle: "மொழி",
    languageSubtitle: "உங்களுக்கு விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும். பின்னர் மாற்றலாம்.",
    cityTitle: "இடம்",
    citySubtitle: "சுற்றுச்சூழல் சுகாதார மதிப்பெண்ணைக் காட்ட நீங்கள் எங்கு வசிக்கிறீர்கள் என்று கூறுங்கள்.",
    cityPlaceholder: "நகரத்தைத் தேடுங்கள்…",
    citySearchLabel: "நகரத்தைத் தேடுங்கள்",
    profileTitle: "சுயவிவரம்",
    profileSubtitle: "உங்கள் பெயரை உள்ளிட்டு சுயவிவர அவதாரத்தைத் தேர்ந்தெடுக்கவும்.",
    profileName: "உங்கள் பெயர்",
    profileRequired: "(தேவையானது)",
    profileOptional: "(விருப்பத்திற்குரியது)",
    profilePlaceholder: "உதாரணம்: ஆதித்யா",
    avatarLabel: "அவதார்",
    btnBack: "பின்னால்",
    btnNext: "அடுத்து",
    btnFinish: "அமைப்பை முடி",
    btnRestart: "மீண்டும் தொடங்கு",
    welcomeTitle: "பிருத்விக்கு வரவேற்கிறோம்!",
    welcomeSubtitle: "உங்கள் அடிப்படை கார்பன் தடம் தயாராக உள்ளது. பூமியை குணமாக்க உங்கள் பயணத்தைத் தொடங்குங்கள்.",
    btnDashboard: "டாஷ்போர்டுக்குச் செல்",
    q_commute: "நீங்கள் வழக்கமாக வேலைக்கு அல்லது பள்ளிக்கு எப்படிச் செல்கிறீர்கள்?",
    opt_commute_walk: "நடப்பது அல்லது மிதிவண்டி",
    opt_commute_metro: "மெட்ரோ / பேருந்து / ரயில்",
    opt_commute_carpool: "மற்றவர்களுடன் பகிர்வு வண்டி",
    opt_commute_car: "தனியாக ஓட்டுதல்",
    q_diet: "உங்கள் வழக்கமான உணவு எதுவாக இருக்கும்?",
    opt_diet_vegan: "முழு தாவர உணவு (சைவம்)",
    opt_diet_veg: "சைவ உணவு",
    opt_diet_omni: "அனைத்தும் உண்பவர்",
    opt_diet_beef: "அதிக இறைச்சி",
    q_energy: "உங்கள் வீட்டில் மின்சாரம் எவ்வாறு கிடைக்கிறது?",
    opt_energy_solar: "வீட்டு கூரை சோலார்",
    opt_energy_renew: "பசுமை மின்சாரத் திட்டம்",
    opt_energy_grid: "சாதாரண மின்சார இணைப்பு",
    opt_energy_coal: "நிலക്കരി / டீசல் ஜெனરેட்டர்",
    q_shopping: "நீங்கள் எவ்வளவு அடிக்கடி புதிய ஆடைகள் அல்லது எலக்ட்ரானிக்ஸ் வாங்குவீர்கள்?",
    opt_shopping_rare: "அரிதாக - பழைய பொருட்கள் வாங்குவேன்",
    opt_shopping_few: "வருடத்திற்கு சில முறை",
    opt_shopping_monthly: "மாதத்திற்கு ஒரு முறை",
    opt_shopping_weekly: "வாராந்திர / விரைவு ஃபேஷன்",
    q_waste: "வீட்டுக் கழிவுகளை நீங்கள் எவ்வாறு கையாளுகிறீர்கள்?",
    opt_waste_zero: "பூஜ்ஜிய கழிவு / உரம் தயாரித்தல்",
    opt_waste_recycle: "மறுசுழற்சி மற்றும் உரம்",
    opt_waste_some: "மறுசுழற்சி செய்யக்கூடியவற்றை பிரிப்பேன்",
    opt_waste_bin: "அனைத்தையும் ஒரே குப்பையில போடுவேன்",
    lowest: "குறைந்த தாக்கம்",
    low: "சில தாக்கம்",
    medium: "மிதமான",
    high: "அதிக தாக்கம்",
  },
  te: {
    languageTitle: "భాష",
    languageSubtitle: "మీకు ఇష్టమైన భాషను ఎంచుకోండి. దీన్ని తర్వాత మార్చుకోవచ్చు.",
    cityTitle: "స్థానం",
    citySubtitle: "మీ నగరం యొక్క పర్యావరణ ఆరోగ్య స్కోర్‌ను చూపించడానికి మీరు ఎక్కడ నివసిస్తున్నారో చెప్పండి.",
    cityPlaceholder: "నగరం కోసం వెతకండి…",
    citySearchLabel: "నగరం కోసం వెతకండి",
    profileTitle: "ప్రొఫైల్",
    profileSubtitle: "మీ పేరును తెలియజేసి, ప్రొఫైల్ అవతార్‌ను ఎంచుకోండి.",
    profileName: "మీ పేరు",
    profileRequired: "(తప్పనిసరి)",
    profileOptional: "(ఐచ్ఛికం)",
    profilePlaceholder: "ఉదా. ఆదిత్య",
    avatarLabel: "అవతార్",
    btnBack: "వెనుకకు",
    btnNext: "తర్వాత",
    btnFinish: "పూర్తి చేయి",
    btnRestart: "మళ్ళీ ప్రారంభించు",
    welcomeTitle: "పృథ్వికి స్వాగతం!",
    welcomeSubtitle: "మీ బేస్ లైన్ కార్బన్ ఫుట్‌ప్రింట్ సిద్ధంగా ఉంది. భూమిని రక్షించే ప్రయాణాన్ని ప్రారంభించండి.",
    btnDashboard: "డాష్‌బోర్డ్‌కు వెళ్ళు",
    q_commute: "మీరు సాధారణంగా పనికి లేదా పాఠశాలకు ఎలా వెళతారు?",
    opt_commute_walk: "నడక లేదా సైకిల్",
    opt_commute_metro: "మెట్రో / బస్సు / రైలు",
    opt_commute_carpool: "ఇతరులతో కార్‌పూల్",
    opt_commute_car: "ఒంటరిగా డ్రైవ్ చేయడం",
    q_diet: "మీ సాధారణ ఆహారం ఏది బాగా వివరిస్తుంది?",
    opt_diet_vegan: "వీగన్",
    opt_diet_veg: "శాకాహారం",
    opt_diet_omni: "అన్నీ తింటాను",
    opt_diet_beef: "ఎక్కువ మాంసాహారం",
    q_energy: "మీ ఇంటికి ప్రధానంగా విద్యుత్ ఎలా వస్తుంది?",
    opt_energy_solar: "రూఫ్‌టాప్ సోలార్",
    opt_energy_renew: "గ్రీన్ ఎలక్ట్రిసిటీ ప్లాన్",
    opt_energy_grid: "సాధారణ గ్రిడ్ పవర్",
    opt_energy_coal: "బొగ్గు / డీజిల్ జనరేటర్",
    q_shopping: "మీరు ఎంత తరచుగా కొత్త బట్టలు లేదా ఎలక్ట్రానిక్స్ కొంటారు?",
    opt_shopping_rare: "చాలా అరుదుగా - సెకండ్ హ్యాండ్",
    opt_shopping_few: "సంవత్సరానికి కొన్ని సార్లు",
    opt_shopping_monthly: "నెలకు ఒకసారి",
    opt_shopping_weekly: "వారానికోసారి / ఫాస్ట్ ఫ్యాషన్",
    q_waste: "మీరు ఇంటి వ్యర్థాలను ఎలా నిర్వହିస్తారు?",
    opt_waste_zero: "జీరో-వేస్ట్ / ఆర్గానిక్ కంపోస్ట్",
    opt_waste_recycle: "చాలా వరకు రీసైకిల్, కొద్దిగా కంపోస్ట్",
    opt_waste_some: "రీసైకిల్ చేయగలవి వేరు చేస్తాను",
    opt_waste_bin: "అన్నీ ఒకే డబ్బాలో వేస్తాను",
    lowest: "తక్కువ ప్రభావం",
    low: "కొంత ప్రభావం",
    medium: "మధ్యస్థం",
    high: "ఎక్కువ ప్రభావం",
  },
  kn: {
    languageTitle: "ಭಾಷೆ",
    languageSubtitle: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ. ನಂತರ ಬದಲಾಯಿಸಬಹುದು.",
    cityTitle: "ಸ್ಥಳ",
    citySubtitle: "ನಿಮ್ಮ ನಗರದ ಪರಿಸರ ಆರೋಗ್ಯ ಸ್ಕೋರ್ ತಿಳಿಯಲು ನೀವು ಎಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ ಎಂದು ತಿಳಿಸಿ.",
    cityPlaceholder: "ನಗರಾನ್ವೇಷಣೆ…",
    citySearchLabel: "ನಗರವನ್ನು ಹುಡುಕಿ",
    profileTitle: "ಪ್ರೊಫೈಲ್",
    profileSubtitle: "ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಪ್ರೊಫೈಲ್ ಅವತಾರವನ್ನು ಆರಿಸಿ.",
    profileName: "ನಿಮ್ಮ ಹೆಸರು",
    profileRequired: "(ಕಡ್ಡಾಯ)",
    profileOptional: "(ಐಚ್ಛಿಕ)",
    profilePlaceholder: "ಉದಾ. ಆದಿತ್ಯ",
    avatarLabel: "ಅವತಾರ",
    btnBack: "ಹಿಂದಕ್ಕೆ",
    btnNext: "ಮುಂದೆ",
    btnFinish: "ಸಿದ್ಧತೆ ಮುಗಿಸಿ",
    btnRestart: "ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಿ",
    welcomeTitle: "ಪೃಥ್ವಿಗೆ ಸ್ವಾಗತ!",
    welcomeSubtitle: "ನಿಮ್ಮ ಮೂಲ ಕಾರ್ಬನ್ ಹೆಜ್ಜೆಗುರುತು ಸಿದ್ಧವಾಗಿದೆ. ಭೂಮಿಯನ್ನು ರಕ್ಷಿಸುವ ನಿಮ್ಮ ಪ್ರಯಾಣವನ್ನು ಪ್ರಾರಂಭಿಸಿ.",
    btnDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ",
    q_commute: "ನೀವು ಸಾಮಾನ್ಯವಾಗಿ ಕೆಲಸಕ್ಕೆ ಅಥವಾ ಶಾಲೆಗೆ ಹೇಗೆ ಹೋಗುತ್ತೀರಿ?",
    opt_commute_walk: "ನಡಿಗೆ ಅಥವಾ ಸೈಕಲ್",
    opt_commute_metro: "ಮೆಟ್ರೋ / ಬಸ್ / ರೈಲು",
    opt_commute_carpool: "ಇತರರೊಂದಿಗೆ ಕಾರ್‌ಪೂಲ್",
    opt_commute_car: "ಒಂಟಿಯಾಗಿ ಡ್ರೈವ್ ಮಾಡುವುದು",
    q_diet: "ನಿಮ್ಮ ಆಹಾರ ಪದ್ಧತಿಯನ್ನು ಯಾವುದು ಉತ್ತಮವಾಗಿ ವಿವರಿಸುತ್ತದೆ?",
    opt_diet_vegan: "ಸಸ್ಯಾಹಾರಿ (ವೀಗನ್)",
    opt_diet_veg: "ಸಾಮಾನ್ಯ ಸಸ್ಯಾಹಾರಿ",
    opt_diet_omni: "ಎಲ್ಲವನ್ನೂ ಸೇವಿಸುತ್ತೇನೆ",
    opt_diet_beef: "ಹೆಚ್ಚು ಮಾಂಸಾಹಾರಿ",
    q_energy: "ನಿಮ್ಮ ಮನೆಗೆ ಮುಖ್ಯವಾಗಿ ವಿದ್ಯುತ್ ಹೇಗೆ ಬರುತ್ತದೆ?",
    opt_energy_solar: "ರೂಫ್‌ಟಾಪ್ ಸೋಲಾರ್",
    opt_energy_renew: "ಹಸಿರು ವಿದ್ಯುತ್ ಯೋಜನೆ",
    opt_energy_grid: "ಸಾಮಾನ್ಯ ಗ್ರಿಡ್ ವಿದ್ಯುತ್",
    opt_energy_coal: "ಕಲ್ಲಿದ್ದಲು / ಡೀಸೆಲ್ ಜನರೇಟರ್",
    q_shopping: "ನೀವು ಎಷ್ಟು ಬಾರಿ ಹೊಸ ಬಟ್ಟೆ ಅಥವಾ ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಖರೀದಿಸುತ್ತೀರಿ?",
    opt_shopping_rare: "ಅಪರೂಪವಾಗಿ - ಸೆಕೆಂಡ್ ಹ্যান্ড",
    opt_shopping_few: "ವರ್ಷಕ್ಕೆ ಕೆಲವು ಬಾರಿ",
    opt_shopping_monthly: "ತಿಂಗಳಿಗೊಮ್ಮೆ",
    opt_shopping_weekly: "ವಾರಕ್ಕೊಮ್ಮೆ / ಫಾಸ್ಟ್ ಫ್ಯಾಶನ್",
    q_waste: "ಮನೆಯ ಕಸವನ್ನು ನೀವು ಹೇಗೆ ನಿರ್ವಹಿಸುತ್ತೀರಿ?",
    opt_waste_zero: "ಶೂನ್ಯ ಕಸ / ಜೈವಿಕ ಗೊಬ್ಬರ",
    opt_waste_recycle: "ರೀಸೈಕಲ್ ಮತ್ತು ಗೊಬ್ಬರ ತಯಾರಿಕೆ",
    opt_waste_some: "ರೀಸೈಕಲ್ ಕಸ ಬೇರ್ಪಡಿಸುವಿಕೆ",
    opt_waste_bin: "ಎಲ್ಲವನ್ನೂ ಒಂದೇ ಬುಟ್ಟಿಗೆ ಹಾಕುವುದು",
    lowest: "ಕಡಿಮೆ ಪರಿಣಾಮ",
    low: "ಕೆಲವು ಪರಿಣಾಮ",
    medium: "ಮಧ್ಯಮ",
    high: "ಹೆಚ್ಚಿನ ಪರಿಣಾಮ",
  },
  mr: {
    languageTitle: "भाषा",
    languageSubtitle: "तुमची आवडती भाषा निवडा. ही नंतर सेटिंग्जमध्ये बदलता येईल.",
    cityTitle: "स्थान",
    citySubtitle: "तुमच्या शहराचा पर्यावरण आरोग्य स्कोअर पाहण्यासाठी तुम्ही कुठे राहता ते सांगा.",
    cityPlaceholder: "तुमचे शहर शोधा…",
    citySearchLabel: "तुमचे शहर शोधा",
    profileTitle: "प्रोफाइल",
    profileSubtitle: "तुमचे नाव सांगा आणि प्रोफाइलसाठी एक अवतार निवडा.",
    profileName: "तुमचे नाव",
    profileRequired: "(आवश्यक)",
    profileOptional: "(पर्यायी)",
    profilePlaceholder: "उदा. आदित्य",
    avatarLabel: "अवतार",
    btnBack: "मागे",
    btnNext: "पुढे",
    btnFinish: "पूर्ण करा",
    btnRestart: "पुन्हा सुरू करा",
    welcomeTitle: "Prithvi मध्ये आपले स्वागत आहे!",
    welcomeSubtitle: "तुमचा कार्बन फूटप्रिंट अहवाल तयार आहे. पृथ्वीला वाचवण्यासाठी तुमचा प्रवास सुरू करा.",
    btnDashboard: "डॅशबोर्डवर जा",
    q_commute: "तुम्ही सहसा कामावर किंवा शाळेत कसे जाता?",
    opt_commute_walk: "पायथ्याशी किंवा सायकल",
    opt_commute_metro: "मेट्रो / बस / ट्रेन",
    opt_commute_carpool: "इतरांसोबत कारपूल",
    opt_commute_car: "एकटे वाहन चालवणे",
    q_diet: "तुमचा सामान्य आहार कसा आहे?",
    opt_diet_vegan: "शाकाहारी (व्हेगन)",
    opt_diet_veg: "शाकाहारी",
    opt_diet_omni: "सर्वकाही खाणे",
    opt_diet_beef: "जास्त मांसाहारी",
    q_energy: "तुमच्या घरात मुख्यत्वे वीज कोठून येते?",
    opt_energy_solar: "रूफटॉप सोलर",
    opt_energy_renew: "हरित वीज योजना",
    opt_energy_grid: "सामान्य ग्रिड पॉवर",
    opt_energy_coal: "कोळसा / डिझेल जनरेटर",
    q_shopping: "तुम्ही नवीन कपडे किंवा इलेक्ट्रॉनिक्स वस्तू किती वेळा खरेदी करता?",
    opt_shopping_rare: "कधीतरी - जुन्या वस्तू खरेदी करणे",
    opt_shopping_few: "वर्षातून काही वेळा",
    opt_shopping_monthly: "महिन्यातून एकदा",
    opt_shopping_weekly: "दर आठवड्याला / फास्ट फॅशन",
    q_waste: "तुम्ही घरातील कचऱ्याचे व्यवस्थापन कसे करता?",
    opt_waste_zero: "शून्य कचरा / सेंद्रिय खत",
    opt_waste_recycle: "पुनर्वापर आणि खत निर्मिती",
    opt_waste_some: "पुनर्वापर करण्यायोग्य वेगळा करणे",
    opt_waste_bin: "सर्व काही एकाच कचराकुंडीत",
    lowest: "कमी प्रभाव",
    low: "काही प्रभाव",
    medium: "मध्यम",
    high: "उच्च प्रभाव",
  },
  bn: {
    languageTitle: "ভাষা",
    languageSubtitle: "আপনার পছন্দের ভাষা নির্বাচন করুন। এটি পরে সেটিংসে পরিবর্তন করতে পারবেন।",
    cityTitle: "স্থান",
    citySubtitle: "আপনার শহরের পরিবেশগত স্বাস্থ্য স্কোর দেখতে আপনি কোথায় থাকেন তা বলুন।",
    cityPlaceholder: "আপনার শহর খুঁজুন…",
    citySearchLabel: "আপনার শহর খুঁজুন",
    profileTitle: "প্রোফাইল",
    profileSubtitle: "আপনার নাম বলুন এবং প্রোফাইলের জন্য একটি অবতার বেছে নিন।",
    profileName: "আপনার নাম",
    profileRequired: "(প্রয়োজনীয়)",
    profileOptional: "(ঐচ্ছিক)",
    profilePlaceholder: "যেমন: আদিত্য",
    avatarLabel: "অবতার",
    btnBack: "পিছনে",
    btnNext: "সামনে",
    btnFinish: "সম্পন্ন করুন",
    btnRestart: "পুনরায় শুরু করুন",
    welcomeTitle: "Prithvi-তে আপনাকে স্বাগতম!",
    welcomeSubtitle: "আপনার বেসলাইন কার্বন ফুটপ্রিন্ট প্রস্তুত। পৃথিবীকে সুস্থ করার আপনার যাত্রা শুরু করুন।",
    btnDashboard: "ড্যাশবোর্ডে যান",
    q_commute: "আপনি সাধারণত কীভাবে কাজে বা স্কুলে যাতায়াত করেন?",
    opt_commute_walk: "হেঁটে বা সাইকেলে",
    opt_commute_metro: "মেট্রো / বাস / ট্রেন",
    opt_commute_carpool: "অন্যদের সাথে কারপুল",
    opt_commute_car: "নিজে একা গাড়ি চালানো",
    q_diet: "কোনটি আপনার সাধারণ খাদ্যাভ্যাস বর্ণনা করে?",
    opt_diet_vegan: "ভেগান",
    opt_diet_veg: "নিরামিষাশী",
    opt_diet_omni: "সবকিছু খাই",
    opt_diet_beef: "অতিরিক্ত মাংসাশী",
    q_energy: "আপনার বাড়িতে মূলত কীভাবে বিদ্যুৎ সরবরাহ হয়?",
    opt_energy_solar: "ছাদের সোলার",
    opt_energy_renew: "সবুজ বিদ্যুৎ পরিকল্পনা",
    opt_energy_grid: "সাধারণ গ্রিড বিদ্যুৎ",
    opt_energy_coal: "কয়লা / ডিজেল জেনারেটর",
    q_shopping: "আপনি কত ঘন ঘন নতুন পোশাক বা ইলেকট্রনিক্স কেনেন?",
    opt_shopping_rare: "খুব কমই - সেকেন্ড হ্যান্ড কিনি",
    opt_shopping_few: "বছরে কয়েকবার",
    opt_shopping_monthly: "মাসে একবার",
    opt_shopping_weekly: "সাপ্তাহিক / ফাস্ট ফ্যাশন",
    q_waste: "আপনি কীভাবে ঘরের বর্জ্য নিষ্কাশন করেন?",
    opt_waste_zero: "শূন্য-বর্জ্য / জৈব সার তৈরি",
    opt_waste_recycle: "বেশিরভাগ রিসাইকেল ও সার তৈরি",
    opt_waste_some: "রিসাইকেল যোগ্য বর্জ্য আলাদা করা",
    opt_waste_bin: "সবকিছু এক বালতিতে ফেলা",
    lowest: "কম প্রভাব",
    low: "সামান্য প্রভাব",
    medium: "মাঝারি",
    high: "অধিক প্রভাব",
  },
  gu: {
    languageTitle: "ભાષા",
    languageSubtitle: "તમારી પસંદગીની ભાષા પસંદ કરો. આ પછીથી બદલી શકાય છે.",
    cityTitle: "સ્થાન",
    citySubtitle: "તમારા શહેરનો પર્યાવરણ સ્વાસ્થ્ય સ્કોર જોવા માટે તમે ક્યાં રહો છો તે જણાવો.",
    cityPlaceholder: "તમારું શહેર શોધો…",
    citySearchLabel: "તમારું શહેર શોધો",
    profileTitle: "પ્રોફાઇલ",
    profileSubtitle: "તમારું નામ જણાવો અને એક પ્રોફાઇલ અવતાર પસંદ કરો.",
    profileName: "તમારું નામ",
    profileRequired: "(જરૂરી)",
    profileOptional: "(વૈકલ્પિક)",
    profilePlaceholder: "દા.ત. આદિત્ય",
    avatarLabel: "અવતાર",
    btnBack: "પાછા",
    btnNext: "આગળ",
    btnFinish: "પૂર્ણ કરો",
    btnRestart: "ફરીથી શરૂ કરો",
    welcomeTitle: "Prithvi માં આપનું સ્વાગત છે!",
    welcomeSubtitle: "તમારો પ્રારંભિક કાર્બન ફૂટપ્રિન્ટ રિપોર્ટ તૈયાર છે. પૃથ્વીને બચાવવાની તમારી સફર શરૂ કરો.",
    btnDashboard: "ડેશબોર્ડ પર જાઓ",
    q_commute: "તમે સામાન્ય રીતે કામ અથવા શાળાએ કેવી રીતે જાઓ છો?",
    opt_commute_walk: "પગપાળા અથવા સાયકલ",
    opt_commute_metro: "મેટ્રો / બસ / ટ્રેન",
    opt_commute_carpool: "અન્ય લોકો સાથે કારપૂલ",
    opt_commute_car: "એકલા ડ્રાઇવ કરવું",
    q_diet: "તમારા સામાન્ય ખોરાક વિશે કયું સાચું છે?",
    opt_diet_vegan: "શાકાહારી (વેગન)",
    opt_diet_veg: "શાકાહારી",
    opt_diet_omni: "બધું ખાવું",
    opt_diet_beef: "વધુ માંસાહારી",
    q_energy: "તમારા ઘરે મુખ્યત્વે વીજળી ક્યાંથી આવે છે?",
    opt_energy_solar: "રૂફટોપ સોલર",
    opt_energy_renew: "ગ્રીન વીજળી યોજના",
    opt_energy_grid: "સામાન્ય ગ્રીડ પાવર",
    opt_energy_coal: "કોલસો / ડીઝલ જનરેટર",
    q_shopping: "તમે નવા કપડાં કે ઇલેક્ટ્રોનિક્સ કેટલી વાર ખરીદો છો?",
    opt_shopping_rare: "ભાગ્યે જ - જૂનું ખરીદવું",
    opt_shopping_few: "વર્ષમાં થોડી વાર",
    opt_shopping_monthly: "મહિનામાં એક વાર",
    opt_shopping_weekly: "દર અઠવાડિયે / ફાસ્ટ ફેશન",
    q_waste: "તમે ઘરના કચરાનો નિકાલ કેવી રીતે કરો છો?",
    opt_waste_zero: "શૂન્ય કચરો / સેન્દ્રિય ખાતર",
    opt_waste_recycle: "મોટાભાગનું રિસાયકલ અને ખાતર",
    opt_waste_some: "રિસાયકલ કચરો અલગ કરવો",
    opt_waste_bin: "બધું એક જ કચરાપેટીમાં",
    lowest: "ઓછો પ્રભાવ",
    low: "થોડો પ્રભાવ",
    medium: "મધ્યમ",
    high: "ઉચ્ચ પ્રભાવ",
  },
  ml: {
    languageTitle: "ഭാഷ",
    languageSubtitle: "നിങ്ങൾക്ക് താൽപ്പര്യമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക. ഇത് പിന്നീട് മാറ്റാം.",
    cityTitle: "സ്ഥലം",
    citySubtitle: "നിങ്ങളുടെ നഗരത്തിന്റെ പരിസ്ഥിതി ആരോഗ്യ സ്കോർ കാണാൻ നിങ്ങൾ എവിടെയാണ് താമസിക്കുന്നതെന്ന് പറയുക.",
    cityPlaceholder: "നഗരം തിരയുക…",
    citySearchLabel: "നഗരം തിരയുക",
    profileTitle: "പ്രൊഫൈൽ",
    profileSubtitle: "നിങ്ങളുടെ പേര് നൽകി പ്രൊഫൈൽ അവതാർ തിരഞ്ഞെടുക്കുക.",
    profileName: "നിങ്ങളുടെ പേര്",
    profileRequired: "(ആവശ്യമാണ്)",
    profileOptional: "(വേണമെങ്കിൽ)",
    profilePlaceholder: "ഉദാ. ആദിത്യ",
    avatarLabel: "അവതാർ",
    btnBack: "പിന്നിലേക്ക്",
    btnNext: "അടുത്തത്",
    btnFinish: "പൂർത്തിയാക്കുക",
    btnRestart: "വീണ്ടും തുടങ്ങുക",
    welcomeTitle: "പൃഥ്വിയിലേക്ക് സ്വാഗതം!",
    welcomeSubtitle: "നിങ്ങളുടെ അടിസ്ഥാന കാർബൺ കാൽപ്പാട് റിപ്പോർട്ട് തയ്യാറാണ്. ഭൂമിയെ സംരക്ഷിക്കാനുള്ള നിങ്ങളുടെ യാത്ര ആരംഭിക്കൂ.",
    btnDashboard: "ഡാഷ്‌ബോർഡിലേക്ക് പോവുക",
    q_commute: "നിങ്ങൾ സാധാരണയായി ജോലിസ്ഥലത്തോ സ്കൂളിലോ എങ്ങനെയാണ് പോകുന്നത്?",
    opt_commute_walk: "നടത്തം അല്ലെങ്കിൽ സൈക്കിൾ",
    opt_commute_metro: "മെട്രോ / ബസ് / ട്രെയിൻ",
    opt_commute_carpool: "മറ്റുള്ളവരുമായി പങ്കിട്ട വണ്ടി",
    opt_commute_car: "ഒറ്റയ്ക്ക് വാഹനം ഓടിക്കുക",
    q_diet: "നിങ്ങളുടെ സാധാരണ ഭക്ഷണരീതി ഏതാണ്?",
    opt_diet_vegan: "സസ്യാഹാരം (വീഗൻ)",
    opt_diet_veg: "സാധാരണ സസ്യാഹാരം",
    opt_diet_omni: "എല്ലാം കഴിക്കുന്നു",
    opt_diet_beef: "കൂടുതൽ മാംസാഹാരം",
    q_energy: "നിങ്ങളുടെ വീട്ടിൽ പ്രധാനമായും വൈദ്യുതി എങ്ങനെയാണ് ലഭിക്കുന്നത്?",
    opt_energy_solar: "റൂഫ്‌ടോപ്പ് സോളാർ",
    opt_energy_renew: "ഹരിത വൈദ്യുതി പദ്ധതി",
    opt_energy_grid: "സാധാരണ ഗ്രിഡ് പവർ",
    opt_energy_coal: "കൽക്കരി / ഡീസൽ ജനറേറ്റർ",
    q_shopping: "നിങ്ങൾ എത്ര തവണ പുതിയ വസ്ത്രങ്ങളോ ഇലക്ട്രോണിക്സോ വാങ്ങാറുണ്ട്?",
    opt_shopping_rare: "വളരെ അപൂർവ്വമായി - സെക്കൻഡ് ഹാൻഡ് വാങ്ങാറുണ്ട്",
    opt_shopping_few: "വർഷത്തിൽ ചില തവണ",
    opt_shopping_monthly: "മാസത്തിലൊരിക്കൽ",
    opt_shopping_weekly: "ആഴ്ചയിലൊരിക്കൽ / ഫാസ്റ്റ് ഫാഷൻ",
    q_waste: "വീട്ടിലെ മാലിന്യങ്ങൾ നിങ്ങൾ എങ്ങനെയാണ് കൈകാര്യം ചെയ്യാറുള്ളത്?",
    opt_waste_zero: "മാലിന്യമുക്തം / ജൈവവളം നിർമ്മാണം",
    opt_waste_recycle: "കൂടുതലും പുനരുപയോഗം",
    opt_waste_some: "പുനരുപയോഗം ചെയ്യാൻ കഴിയുന്നവ വേർതിരിക്കും",
    opt_waste_bin: "എല്ലാം ഒരു ബിന്നിലേക്ക് മാറ്റുന്നു",
    lowest: "കുറഞ്ഞ ആघातം",
    low: "ചില ആഘാതങ്ങൾ",
    medium: "മിതമായ",
    high: "ഉയർന്ന ആഘാതം",
  }
};

/* ─── Progress dots ──────────────────────────────────────────────────── */

function ProgressDots({ total, current }) {
  return (
    <nav aria-label="Onboarding progress" className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          role="img"
          aria-label={
            i < current ? `Step ${i + 1} completed` :
            i === current ? `Step ${i + 1} current` :
            `Step ${i + 1} upcoming`
          }
          className={cn(
            "rounded-full transition-all duration-300",
            i === current
              ? "w-6 h-2.5 bg-primary"
              : i < current
                ? "size-2.5 bg-primary/50"
                : "size-2.5 bg-border",
          )}
        />
      ))}
    </nav>
  );
}

/* ─── Step header ────────────────────────────────────────────────────── */

function StepHeader({ step, subtitle }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  const meta = STEP_META[step];
  const Icon = meta.icon;
  
  const stepLabels = {
    language: tLocal("languageTitle", "Language"),
    city: tLocal("cityTitle", "Location"),
    profile: tLocal("profileTitle", "Profile"),
    quiz: tLocal("profileTitle", "Quiz"),
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm"
      >
        <Icon className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground">{stepLabels[meta.id] || meta.label}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed text-pretty max-w-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ─── Step 1: Language ───────────────────────────────────────────────── */

function LanguageStep({ value, onChange }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  return (
    <div className="flex flex-col gap-5">
      <StepHeader step={0} subtitle={tLocal("languageSubtitle", "Choose the language you are most comfortable with.")} />

      <div
        role="radiogroup"
        aria-label="Language selection"
        className="grid grid-cols-3 gap-2"
      >
        {LANGUAGES.map((lang) => {
          const selected = value === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(lang.code)}
              className={cn(
                "flex items-center justify-center px-2 py-3 rounded-xl border text-sm font-medium",
                "transition-all duration-150 select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                selected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.03]"
                  : "bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-transparent",
              )}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 2: City ───────────────────────────────────────────────────── */

function CityStep({ value, onChange }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const inputId             = useId();
  const listId              = useId();
  const containerRef        = useRef(null);

  const filtered = CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <StepHeader step={1} subtitle={tLocal("citySubtitle", "Tell us where you live so we can show your city's environmental health score.")} />

      <div ref={containerRef} className="relative">
        <label htmlFor={inputId} className="sr-only">{tLocal("citySearchLabel", "Search your city")}</label>
        <div className="relative flex items-center">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            placeholder={tLocal("cityPlaceholder", "Search your city…")}
            value={open ? query : (value || query)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-autocomplete="list"
            onFocus={() => { setQuery(""); setOpen(true); }}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            className={cn(
              "w-full rounded-xl border border-border bg-card pl-9 pr-3 py-3 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors duration-150",
            )}
          />
        </div>

        {open && filtered.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label="City suggestions"
            className={cn(
              "absolute z-20 mt-1 w-full max-h-52 overflow-y-auto",
              "rounded-2xl border border-border bg-card shadow-xl",
              "animate-in fade-in slide-in-from-top-2 duration-150",
            )}
          >
            {filtered.map((city) => (
              <li
                key={city}
                role="option"
                aria-selected={city === value}
                onClick={() => { onChange(city); setQuery(""); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100",
                  city === value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {city}
              </li>
            ))}
          </ul>
        )}
      </div>

      {value && !open && (
        <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary font-medium">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {value}
          <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Profile ────────────────────────────────────────────────── */

function ProfileStep({ name, onNameChange, avatar, onAvatarChange }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  const nameId = useId();

  return (
    <div className="flex flex-col gap-5">
      <StepHeader step={2} subtitle={tLocal("profileSubtitle", "Let us know your name and pick an avatar for your profile.")} />

      {/* Name input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-medium text-foreground">
          {tLocal("profileName", "Your name")} <span aria-hidden="true" className="text-muted-foreground">{tLocal("profileRequired", "(required)")}</span>
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="given-name"
          placeholder={tLocal("profilePlaceholder", "e.g. Aaditya")}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-required="true"
          className={cn(
            "w-full rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-colors duration-150",
          )}
        />
      </div>

      {/* Avatar picker */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          {tLocal("avatarLabel", "Avatar")} <span className="text-xs text-muted-foreground font-normal">{tLocal("profileOptional", "(optional)")}</span>
        </p>
        <div
          role="radiogroup"
          aria-label="Avatar selection"
          className="grid grid-cols-6 gap-2"
        >
          {AVATARS.map((av) => {
            const selected = avatar === av.id;
            return (
              <button
                key={av.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={av.label}
                onClick={() => onAvatarChange(selected ? null : av.id)}
                className={cn(
                  "flex items-center justify-center rounded-xl aspect-square text-2xl",
                  "border transition-all duration-150 select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  selected
                    ? "border-primary bg-primary/10 scale-110 shadow-sm"
                    : "border-border bg-card hover:bg-accent hover:border-transparent",
                )}
              >
                <span role="img" aria-hidden="true">{av.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Radio card ─────────────────────────────────────────────────────── */

const IMPACT_STYLES = {
  lowest: "bg-primary/8  text-primary    border-primary/20",
  low:    "bg-accent     text-accent-foreground border-accent/30",
  medium: "bg-amber-50  text-amber-700  border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40",
  high:   "bg-destructive/8 text-destructive border-destructive/20",
};

function RadioCard({ option, selected, onSelect, quizId }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  const Icon = option.icon;
  const labelText = tLocal(`opt_${quizId}_${option.id}`, option.label);
  const impactText = tLocal(option.impact, option.impact);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(option.id)}
      className={cn(
        "flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left",
        "transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        selected
          ? "border-primary bg-primary/8 shadow-sm"
          : "border-border bg-card hover:bg-secondary hover:border-transparent",
      )}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
          selected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="size-4.5" />
      </span>

      {/* Label */}
      <span className="flex-1 text-sm font-medium text-foreground leading-snug">
        {labelText}
      </span>

      {/* Impact badge */}
      <span
        className={cn(
          "shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold",
          IMPACT_STYLES[option.impact],
        )}
      >
        {impactText}
      </span>

      {/* Checkmark */}
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 flex size-5 items-center justify-center rounded-full border-2 transition-all duration-150",
          selected
            ? "border-primary bg-primary text-primary-foreground scale-110"
            : "border-border",
        )}
      >
        {selected && <Check className="size-3.5 stroke-[3]" />}
      </span>
    </button>
  );
}

/* ─── Step 4: Quiz ───────────────────────────────────────────────────── */

function QuizStep({ answers, onAnswer }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  const [qIndex, setQIndex] = useState(0);
  const qId                 = useId();

  const q = QUIZ[qIndex];
  const selected = answers[q.id];

  const handleSelect = (optionId) => {
    onAnswer((prev) => ({ ...prev, [q.id]: optionId }));
    // Auto-advance question with a slight delay for better UX
    if (qIndex < QUIZ.length - 1) {
      setTimeout(() => setQIndex((i) => i + 1), 200);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Quiz Progress header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Question {qIndex + 1} of {QUIZ.length}
        </span>
        <div className="flex gap-1" role="img" aria-label={`Question progress: ${qIndex + 1} of ${QUIZ.length}`}>
          {QUIZ.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-200",
                i === qIndex
                  ? "w-4 bg-primary"
                  : answers[QUIZ[i].id]
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-border",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Back link inside quiz if on Q2+ */}
        {qIndex > 0 && (
          <button
            type="button"
            onClick={() => setQIndex((i) => i - 1)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit focus-visible:outline-none focus-visible:underline"
          >
            <ChevronLeft className="size-3" />
            Previous question
          </button>
        )}

        <h3 className="text-base font-bold text-foreground leading-snug">
          {tLocal(`q_${q.id}`, q.question)}
        </h3>

        <div
          role="radiogroup"
          aria-label={tLocal(`q_${q.id}`, q.question)}
          className="flex flex-col gap-2"
        >
          {q.options.map((opt) => (
            <RadioCard
              key={opt.id}
              option={opt}
              quizId={q.id}
              selected={selected === opt.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Bottom Navigation ──────────────────────────────────────────────── */

function NavBar({ step, totalSteps, onBack, onNext, nextDisabled, isLast }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  return (
    <footer className="flex items-center justify-between border-t border-border/60 pt-4 mt-auto">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        className={cn(
          "flex items-center gap-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-150",
          "text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-0 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <ChevronLeft className="size-4" />
        {tLocal("btnBack", "Back")}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={cn(
          "px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150",
          "bg-primary text-primary-foreground shadow-sm",
          "hover:opacity-90 active:scale-95",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        )}
      >
        {isLast ? tLocal("btnFinish", "Finish Setup") : tLocal("btnNext", "Next")}
      </button>
    </footer>
  );
}

/* ─── Completion screen ──────────────────────────────────────────────── */

function CompletionScreen({ name, onStart, onRestart }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  return (
    <div className="flex flex-col gap-6 text-center py-4">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Sprout/Badge */}
        <span
          className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-md animate-bounce duration-[1800ms]"
          aria-hidden="true"
        >
          <Leaf className="size-8" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-foreground">
            {tLocal("welcomeTitle", "Welcome to Prithvi!")} {name && `${name}`}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty max-w-xs">
            {tLocal("welcomeSubtitle", "Your baseline carbon footprint is ready. Let's start your journey to heal the Earth.")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-bold shadow-md",
            "bg-primary text-primary-foreground hover:opacity-90 active:scale-98 transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          )}
        >
          {tLocal("btnDashboard", "Go to Dashboard")}
        </button>

        <button
          type="button"
          onClick={onRestart}
          aria-label="Restart onboarding"
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground",
            "hover:text-foreground hover:bg-secondary",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {tLocal("btnRestart", "Restart setup")}
        </button>
      </div>
    </div>
  );
}

/* ─── OnboardingFlow ─────────────────────────────────────────────────── */

/**
 * OnboardingFlow — a 4-step wizard for Prithvi onboarding.
 *
 * @param {{ onComplete?: (data: object) => void }} props
 */
export function OnboardingFlow({ onComplete }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const tLocal = (key, defaultText) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || defaultText;
  };

  const [step,     setStep]     = useState(0);
  const [done,     setDone]     = useState(false);

  // Step 0
  const [language, setLanguage] = useState("en");
  // Step 1
  const [city,     setCity]     = useState("");
  // Step 2
  const [name,     setName]     = useState("");
  const [avatar,   setAvatar]   = useState(null);
  // Step 3
  const [answers,  setAnswers]  = useState({});

  const TOTAL = 4;

  const canAdvance = [
    !!language,                   // step 0: language must be chosen
    !!city,                       // step 1: city must be chosen
    name.trim().length > 0,       // step 2: name required
    Object.keys(answers).length === QUIZ.length, // step 3: all 5 answered
  ][step];

  const lastDataRef = useRef(null);

  function handleNext() {
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
    } else {
      const data = { language, city, name, avatar, answers };
      lastDataRef.current = data;
      setDone(true);
      onComplete?.(data);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleStart() {
    onComplete?.(lastDataRef.current ?? { language, city, name, avatar, answers });
  }

  function handleRestart() {
    setStep(0);
    setDone(false);
    setLanguage("en");
    setCity("");
    setName("");
    setAvatar(null);
    setAnswers({});
  }

  return (
    <div
      role="main"
      aria-label="Prithvi onboarding"
      className={cn(
        "w-full max-w-sm mx-auto",
        "rounded-2xl border border-border bg-card text-card-foreground",
        "shadow-[0_8px_40px_-8px_oklch(0.42_0.13_145_/_18%)]",
        "dark:shadow-[0_8px_40px_-8px_oklch(0_0_0_/_40%)]",
        "p-6 flex flex-col gap-6",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
      )}
    >
      {!done ? (
        <>
          {/* Top: step label + progress dots */}
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Step {step + 1} of {TOTAL}
              </span>
              <span className="text-xs text-muted-foreground">
                {step === 0 && tLocal("languageTitle", "Language")}
                {step === 1 && tLocal("cityTitle", "Location")}
                {step === 2 && tLocal("profileTitle", "Profile")}
                {step === 3 && tLocal("profileTitle", "Quiz")}
              </span>
            </div>
            <ProgressDots total={TOTAL} current={step} />
          </header>

          {/* Step content */}
          <div
            key={step}
            className="flex-1 animate-in fade-in slide-in-from-right-4 duration-250"
          >
            {step === 0 && (
              <LanguageStep
                value={language}
                onChange={(code) => {
                  setLanguage(code);
                  i18n.changeLanguage(code);
                }}
              />
            )}
            {step === 1 && (
              <CityStep value={city} onChange={setCity} />
            )}
            {step === 2 && (
              <ProfileStep
                name={name}
                onNameChange={setName}
                avatar={avatar}
                onAvatarChange={setAvatar}
              />
            )}
            {step === 3 && (
              <QuizStep answers={answers} onAnswer={setAnswers} />
            )}
          </div>

          {/* Navigation */}
          <NavBar
            step={step}
            totalSteps={TOTAL}
            onBack={handleBack}
            onNext={handleNext}
            nextDisabled={!canAdvance}
            isLast={step === TOTAL - 1}
          />
        </>
      ) : (
        <CompletionScreen name={name} onStart={handleStart} onRestart={handleRestart} />
      )}
    </div>
  );
}
