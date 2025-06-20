
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { getSunMoonPositionsAtSunrise } from './swissEphemeris';

// Swiss Ephemeris-inspired planetary position calculations
export interface PlanetaryPosition {
  longitude: number;
  latitude: number;
  distance: number;
}

export interface PanchangData {
  tithi: string;
  tithiNumber: number;
  nakshatra: string;
  nakshatraNumber: number;
  yoga: string;
  karana: string;
  sunrise: Date;
  sunset: Date;
  moonrise: Date;
  moonset: Date;
  rahu: string;
  yamaghanta: string;
  gulika: string;
  abhijit: string;
}

export interface ShivVaasData {
  isShivVaas: boolean;
  type: string;
  startTime: Date;
  endTime: Date;
  significance: string;
  observances: string[];
}

// Nakshatra names in Sanskrit and English
const NAKSHATRAS = {
  sanskrit: [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशीर्षा', 'आर्द्रा', 'पुनर्वसु',
    'पुष्य', 'आश्लेषा', 'मघा', 'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी', 'हस्त', 'चित्रा',
    'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा',
    'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वभाद्रपद', 'उत्तरभाद्रपद', 'रेवती'
  ],
  english: [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu',
    'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
    'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
    'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ]
};

// Tithi names in Sanskrit and English
const TITHIS = {
  sanskrit: [
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी',
    'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा/अमावस्या'
  ],
  english: [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
    'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya'
  ]
};

// Yoga names
const YOGAS = {
  sanskrit: [
    'विष्कुम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा',
    'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र',
    'सिद्धि', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य',
    'शुभ', 'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति'
  ],
  english: [
    'Vishkumbha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma',
    'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
    'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya',
    'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'
  ]
};

// Shiv Vaas locations mapping
export const SHIV_VAAS_LOCATIONS = {
  1: { 
    sanskrit: 'कैलाश', 
    english: 'Kailash', 
    significance: {
      sanskrit: 'भगवान शिव कैलाश में—अत्यंत शुभ',
      english: 'Lord Shiva at Mount Kailash—very auspicious'
    },
    activities: {
      sanskrit: ['सभी शुभ कार्य', 'आध्यात्मिक साधना', 'नई शुरुआत'],
      english: ['All auspicious activities', 'Spiritual practices', 'New beginnings']
    }
  },
  2: { 
    sanskrit: 'गौरी सानिध्य', 
    english: 'Gauri Sannidhya', 
    significance: {
      sanskrit: 'शिव गौरी के साथ—विवाह और पारिवारिक कार्यों के लिए अच्छा',
      english: 'Shiva with Gauri—good for marriage & family'
    },
    activities: {
      sanskrit: ['विवाह समारोह', 'पारिवारिक कार्य', 'रिश्तों के मामले'],
      english: ['Marriage ceremonies', 'Family functions', 'Relationship matters']
    }
  },
  3: { 
    sanskrit: 'वृषभ', 
    english: 'Vrishabh', 
    significance: {
      sanskrit: 'शिव नंदी पर सवार—यात्रा और नए उपक्रमों के लिए अच्छा',
      english: 'Shiva riding Nandi—good for travel & new ventures'
    },
    activities: {
      sanskrit: ['यात्रा', 'नए उपक्रम', 'वाहन खरीदारी'],
      english: ['Travel', 'New ventures', 'Vehicle purchase']
    }
  },
  4: { 
    sanskrit: 'सभा', 
    english: 'Sabha', 
    significance: {
      sanskrit: 'शिव सभा में—बैठकों और कानूनी मामलों के लिए अच्छा',
      english: 'Shiva in assembly—good for meetings & legal matters'
    },
    activities: {
      sanskrit: ['व्यापारिक बैठकें', 'कानूनी मामले', 'न्यायालयी कार्य'],
      english: ['Business meetings', 'Legal matters', 'Court cases']
    }
  },
  5: { 
    sanskrit: 'भोजन', 
    english: 'Bhojan', 
    significance: {
      sanskrit: 'शिव भोजन कर रहे हैं—भोजन संस्कारों के लिए अच्छा',
      english: 'Shiva having meal—good for food ceremonies'
    },
    activities: {
      sanskrit: ['भोजन संस्कार', 'अन्नप्राशन', 'भोज आयोजन'],
      english: ['Food ceremonies', 'Annaprashan', 'Feast organizing']
    }
  },
  6: { 
    sanskrit: 'क्रीड़ा', 
    english: 'Krida', 
    significance: {
      sanskrit: 'शिव खेल में—मनोरंजन और रचनात्मकता के लिए अच्छा',
      english: 'Shiva at play—good for recreation & creativity'
    },
    activities: {
      sanskrit: ['रचनात्मक कार्य', 'मनोरंजन', 'कला और शिल्प'],
      english: ['Creative work', 'Recreation', 'Arts and crafts']
    }
  },
  7: { 
    sanskrit: 'श्मशान', 
    english: 'Shmashaan', 
    significance: {
      sanskrit: 'शिव श्मशान में—नए उपक्रमों से बचें',
      english: 'Shiva at cremation ground—avoid new ventures'
    },
    activities: {
      sanskrit: ['नई शुरुआत से बचें', 'आध्यात्मिक चिंतन', 'ध्यान'],
      english: ['Avoid new beginnings', 'Spiritual contemplation', 'Meditation']
    }
  }
};

// Add the missing calculateTithi function
export function calculateTithi(date: Date): { name: string; number: number } {
  const lunarMonth = (date.getTime() / (1000 * 60 * 60 * 24)) % 29.53;
  const tithiNumber = Math.floor(lunarMonth) + 1;
  const adjustedTithi = tithiNumber > 15 ? tithiNumber - 15 : tithiNumber;
  
  return {
    name: TITHIS.sanskrit[adjustedTithi - 1] || TITHIS.sanskrit[14],
    number: tithiNumber
  };
}

// Calculate accurate Tithi using precise astronomical method
export function calculateAccurateTithi(date: Date, latitude: number, longitude: number, language: 'sanskrit' | 'english' = 'sanskrit'): { name: string; number: number; paksha: string } {
  try {
    const positions = getSunMoonPositionsAtSunrise(date, latitude, longitude);
    
    // Calculate the angular difference between Moon and Sun (Δ)
    let moonSunDiff = (positions.moonLongitude - positions.sunLongitude + 360) % 360;
    
    // Each tithi spans 12 degrees - apply the precise formula
    const tithiNumber = Math.floor(moonSunDiff / 12) + 1;
    
    // Ensure tithi is in range 1-30
    const normalizedTithi = ((tithiNumber - 1) % 30) + 1;
    
    // Determine paksha (bright or dark half)
    const paksha = normalizedTithi <= 15 ? 
      (language === 'sanskrit' ? 'शुक्ल पक्ष' : 'Shukla Paksha') : 
      (language === 'sanskrit' ? 'कृष्ण पक्ष' : 'Krishna Paksha');
    const adjustedTithi = normalizedTithi > 15 ? normalizedTithi - 15 : normalizedTithi;
    
    return {
      name: TITHIS[language][adjustedTithi - 1] || TITHIS[language][14],
      number: normalizedTithi,
      paksha
    };
  } catch (error) {
    console.error('Error calculating accurate tithi:', error);
    // Fallback to approximation
    const lunarMonth = (date.getTime() / (1000 * 60 * 60 * 24)) % 29.53;
    const tithiNumber = Math.floor(lunarMonth) + 1;
    const adjustedTithi = tithiNumber > 15 ? tithiNumber - 15 : tithiNumber;
    
    return {
      name: TITHIS[language][adjustedTithi - 1] || TITHIS[language][14],
      number: tithiNumber,
      paksha: tithiNumber <= 15 ? 
        (language === 'sanskrit' ? 'शुक्ल पक्ष' : 'Shukla Paksha') : 
        (language === 'sanskrit' ? 'कृष्ण पक्ष' : 'Krishna Paksha')
    };
  }
}

// Calculate accurate Tithi at a specific time (not just sunrise)
export function calculateAccurateTithiAtTime(date: Date, latitude: number, longitude: number, specificTime: Date, language: 'sanskrit' | 'english' = 'sanskrit'): { name: string; number: number; paksha: string } {
  try {
    const positions = getSunMoonPositionsAtSunrise(specificTime, latitude, longitude);
    
    // Calculate the angular difference between Moon and Sun (Δ)
    let moonSunDiff = (positions.moonLongitude - positions.sunLongitude + 360) % 360;
    
    // Each tithi spans 12 degrees - apply the precise formula
    const tithiNumber = Math.floor(moonSunDiff / 12) + 1;
    
    // Ensure tithi is in range 1-30
    const normalizedTithi = ((tithiNumber - 1) % 30) + 1;
    
    // Determine paksha (bright or dark half)
    const paksha = normalizedTithi <= 15 ? 
      (language === 'sanskrit' ? 'शुक्ल पक्ष' : 'Shukla Paksha') : 
      (language === 'sanskrit' ? 'कृष्ण पक्ष' : 'Krishna Paksha');
    const adjustedTithi = normalizedTithi > 15 ? normalizedTithi - 15 : normalizedTithi;
    
    return {
      name: TITHIS[language][adjustedTithi - 1] || TITHIS[language][14],
      number: normalizedTithi,
      paksha
    };
  } catch (error) {
    console.error('Error calculating accurate tithi at specific time:', error);
    // Fallback to sunrise calculation
    return calculateAccurateTithi(date, latitude, longitude, language);
  }
}

// Calculate accurate Shiv Vaas using the proper formula: (tithi × 2 + 5) mod 7
export function calculateAccurateShivVaas(date: Date, latitude: number, longitude: number, language: 'sanskrit' | 'english' = 'sanskrit', specificTime?: Date): ShivVaasData & { 
  shivVaasIndex: number; 
  location: typeof SHIV_VAAS_LOCATIONS[1];
  sunriseTime: Date;
  tithiDetails: { name: string; number: number; paksha: string };
} {
  const tithiData = specificTime ? 
    calculateAccurateTithiAtTime(date, latitude, longitude, specificTime, language) :
    calculateAccurateTithi(date, latitude, longitude, language);
  const positions = getSunMoonPositionsAtSunrise(specificTime || date, latitude, longitude);
  
  // Apply the precise Shiv Vaas formula: (tithi × 2 + 5) mod 7
  const X = (tithiData.number * 2) + 5;
  const remainder = X % 7;
  const shivVaasIndex = remainder === 0 ? 7 : remainder;
  
  const location = SHIV_VAAS_LOCATIONS[shivVaasIndex as keyof typeof SHIV_VAAS_LOCATIONS];
  
  // Determine if it's auspicious or not
  const isAuspicious = shivVaasIndex !== 7; // Shmashaan is not auspicious for new ventures
  
  const startTime = positions.sunrise;
  const endTime = addDays(positions.sunrise, 1);
  
  return {
    isShivVaas: true, // Every day has a Shiv Vaas
    type: `${location[language]} (${location.english})`,
    startTime,
    endTime,
    significance: location.significance[language],
    observances: location.activities[language],
    shivVaasIndex,
    location,
    sunriseTime: positions.sunrise,
    tithiDetails: tithiData
  };
}

// Calculate Nakshatra
export function calculateNakshatra(date: Date, language: 'sanskrit' | 'english' = 'sanskrit'): { name: string; number: number } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const nakshatraNumber = (dayOfYear % 27) + 1;
  
  return {
    name: NAKSHATRAS[language][nakshatraNumber - 1],
    number: nakshatraNumber
  };
}

