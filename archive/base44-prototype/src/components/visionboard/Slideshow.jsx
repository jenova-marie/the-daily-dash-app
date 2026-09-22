import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronLeft, ChevronRight, Pause, Play, Loader, MessageCircle, Music, Volume2, VolumeX, Star, Gauge, Shuffle, Mic, Radio, Eye, EyeOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

const AUDIO_PRESETS = [
  { label: "None", url: null },
  { label: "Rain", url: "https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/rain.mp3" },
  { label: "Ocean Waves", url: "https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/ocean.mp3" },
  { label: "Forest", url: "https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/forest.mp3" },
  { label: "Relax", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { label: "Beach Serenity", url: "https://www.no-copyright-music.com/wp-content/uploads/2021/09/BeachSerenity.mp3" },
  { label: "Tranquil Reflections", url: "https://www.no-copyright-music.com/wp-content/uploads/2021/09/TranquilReflections.mp3" },
  { label: "Calmness", url: "https://www.no-copyright-music.com/wp-content/uploads/2021/09/Calmness.mp3" },
  { label: "Peaceful", url: "https://www.no-copyright-music.com/wp-content/uploads/2021/09/Peaceful-Sleep-Music-Free-Royalty-Free-Music-by-Liborio-Conti-01-Peaceful-Sleep-Music.mp3" },
  { label: "Ambient Light", url: "https://www.no-copyright-music.com/wp-content/uploads/2021/09/AmbientLight.mp3" },
  { label: "Custom URL…", url: "custom" },
];

function AudioRow({ preset, selected, isFavorite, isDefault, onSelect, onToggleFavorite, onSetDefault }) {
  return (
    <div className={`flex items-center gap-1 rounded-lg ${selected ? "bg-primary" : "hover:bg-white/10"}`}>
      <button onClick={onSelect} className={`flex-1 text-left px-3 py-1.5 text-sm transition-colors ${selected ? "text-primary-foreground" : "text-white"}`}>
        {preset.label}
      </button>
      {preset.url !== null && (
        <div className="flex gap-1 pr-2 py-1.5">
          <button onClick={e => { e.stopPropagation(); onSetDefault(); }} className="transition-colors" title="Set as default">
            <Gauge className={`w-3.5 h-3.5 ${isDefault ? "fill-emerald-400 text-emerald-400" : "text-white/30 hover:text-emerald-400"}`} />
          </button>
          <button onClick={e => { e.stopPropagation(); onToggleFavorite(); }} className="transition-colors" title="Favorite">
            <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white/30 hover:text-yellow-400"}`} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Slideshow({ images, focusAreas = [], affirmations = [], onClose }) {
  const [shuffledImages, setShuffledImages] = useState(() => {
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    return shuffled;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [affirmationQueue, setAffirmationQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentAffirmation, setCurrentAffirmation] = useState(null);
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [showAffirmations, setShowAffirmations] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(() => {
    try {
      const defaultLabel = localStorage.getItem("slideshowDefaultAudio");
      if (defaultLabel) {
        const found = AUDIO_PRESETS.find(p => p.label === defaultLabel);
        if (found) return found;
      }
      const favLabels = JSON.parse(localStorage.getItem("slideshowAudioFavorites") || "[]");
      const favPresets = AUDIO_PRESETS.filter(p => p.url && p.url !== "custom" && favLabels.includes(p.label));
      if (favPresets.length > 0) {
        return favPresets[Math.floor(Math.random() * favPresets.length)];
      }
    } catch {}
    // Randomize from all valid presets (exclude None and Custom)
    const validPresets = AUDIO_PRESETS.filter(p => p.url && p.url !== "custom");
    return validPresets[Math.floor(Math.random() * validPresets.length)];
  });
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [favoriteAudios, setFavoriteAudios] = useState(() => {
    try { return JSON.parse(localStorage.getItem("slideshowAudioFavorites") || "[]"); } catch { return []; }
  });
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [speedKey, setSpeedKey] = useState(0); // forces kenburns restart on speed change
  const [speakAffirmations, setSpeakAffirmations] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [translatedAffirmation, setTranslatedAffirmation] = useState(null);
  const [affirmationMode, setAffirmationMode] = useState("both"); // "I", "you", "both"
  const [showAffirmationMode, setShowAffirmationMode] = useState(false);
  const [showAffirmationText, setShowAffirmationText] = useState(true);

  const audioRef = useRef(null);
  const isMountedRef = useRef(true);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const lastClickTime = useRef(0);
  const intervalRef = useRef(null);
  const audioMenuRef = useRef(null);
  const audioButtonRef = useRef(null);
  const voiceMenuRef = useRef(null);

  const englishVoicesWhitelist = [
    // Mobile (iOS/Android built-in)
    'tessa',
    // Desktop (Windows Microsoft Online) — match by first name fragment
    'microsoft ava', 'microsoft andrew', 'microsoft emma', 'microsoft brian', 'microsoft jenny',
    'microsoft aria', 'microsoft ana', 'microsoft christopher', 'microsoft eric', 'microsoft michelle',
    'microsoft steffan', 'microsoft natasha', 'microsoft sonia', 'microsoft ryan', 'microsoft libby',
    'microsoft emily', 'microsoft ezinne', 'microsoft abeo', 'microsoft molly', 'microsoft luna',
    'microsoft wayne', 'microsoft imani', 'microsoft leah', 'microsoft luke'
  ];

  const spanishVoicesWhitelist = [
    // Mobile (iOS built-in)
    'mónica', 'paulina', 'diego',
    // Desktop (Windows Microsoft Online)
    'microsoft elvira', 'microsoft alvaro', 'microsoft dalia', 'microsoft jorge'
  ];

  const frenchVoicesWhitelist = [
    // Mobile (iOS built-in)
    'amélie', 'thomas', 'nicolas',
    // Desktop (Windows Microsoft Online)
    'microsoft charline', 'microsoft gerard', 'microsoft sylvie', 'microsoft jean',
    'microsoft thierry', 'microsoft ariane', 'microsoft fabrice', 'microsoft denise',
    'microsoft henri', 'microsoft vivienne', 'microsoft remy'
  ];

  const arabicVoicesWhitelist = [
    // iOS built-in
    'maged',
    // Windows Microsoft Online (match by short name)
    'zariyah', 'hamed', 'salma', 'shakir', 'layla', 'bassel', 'nayf', 'jawhar', 'rana', 'tarek'
  ];

  const chineseVoicesWhitelist = [];

  const germanVoicesWhitelist = [
    'microsoft seraphina'
  ];

  const tagalogVoicesWhitelist = [
    // iOS built-in
    'mónica',
    // Windows Microsoft Online
    'microsoft angel', 'microsoft blessica', 'microsoft angelo'
  ];

  const isNativeLanguageVoice = (voice) => {
    const lang = voice.lang.substring(0, 2);
    return lang === voice.lang.substring(0, 2); // True if voice matches its language code
  };

  const selectedVoiceRef = useRef(null);

  useEffect(() => {
    let pollCount = 0;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // iOS Chrome sometimes never fires onvoiceschanged — poll as fallback (max 20 tries)
        if (pollCount++ < 20) setTimeout(loadVoices, 300);
        return;
      }
      
      const excludedVoices = ['david', 'mark', 'zira'];
      const isGoogle = (nameLower) => nameLower.startsWith('google ');
      const filteredVoices = voices.filter(v => {
        const nameLower = v.name.toLowerCase();
        if (excludedVoices.some(n => nameLower.includes(n))) return false;
        if (v.lang.startsWith('en-')) return isGoogle(nameLower) || englishVoicesWhitelist.some(name => nameLower.includes(name.toLowerCase()));
        if (v.lang.startsWith('es-')) return isGoogle(nameLower) || spanishVoicesWhitelist.some(name => nameLower.includes(name.toLowerCase()));
        if (v.lang.startsWith('fr-')) return isGoogle(nameLower) || frenchVoicesWhitelist.some(name => nameLower.includes(name.toLowerCase()));
        if (v.lang.startsWith('ar-') || v.lang === 'ar') return ['ar-eg', 'ar-iq', 'ar-sy', 'ar-lb', 'ar-jo'].includes(v.lang.toLowerCase());
        if (v.lang.startsWith('zh-') || v.lang === 'zh') return ['zh-cn', 'zh-tw'].includes(v.lang.toLowerCase());
        if (v.lang.startsWith('de-') || v.lang === 'de') return isGoogle(nameLower) || germanVoicesWhitelist.some(name => nameLower.includes(name.toLowerCase()));
        if (v.lang.startsWith('fil-') || v.lang.startsWith('tl-') || v.lang === 'fil') return isGoogle(nameLower) || tagalogVoicesWhitelist.some(name => nameLower.includes(name.toLowerCase()));
        return false;
      });
      
      // Fallback: if no whitelisted voices found, use any available en- voices
      const voicesToUse = filteredVoices.length > 0 ? filteredVoices : voices.filter(v => v.lang.startsWith('en-'));
      // Final fallback: just use all voices
      const finalVoices = voicesToUse.length > 0 ? voicesToUse : voices;
      
      setAvailableVoices(finalVoices);

      // Only set voice if not already set (use ref to avoid stale closure)
      if (!selectedVoiceRef.current && finalVoices.length > 0) {
        const saved = localStorage.getItem("slideshowSelectedVoice");
        const voiceToUse = (saved && finalVoices.find(v => v.name === saved)) || finalVoices[0];
        selectedVoiceRef.current = voiceToUse;
        setSelectedVoice(voiceToUse);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const accentMap = {
    'en-US': 'US English',
    'en-GB': 'British English',
    'en-AU': 'Australian English',
    'en-IN': 'Indian English',
    'en-IE': 'Irish English',
    'en-CA': 'Canadian English',
    'en-NZ': 'New Zealand English',
    'en-ZA': 'South African English',
    'en-SG': 'Singapore English',
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'es-AR': 'Spanish (Argentina)',
    'es-CO': 'Spanish (Colombia)',
    'fr-FR': 'French (France)',
    'fr-CA': 'French (Canada)',
    'fr-BE': 'French (Belgium)',
    'fr-CH': 'French (Switzerland)',
    'ar-SA': 'Arabic (Saudi Arabia)',
    'ar-EG': 'Arabic (Egypt)',
    'ar-AE': 'Arabic (UAE)',
    'ar-MA': 'Arabic (Morocco)',
    'ar-DZ': 'Arabic (Algeria)',
    'ar-IQ': 'Arabic (Iraq)',
    'ar-JO': 'Arabic Levantine',
    'ar-KW': 'Arabic (Kuwait)',
    'ar-LB': 'Arabic Levantine',
    'ar-LY': 'Arabic (Libya)',
    'ar-QA': 'Arabic (Qatar)',
    'ar-SY': 'Arabic Levantine',
    'ar-TN': 'Arabic (Tunisia)',
    'ar-YE': 'Arabic (Yemen)',
    'ar': 'Arabic',
    'zh-CN': 'Chinese Mandarin',
    'zh-TW': 'Chinese Taiwanese',
    'zh-HK': 'Chinese (Hong Kong)',
    'zh': 'Chinese',
    'de-DE': 'German (Germany)',
    'de-AT': 'German (Austria)',
    'de-CH': 'German (Switzerland)',
    'de': 'German',
    'fil-PH': 'Tagalog (Philippines)',
    'tl-PH': 'Tagalog (Philippines)',
    'fil': 'Tagalog',
  };

  const groupedByAccent = availableVoices.reduce((acc, voice) => {
    const accentLabel = accentMap[voice.lang] || voice.lang;
    if (!acc[accentLabel]) acc[accentLabel] = [];
    acc[accentLabel].push(voice);
    return acc;
  }, {});

  const activeAudioUrl = selectedAudio.url === "custom" ? customAudioUrl : selectedAudio.url;

  const toggleFavorite = (label) => {
    setFavoriteAudios(prev => {
      const next = prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label];
      localStorage.setItem("slideshowAudioFavorites", JSON.stringify(next));
      return next;
    });
  };

  const setAsDefault = (label) => {
    localStorage.setItem("slideshowDefaultAudio", label);
  };

  // Translate affirmation based on selected voice language
  const getAffirmationLanguage = () => {
    if (!selectedVoice) return 'en';
    if (selectedVoice.lang.startsWith('es-')) return 'es';
    if (selectedVoice.lang.startsWith('fr-')) return 'fr';
    if (selectedVoice.lang.startsWith('ar') || selectedVoice.lang === 'ar') return 'ar';
    if (selectedVoice.lang.startsWith('zh') || selectedVoice.lang === 'zh') return 'zh';
    if (selectedVoice.lang.startsWith('de') || selectedVoice.lang === 'de') return 'de';
    if (selectedVoice.lang.startsWith('fil') || selectedVoice.lang.startsWith('tl') || selectedVoice.lang === 'fil') return 'tl';
    return 'en';
  };

  const langNames = { es: 'Spanish', fr: 'French', ar: 'Arabic', zh: 'Chinese (Simplified)', de: 'German', tl: 'Tagalog' };

  const translateAffirmation = async (text, targetLang) => {
    if (targetLang === 'en') {
      setTranslatedAffirmation(text);
      return;
    }
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this affirmation to ${langNames[targetLang] || targetLang}. Keep it positive and motivating. Only provide the translation, no other text:\n\n"${text}"`,
      });
      setTranslatedAffirmation(response);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedAffirmation(text);
    }
  };

  // Build/rebuild the shuffle queue whenever affirmations or mode changes
  useEffect(() => {
    let filtered = affirmations.length > 0 ? affirmations : ["You are capable of achieving your vision."];
    if (affirmationMode !== "both") {
      const modeFiltered = filtered.filter(text => {
        const iMatched = text.match(/^I\s+(\w+)\s*(.*)/);
        const youMatched = text.match(/^You\s+(\w+)\s*(.*)/i);
        if (affirmationMode === "I") return iMatched;
        if (affirmationMode === "you") return youMatched;
        return true;
      });
      if (modeFiltered.length > 0) filtered = modeFiltered;
    }
    // Shuffle once and store as queue
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setAffirmationQueue(shuffled);
  }, [affirmations, affirmationMode]);

  useEffect(() => {
    if (affirmationQueue.length === 0) return;

    // Pick from queue without repeating; reshuffle when exhausted
    const pos = affirmationIndex % affirmationQueue.length;
    // When we've cycled through all, reshuffle for the next round
    if (pos === 0 && affirmationIndex > 0) {
      setAffirmationQueue(prev => [...prev].sort(() => Math.random() - 0.5));
    }

    const affirmationText = affirmationQueue[pos];
    setCurrentAffirmation({ text: affirmationText });
    const lang = getAffirmationLanguage();
    if (lang !== 'en') {
      translateAffirmation(affirmationText, lang);
    } else {
      setTranslatedAffirmation(null);
    }
  }, [affirmationIndex, affirmationQueue, selectedVoice]);

  // Text-to-speech for affirmations
  useEffect(() => {
    if (!speakAffirmations || !currentAffirmation?.text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Use translated text if available, otherwise use English
    const textToSpeak = translatedAffirmation || currentAffirmation.text;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9; // Slightly slower for natural feel
    utterance.pitch = 1.1; // Slightly higher pitch for warmth
    utterance.volume = 1;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // Fallback: select high-quality voice - prefer natural system voices
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") ||
        v.name.includes("Microsoft Aria") ||
        v.name.includes("Samantha") ||
        (v.lang === "en-US" && v.name && !v.name.includes("Google") && !v.name.includes("Microsoft"))
      ) || voices.find(v => v.lang === "en-US");

      if (preferredVoice) utterance.voice = preferredVoice;
    }

    // Prevent browser from auto-ducking the background audio during speech
    utterance.onstart = () => {
      if (audioRef.current && activeAudioUrl) {
        audioRef.current.volume = audioMuted ? 0 : audioVolume;
      }
    };
    utterance.onend = () => {
      if (audioRef.current && activeAudioUrl) {
        audioRef.current.volume = audioMuted ? 0 : audioVolume;
      }
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIndex, speakAffirmations, selectedVoice, translatedAffirmation, currentAffirmation?.text])

  useEffect(() => {
    if (isPlaying && shuffledImages?.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIdx = (prev + 1) % shuffledImages.length;
          if (nextIdx === 0) {
            reshuffle();
            return 0;
          }
          return nextIdx;
        });
        setAffirmationIndex((prev) => prev + 1);
      }, speed * 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, shuffledImages.length, speed]);

  // Audio: play on mount / track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const activeUrl = selectedAudio.url === "custom" ? customAudioUrl : selectedAudio.url;
    audio.pause();
    if (activeUrl) {
      audio.src = activeUrl;
      audio.loop = true;
      audio.volume = audioMuted ? 0 : audioVolume;
      // Try immediate autoplay; if blocked, retry on first user interaction
      const tryPlay = () => {
        if (isPlaying && audio.paused) audio.play().catch(() => {});
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — retry on the next user interaction
          const unlockHandler = () => {
            if (isMountedRef.current) tryPlay();
          };
          document.addEventListener("click", unlockHandler, { once: true });
          document.addEventListener("touchend", unlockHandler, { once: true });
        });
      }
    } else {
      audio.src = "";
    }
    return () => { audio.pause(); };
  }, [selectedAudio, customAudioUrl]);

  useEffect(() => {
    if (audioRef.current && activeAudioUrl) {
      audioRef.current.volume = audioMuted ? 0 : audioVolume;
    }
  }, [audioMuted, audioVolume, activeAudioUrl]);

  // Pause/resume audio with slideshow play state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeAudioUrl) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, activeAudioUrl]);

  const reshuffle = () => {
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    setShuffledImages(shuffled);
    setCurrentIndex(0);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + shuffledImages.length) % shuffledImages.length);
    setAffirmationIndex((prev) => prev - 1);
  };
  const goToNext = () => {
    const nextIdx = (currentIndex + 1) % shuffledImages.length;
    if (nextIdx === 0) reshuffle();
    else setCurrentIndex(nextIdx);
    setAffirmationIndex((prev) => prev + 1);
  };

  // Mobile: swipe to navigate, double-tap to toggle controls
  const handleTouchStart = (e) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    // Ensure audio plays on first interaction
    if (audioRef.current && activeAudioUrl) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    const isHorizontalSwipe = Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY);

    if (isHorizontalSwipe) {
      diffX > 0 ? goToNext() : goToPrevious();
    } else {
      // Check if touch is inside audio menu or button
      const touch = e.changedTouches[0];
      const isInsideAudioMenu = audioMenuRef.current?.contains(e.target);
      const isOnAudioButton = audioButtonRef.current?.contains(e.target);

      if (!isInsideAudioMenu && !isOnAudioButton && showAudioPicker) {
        setShowAudioPicker(false);
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      // No double-tap needed anymore — using click instead
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const controlClass = (extra = "") =>
    `transition-opacity duration-300 ${showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} ${extra}`;

  // Cleanup audio when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        const now = Date.now();
        if (now - lastClickTime.current < 300) {
          // Double click — toggle controls
          setShowControls(v => !v);
          lastClickTime.current = 0;
        } else {
          lastClickTime.current = now;
        }
        if (isMountedRef.current && audioRef.current && activeAudioUrl) audioRef.current.play().catch(() => {});
      }}
    >
      <audio ref={audioRef} />
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Slides */}
        <style>{`
          @keyframes kenburns {
            0%   { transform: scale(1.05); }
            90% { transform: scale(2.25); }
            100% { transform: scale(2.25); }
          }
          .kenburns-active {
            animation: kenburns var(--slide-speed, 30s) linear forwards;
          }
        `}</style>
        <div className="absolute inset-0 overflow-hidden z-0">
           {shuffledImages.map((img, idx) => (
             <div
               key={idx}
               className={`absolute inset-0 transition-opacity duration-300 ${idx === currentIndex ? "opacity-100" : "opacity-0"}`}
             >
              <img
                key={idx === currentIndex ? `${idx}-${speedKey}` : idx}
                src={img.image_url}
                alt={`Slide ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover ${idx === currentIndex ? "kenburns-active" : ""}`}
                style={{ "--slide-speed": `${speed}s`, transform: "scale(2.25)" }}
              />
            </div>
          ))}
        </div>

        {/* Affirmation */}
        {showAffirmations && showAffirmationText && (currentAffirmation || loadingAffirmation) && (
          <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none z-10 flex items-center justify-center">
            {loadingAffirmation ? (
              <Loader className="w-8 h-8 text-white animate-spin" />
            ) : (
              <div className="text-center max-w-2xl bg-black/50 backdrop-blur-sm px-8 py-6 rounded-lg">
                {(() => {
                  const englishText = currentAffirmation.text;
                  const iMatch = englishText.match(/^I\s+(\w+)\s*(.*)/);
                  const youMatch = englishText.match(/^You\s+(\w+)\s*(.*)/i);
                  
                  const getDisplayText = (text) => {
                    const iMatched = text.match(/^I\s+(\w+)\s*(.*)/);
                    const youMatched = text.match(/^You\s+(\w+)\s*(.*)/i);
                    
                    if (affirmationMode === "I" && iMatched) {
                      return { primary: `I ${iMatched[1]}`, secondary: iMatched[2] };
                    }
                    if (affirmationMode === "you" && youMatched) {
                      return { primary: `You ${youMatched[1]}`, secondary: youMatched[2] };
                    }
                    if (affirmationMode === "both") {
                      if (iMatched) {
                        return { primary: `I ${iMatched[1]}`, secondary: iMatched[2] };
                      }
                      if (youMatched) {
                        return { primary: `You ${youMatched[1]}`, secondary: youMatched[2] };
                      }
                    }
                    return { primary: text, secondary: null };
                  };
                  
                  const display = getDisplayText(englishText);
                  
                  const hasTranslation = translatedAffirmation && translatedAffirmation !== englishText;
                  const langLabelMap = { es: 'Español', fr: 'Français', ar: 'العربية', zh: '中文', de: 'Deutsch', tl: 'Tagalog' };
                  const langLabel = langLabelMap[getAffirmationLanguage()] || null;

                  return (
                    <div className="space-y-4">
                      {hasTranslation ? (
                        /* Side-by-side layout when translation is available */
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
                          {/* English original */}
                          <div className="flex-1 md:border-r md:border-white/30 md:pr-6">
                            <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">English</div>
                            <div className="text-2xl md:text-4xl font-display text-white drop-shadow-2xl font-bold">{display.primary}</div>
                            {display.secondary && <div className="text-base md:text-2xl font-display text-white drop-shadow-2xl font-semibold mt-2">{display.secondary}</div>}
                          </div>
                          {/* Translation */}
                          <div className="flex-1 md:pl-2">
                            <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">{langLabel}</div>
                            <div className="text-2xl md:text-4xl font-display text-white drop-shadow-2xl font-bold">{translatedAffirmation}</div>
                          </div>
                        </div>
                      ) : (
                        /* Full-width layout for English only */
                        <div>
                          <div className="text-3xl md:text-5xl font-display text-white drop-shadow-2xl font-bold">{display.primary}</div>
                          {display.secondary && <div className="text-xl md:text-3xl font-display text-white drop-shadow-2xl font-semibold mt-2">{display.secondary}</div>}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Control Widget */}
        <div className={`absolute top-6 left-3 right-3 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="bg-black/70 backdrop-blur-md rounded-2xl border border-white/20 px-3 py-2 space-y-2">

            {/* Row 1: Nav (left) | Close (right) */}
            <div className="flex items-center gap-1">
              {/* Navigation — far left */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); goToPrevious(); }} className="p-2 bg-black/60 hover:bg-black/75 rounded-full text-white border border-white/20 transition-colors" title="Previous slide">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2 py-1 bg-black/40 rounded text-white text-xs font-medium border border-white/10">
                  {currentIndex + 1} / {shuffledImages.length}
                </div>
                <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="p-2 bg-black/60 hover:bg-black/75 rounded-full text-white border border-white/20 transition-colors" title="Next slide">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1" />

              {/* Close — far right */}
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 bg-black/60 hover:bg-black/75 rounded-full text-white border border-white/20 transition-colors shrink-0" title="Close slideshow">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Row 2: All controls centered */}
            <div className="flex items-center justify-center gap-1 flex-wrap border-t border-white/10 pt-2">
              {/* Affirmation toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowAffirmations(!showAffirmations); }}
                className={`p-2 rounded-full transition-colors border ${showAffirmations ? "bg-primary text-primary-foreground border-primary/50" : "bg-black/60 hover:bg-black/75 text-white border-white/20"}`}
                title="Toggle affirmations"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              {showAffirmations && (
                <>
                  {/* Eye toggle — hide/show text while keeping audio */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAffirmationText(v => !v); }}
                    className={`p-2 rounded-full transition-colors border ${showAffirmationText ? "bg-black/60 hover:bg-black/75 text-white border-white/20" : "bg-primary text-primary-foreground border-primary/50"}`}
                    title={showAffirmationText ? "Hide text" : "Show text"}
                  >
                    {showAffirmationText ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); setSpeakAffirmations(!speakAffirmations); }}
                    className={`p-2 rounded-full transition-colors border ${speakAffirmations ? "bg-primary text-primary-foreground border-primary/50" : "bg-black/60 hover:bg-black/75 text-white border-white/20"}`}
                    title="Speak affirmations"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {speakAffirmations && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowVoicePicker(!showVoicePicker); setShowAudioPicker(false); setShowSpeedPicker(false); setShowAffirmationMode(false); }}
                        className="p-2 bg-black/60 hover:bg-black/75 rounded-full text-white border border-white/20 transition-colors"
                        title="Select voice"
                      >
                        <Radio className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowAffirmationMode(!showAffirmationMode); setShowAudioPicker(false); setShowSpeedPicker(false); setShowVoicePicker(false); }}
                          className="px-2 py-1 bg-black/60 hover:bg-black/75 rounded text-white text-xs font-medium border border-white/20 transition-colors"
                        >
                          {affirmationMode === "both" ? "I/You" : affirmationMode === "I" ? "I" : "You"}
                        </button>
                        {showAffirmationMode && (
                          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/90 border border-white/20 rounded-lg shadow-2xl p-2 z-30 w-28" onClick={e => e.stopPropagation()}>
                            <div className="space-y-1">
                              {[{ value: "I", label: "I only" }, { value: "you", label: "You only" }, { value: "both", label: "Both" }].map(mode => (
                                <button key={mode.value} onClick={() => { setAffirmationMode(mode.value); setShowAffirmationMode(false); }} className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${affirmationMode === mode.value ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/10"}`}>
                                  {mode.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {showVoicePicker && (
                        <div ref={voiceMenuRef} className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/90 border border-white/20 rounded-xl shadow-2xl p-3 w-72 z-50 max-w-[90vw]" onClick={e => e.stopPropagation()}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-2 px-1">Languages & Accents</p>
                          <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                            {Object.entries(groupedByAccent).map(([accent, voices]) => (
                              <div key={accent}>
                                <p className="text-white/40 text-xs px-2 pt-2 pb-1">{accent}</p>
                                {voices.map((voice, idx) => (
                                  <button key={idx} onClick={() => { setSelectedVoice(voice); localStorage.setItem("slideshowSelectedVoice", voice.name); setShowVoicePicker(false); }} className={`text-left w-full px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedVoice?.name === voice.name ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/10"}`}>
                                    <div className="font-medium text-xs">{voice.name}</div>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              {/* Audio */}
              <div className="relative">
                <button ref={audioButtonRef} onClick={(e) => { e.stopPropagation(); setShowAudioPicker(o => !o); setShowSpeedPicker(false); setShowVoicePicker(false); setShowAffirmationMode(false); }} className={`p-2 rounded-full transition-colors border ${activeAudioUrl ? "bg-primary text-primary-foreground border-primary/50" : "bg-black/60 hover:bg-black/75 text-white border-white/20"}`}>
                  <Music className="w-4 h-4" />
                </button>
                {showAudioPicker && (
                  <div ref={audioMenuRef} className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/90 border border-white/20 rounded-xl shadow-2xl p-3 w-64 z-30 max-w-[90vw]" onClick={e => e.stopPropagation()}>
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-2 px-1">Ambient Audio</p>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                      {favoriteAudios.length > 0 && (
                        <>
                          <p className="text-yellow-400/70 text-xs px-2 pt-1 pb-1 flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Favorites</p>
                          {AUDIO_PRESETS.filter(p => favoriteAudios.includes(p.label)).map(preset => (
                            <AudioRow key={"fav-" + preset.label} preset={preset} selected={selectedAudio.label === preset.label} isFavorite isDefault={localStorage.getItem("slideshowDefaultAudio") === preset.label} onSelect={() => setSelectedAudio(preset)} onToggleFavorite={() => toggleFavorite(preset.label)} onSetDefault={() => setAsDefault(preset.label)} />
                          ))}
                          <div className="border-t border-white/10 my-1" />
                        </>
                      )}
                      {AUDIO_PRESETS.map((preset, i) => {
                        const headers = { 1: "— Nature Sounds —", 4: "— Music —" };
                        return (
                          <div key={preset.label}>
                            {headers[i] && <p className="text-white/30 text-xs px-2 pt-2 pb-1">{headers[i]}</p>}
                            <AudioRow preset={preset} selected={selectedAudio.label === preset.label} isFavorite={favoriteAudios.includes(preset.label)} isDefault={localStorage.getItem("slideshowDefaultAudio") === preset.label} onSelect={() => setSelectedAudio(preset)} onToggleFavorite={() => toggleFavorite(preset.label)} onSetDefault={() => setAsDefault(preset.label)} />
                          </div>
                        );
                      })}
                    </div>
                    {selectedAudio.url === "custom" && (
                      <div className="mt-2">
                        <input type="text" placeholder="Paste audio URL (.mp3, etc.)" value={customAudioUrl} onChange={e => setCustomAudioUrl(e.target.value)} className="w-full px-3 py-2 bg-white/10 text-white placeholder-white/40 rounded-lg text-sm outline-none border border-white/20 focus:border-primary" />
                        <button onClick={() => setShowAudioPicker(false)} className="mt-2 w-full px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm">Apply</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={(e) => { e.stopPropagation(); setIsShuffleActive(true); const validPresets = AUDIO_PRESETS.filter(p => p.url && p.url !== "custom"); if (validPresets.length > 0) setSelectedAudio(validPresets[Math.floor(Math.random() * validPresets.length)]); setTimeout(() => setIsShuffleActive(false), 500); }} className="p-2 rounded-full transition-colors border bg-black/60 hover:bg-black/75 text-white border-white/20" title="Random audio">
                <motion.div animate={isShuffleActive ? { rotate: [0, 180, 360] } : { rotate: 0 }} transition={{ duration: 0.5 }}>
                  <Shuffle className="w-4 h-4" />
                </motion.div>
              </button>

              <button onClick={(e) => { e.stopPropagation(); if (selectedAudio.label === "None") { setShowAudioPicker(o => !o); setShowSpeedPicker(false); } else { setSelectedAudio(AUDIO_PRESETS[0]); } }} className={`p-2 rounded-full transition-colors border ${selectedAudio.label === "None" ? "bg-primary text-primary-foreground border-primary/50" : "bg-black/60 hover:bg-black/75 text-white border-white/20"}`}>
                <VolumeX className="w-4 h-4" />
              </button>

              {/* Speed */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowSpeedPicker(o => !o); setShowAudioPicker(false); setShowVoicePicker(false); setShowAffirmationMode(false); }} className="p-2 bg-black/60 hover:bg-black/75 rounded-full text-white border border-white/20 transition-colors" title="Speed">
                  <Gauge className="w-4 h-4" />
                </button>
                {showSpeedPicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/90 border border-white/20 rounded-xl shadow-2xl p-3 z-30 w-32" onClick={e => e.stopPropagation()}>
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-2 px-1">Speed</p>
                    <div className="flex flex-col gap-1">
                      {[3, 5, 8, 10, 15, 20, 30].map(s => (
                        <button key={s} onClick={() => { setSpeed(s); setSpeedKey(k => k + 1); setShowSpeedPicker(false); }} className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${speed === s ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/10"}`}>
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>


      </div>
    </div>
  );
}