// Calculate Yoga
export function calculateYoga(date: Date, language: 'sanskrit' | 'english' = 'sanskrit'): string {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const yogaIndex = dayOfYear % 27;
  return YOGAS[language][yogaIndex];
}

// Calculate sunrise and sunset (simplified)
export function calculateSunTimes(date: Date, latitude: number, longitude: number) {
  // Simplified calculation - in real app would use precise ephemeris
  const sunrise = setHours(setMinutes(new Date(date), 30), 6);
  const sunset = setHours(setMinutes(new Date(date), 15), 18);
  
  return { sunrise, sunset };
}

// Calculate moon times (simplified)
export function calculateMoonTimes(date: Date) {
  const lunarPhase = (date.getTime() / (1000 * 60 * 60 * 24)) % 29.53;
  const moonriseHour = 6 + (lunarPhase * 0.8);
  const moonsetHour = 18 + (lunarPhase * 0.5);
  
  const moonrise = setHours(setMinutes(new Date(date), (moonriseHour % 1) * 60), Math.floor(moonriseHour));
  const moonset = setHours(setMinutes(new Date(date), (moonsetHour % 1) * 60), Math.floor(moonsetHour) % 24);
  
  return { moonrise, moonset };
}

// Calculate complete Panchang data with accurate calculations
export function calculateAccuratePanchang(date: Date, latitude: number = 28.6139, longitude: number = 77.2090, language: 'sanskrit' | 'english' = 'sanskrit', specificTime?: Date): PanchangData & {
  accurateData: {
    sunLongitude: number;
    moonLongitude: number;
    tithiDegrees: number;
  }
} {
  try {
    const positions = getSunMoonPositionsAtSunrise(specificTime || date, latitude, longitude);
    const tithiData = specificTime ? 
      calculateAccurateTithiAtTime(date, latitude, longitude, specificTime, language) :
      calculateAccurateTithi(date, latitude, longitude, language);
    const nakshatra = calculateNakshatra(date, language);
    const yoga = calculateYoga(date, language);
    
    // Calculate moon difference in degrees for tithi
    const tithiDegrees = (positions.moonLongitude - positions.sunLongitude + 360) % 360;
    
    // Calculate auspicious and inauspicious times based on sunrise
    const sunrise = positions.sunrise;
    const sunset = positions.sunset;
    
    const rahuStart = new Date(sunrise.getTime() + (4.5 * 60 * 60 * 1000)); // 4.5 hours after sunrise
    const rahuEnd = new Date(rahuStart.getTime() + (1.5 * 60 * 60 * 1000)); // 1.5 hours duration
    
    const yamaStart = new Date(sunrise.getTime() + (7.5 * 60 * 60 * 1000)); // 7.5 hours after sunrise  
    const yamaEnd = new Date(yamaStart.getTime() + (1.5 * 60 * 60 * 1000)); // 1.5 hours duration
    
    return {
      tithi: tithiData.name,
      tithiNumber: tithiData.number,
      nakshatra: nakshatra.name,
      nakshatraNumber: nakshatra.number,
      yoga,
      karana: language === 'sanskrit' ? 'बव' : 'Bava', // Simplified
      sunrise: positions.sunrise,
      sunset: positions.sunset,
      moonrise: new Date(sunrise.getTime() + (2 * 60 * 60 * 1000)), // Approximate
      moonset: new Date(sunset.getTime() + (2 * 60 * 60 * 1000)), // Approximate
      rahu: `${format(rahuStart, 'HH:mm')} - ${format(rahuEnd, 'HH:mm')}`,
      yamaghanta: `${format(yamaStart, 'HH:mm')} - ${format(yamaEnd, 'HH:mm')}`,
      gulika: '15:00 - 16:30',
      abhijit: '11:48 - 12:36',
      accurateData: {
        sunLongitude: positions.sunLongitude,
        moonLongitude: positions.moonLongitude,
        tithiDegrees
      }
    };
  } catch (error) {
    console.error('Error calculating accurate panchang:', error);
    // Fallback to basic calculation using SunCalc
    return calculateBasicPanchang(date, latitude, longitude, language);
  }
}

// Basic Panchang calculation fallback
function calculateBasicPanchang(date: Date, latitude: number, longitude: number, language: 'sanskrit' | 'english' = 'sanskrit'): PanchangData & {
  accurateData: {
    sunLongitude: number;
    moonLongitude: number;
    tithiDegrees: number;
  }
} {
  const tithi = calculateTithi(date);
  const nakshatra = calculateNakshatra(date, language);
  const yoga = calculateYoga(date, language);
  const sunTimes = calculateSunTimes(date, latitude, longitude);
  const moonTimes = calculateMoonTimes(date);
  
  return {
    tithi: tithi.name,
    tithiNumber: tithi.number,
    nakshatra: nakshatra.name,
    nakshatraNumber: nakshatra.number,
    yoga,
    karana: language === 'sanskrit' ? 'बव' : 'Bava',
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    moonrise: moonTimes.moonrise,
    moonset: moonTimes.moonset,
    rahu: '13:30 - 15:00',
    yamaghanta: '10:30 - 12:00',
    gulika: '15:00 - 16:30',
    abhijit: '11:48 - 12:36',
    accurateData: {
      sunLongitude: 45, // Approximate
      moonLongitude: 120, // Approximate
      tithiDegrees: 75 // Approximate
    }
  };
}

// Calculate Shiv Vaas - specific fasting days dedicated to Lord Shiva
export function calculateShivVaas(date: Date, language: 'sanskrit' | 'english' = 'sanskrit'): ShivVaasData {
  const tithi = calculateTithi(date);
  const nakshatra = calculateNakshatra(date, language);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  let isShivVaas = false;
  let type = '';
  let significance = '';
  let observances: string[] = [];
  
  // Monday is always auspicious for Lord Shiva
  if (dayOfWeek === 1) {
    isShivVaas = true;
    type = language === 'sanskrit' ? 'सोमवार व्रत' : 'Monday Fast';
    significance = language === 'sanskrit' ? 'भगवान शिव को समर्पित पवित्र दिन' : 'Sacred day dedicated to Lord Shiva';
    observances = language === 'sanskrit' ? 
      ['सूर्योदय से सूर्यास्त तक उपवास', 'शिव मंत्र जाप', 'रुद्राभिषेक', 'बिल्व पत्र अर्पण'] :
      ['Fast from sunrise to sunset', 'Shiva mantra chanting', 'Rudrabhishek', 'Bilva leaf offering'];
  }
  
  // Chaturdashi (14th lunar day) - Shivaratri
  if (tithi.number === 14) {
    isShivVaas = true;
    type = language === 'sanskrit' ? 'मासिक शिवरात्रि' : 'Monthly Shivaratri';
    significance = language === 'sanskrit' ? 'मासिक शिवरात्रि - अत्यंत पुण्यकारी' : 'Monthly Shivaratri - highly auspicious';
    observances = language === 'sanskrit' ?
      ['रात्रि जागरण', 'निर्जला उपवास', 'शिव तांडव स्तोत्र', 'महामृत्युंजय मंत्र'] :
      ['Night vigil', 'Nirjala fast', 'Shiva Tandava Stotra', 'Mahamrityunjaya Mantra'];
  }
  
  // Pradosh (13th lunar day)
  if (tithi.number === 13) {
    isShivVaas = true;
    type = language === 'sanskrit' ? 'प्रदोष व्रत' : 'Pradosh Fast';
    significance = language === 'sanskrit' ? 'प्रदोष काल में शिव पूजा अत्यंत फलदायी' : 'Shiva worship during Pradosh time is highly fruitful';
    observances = language === 'sanskrit' ?
      ['संध्या काल पूजा', 'शिव चालीसा पाठ', 'नंदी दर्शन', 'धूप दीप अर्पण'] :
      ['Evening worship', 'Shiva Chalisa recitation', 'Nandi darshan', 'Incense and lamp offering'];
  }
  
  // Shravan month special consideration (simplified)
  const isShravanMonth = date.getMonth() === 6 || date.getMonth() === 7; // July-August approximation
  if (isShravanMonth && dayOfWeek === 1) {
    type = language === 'sanskrit' ? 'श्रावण सोमवार व्रत' : 'Shravan Monday Fast';
    significance = language === 'sanskrit' ? 'श्रावण मास का सोमवार - सर्वोत्तम शिव व्रत' : 'Shravan month Monday - supreme Shiva fast';
  }
  
  const startTime = setHours(setMinutes(new Date(date), 0), 5); // 5:00 AM
  const endTime = setHours(setMinutes(addDays(date, 1), 0), 6); // Next day 6:00 AM
  
  return {
    isShivVaas,
    type,
    startTime,
    endTime,
    significance,
    observances
  };
}

// Determine auspicious timing for Shiva worship
export function getShivaPujaTime(date: Date, language: 'sanskrit' | 'english' = 'sanskrit'): { time: string; significance: string } {
  const hour = date.getHours();
  
  if (hour >= 4 && hour < 6) {
    return { 
      time: language === 'sanskrit' ? 'ब्रह्म मुहूर्त' : 'Brahma Muhurta', 
      significance: language === 'sanskrit' ? 'सर्वोत्तम पूजा काल' : 'Best worship time' 
    };
  } else if (hour >= 18 && hour < 20) {
    return { 
      time: language === 'sanskrit' ? 'संध्या काल' : 'Evening Time', 
      significance: language === 'sanskrit' ? 'प्रदोष पूजा का समय' : 'Pradosh worship time' 
    };
  } else if (hour >= 23 || hour < 2) {
    return { 
      time: language === 'sanskrit' ? 'निशीथ काल' : 'Midnight Time', 
      significance: language === 'sanskrit' ? 'शिवरात्रि पूजा काल' : 'Shivaratri worship time' 
    };
  } else {
    return { 
      time: language === 'sanskrit' ? 'सामान्य काल' : 'General Time', 
      significance: language === 'sanskrit' ? 'नियमित पूजा समय' : 'Regular worship time' 
    };
  }
}
