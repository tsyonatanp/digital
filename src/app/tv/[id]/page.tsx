'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { Database } from '../../../lib/supabase'
import { 
  Newspaper, 
  Phone, 
  AlertTriangle, 
  Clock, 
  Building,
  MapPin,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react'

type User = Database['public']['Tables']['users']['Row']
type Notice = Database['public']['Tables']['notices']['Row']
type Image = Database['public']['Tables']['images']['Row']
type Style = Database['public']['Tables']['styles']['Row']

interface TVDisplayProps {
  params: Promise<{
    id: string
  }>
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

// הוספת הפונקציות לראש הקובץ
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatHebrewDate = (date: Date) => {
  return date.toLocaleDateString('he-IL-u-ca-hebrew', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function TVDisplayPage({ params }: TVDisplayProps) {
  useEffect(() => {
    console.log('🖥️ TV Display Page נטען!');
  }, []);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [style, setStyle] = useState<Style | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<NewsItem[]>([])
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const [noticePaused, setNoticePaused] = useState(false)
  const [noticeFade, setNoticeFade] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  const eventHandlersRef = useRef<{ 
    handleEnded?: () => void; 
    handleLoadedMeta?: () => void;
    handlePlaying?: () => void;
    handlePause?: () => void;
    handleStalled?: () => void;
    handleError?: (e: Event) => void;
  }>({});

  const clickCount = useRef(0)
  const lastClickTime = useRef(0)
  const [hebrewDate, setHebrewDate] = useState('');
  const [shabbatTimes, setShabbatTimes] = useState({ entry: '', exit: '', parsha: '', entryDate: '', exitDate: '' });
  
  // State לניהול מצב שבת/חג
  const [isShabbatMode, setIsShabbatMode] = useState(false);
  const [currentHolidayName, setCurrentHolidayName] = useState<string>(''); // שם החג/שבת הנוכחי
  const originalImageIndexRef = useRef<number | null>(null);
  const wasMusicPlayingRef = useRef(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // מיפוי בין חגים לתמונות ייחודיות
  const holidayImages: Record<string, string> = {
    'שבת': '/images/shabbat.gif',
    'ראש השנה': '/images/rosh-hashana.gif',
    'יום כיפור': '/images/yom-kippur.gif',
    'סוכות': '/images/sukkot.gif',
    'שמיני עצרת': '/images/simchat-torah.gif',
    'שמחת תורה': '/images/simchat-torah.gif',
    'חנוכה': '/images/chanukah.gif',
    'פורים': '/images/purim.gif',
    'פסח': '/images/pesach.gif',
    'שבועות': '/images/shavuot.jpg',
    'תשעה באב': '/images/tisha-bav.gif',
  };
  
  // פונקציה לקבלת תמונת החג המתאימה
  const getHolidayImage = (holidayName: string): string => {
    // חיפוש מדויק
    if (holidayImages[holidayName]) {
      return holidayImages[holidayName];
    }
    
    // חיפוש חלקי - בדיקה אם שם החג מכיל מילות מפתח
    const lowerName = holidayName.toLowerCase();
    if (lowerName.includes('ראש השנה') || lowerName.includes('ר\"ה')) {
      return holidayImages['ראש השנה'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('יום כיפור') || lowerName.includes('כיפור')) {
      return holidayImages['יום כיפור'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('סוכות')) {
      return holidayImages['סוכות'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('שמיני עצרת') || lowerName.includes('שמחת תורה')) {
      return holidayImages['שמיני עצרת'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('חנוכה') || lowerName.includes('חנוכה')) {
      return holidayImages['חנוכה'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('פורים')) {
      return holidayImages['פורים'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('פסח') || lowerName.includes('פסח')) {
      return holidayImages['פסח'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('שבועות')) {
      return holidayImages['שבועות'] || '/images/shabbat.gif';
    }
    if (lowerName.includes('תשעה באב') || lowerName.includes('ט\"ב')) {
      return holidayImages['תשעה באב'] || '/images/shabbat.gif';
    }
    
    // fallback לתמונת שבת כללית
    return '/images/shabbat.gif';
  };
  
  // הוספת state למוזיקה
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fullyPlayingRef = useRef(false);
  const trackDurationMsRef = useRef<number>(0);
  const fullyNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTrackIndexRef = useRef(0);
  const SHOW_MUSIC_CONTROLS = false;

  const getTrackUrl = (index: number): string => {
    try {
      return new URL(musicTracks[index] || '', window.location.origin).toString();
    } catch {
      return musicTracks[index] || '';
    }
  };

  const scheduleFullyNext = () => {
    if (fullyNextTimerRef.current) {
      clearTimeout(fullyNextTimerRef.current);
      fullyNextTimerRef.current = null;
    }
    if (!fullyPlayingRef.current || trackDurationMsRef.current <= 0) return;
    
    console.log(`⏰ מזמן מעבר לשיר הבא בעוד ${trackDurationMsRef.current + 1000}ms`);
    fullyNextTimerRef.current = setTimeout(() => {
      console.log('⏰ טיימר Fully הסתיים - עובר לשיר הבא');
      playNextTrack();
    }, Math.max(5_000, trackDurationMsRef.current + 1000));
  };
  
  // רשימת קבצי המוזיקה
  const musicTracks = [
    '/audio/Reach Out Your Hand The Yanuka  Melodies.mp3',  // הקצר ביותר - ראשון
    '/audio/Blossoming of the Trees The Yanuka Melodies.mp3',
    '/audio/The Lone Shepherd The Yanuka Melodies.mp3',
    '/audio/The Time of Our Redemption The Yanuka Melodies.mp3',
    '/audio/From Distress to Deliverance The Yanuka Melodies.mp3'  // הארוך ביותר - אחרון
  ];

  // בדיקת זמינות קבצים
  useEffect(() => {
    console.log('🎵 בדיקת זמינות קבצי מוזיקה:');
    musicTracks.forEach((track, index) => {
      const audio = new Audio();
      audio.addEventListener('canplaythrough', () => {
        console.log(`✅ קובץ ${index + 1} זמין: ${track}`);
      });
      audio.addEventListener('error', () => {
        console.error(`❌ קובץ ${index + 1} לא זמין: ${track}`);
      });
      audio.src = track;
    });
  }, []);

  // פונקציה לשליטה במוזיקה - גישה פשוטה
  const toggleMusic = async () => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
      // עצירת המוניטורינג
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      console.log('⏸️ מוזיקה הושהתה');
      try {
        const fully: any = (window as any).fully;
        if (fully && typeof fully.stopSound === 'function') {
          fully.stopSound();
          fullyPlayingRef.current = false;
        }
      } catch {}
    } else {
      // ודא שהנגן אינו מושתק לפני ניסיון ניגון יזום
      audioRef.current.muted = false;
      audioRef.current.play()
        .then(() => {
          setIsMusicPlaying(true);
          setAutoplayBlocked(false);
          startProgressMonitoring(); // התחלת המוניטורינג
          console.log('▶️ מוזיקה הופעלה');
        })
        .catch(async () => {
          //fallback ל-Fully Kiosk אם קיים
          try {
            const fully: any = (window as any).fully;
            if (fully && typeof fully.playSound === 'function') {
              const toggleUrl = getTrackUrl(currentTrackIndex);
              const toggleDuration = await getTrackDuration(toggleUrl);
              trackDurationMsRef.current = toggleDuration > 0 ? toggleDuration : 300000;
              fully.playSound(toggleUrl);
              fullyPlayingRef.current = true;
              setIsMusicPlaying(true);
              setAutoplayBlocked(false);
              startProgressMonitoring(); // התחלת המוניטורינג גם ב-Fully
              scheduleFullyNext();
            } else {
              alert('לא ניתן להפעיל מוזיקה. נסה ללחוץ על המסך קודם.');
            }
          } catch {
            alert('לא ניתן להפעיל מוזיקה. נסה ללחוץ על המסך קודם.');
          }
        });
    }
  };

  // פונקציה לבדיקת תקינות האודיו
  const checkAudioHealth = () => {
    if (audioRef.current) {
      console.log('🔍 בדיקת תקינות אודיו:');
      console.log('- נגן קיים:', !!audioRef.current);
      console.log('- מקור:', audioRef.current.src);
      console.log('- נגן:', !audioRef.current.paused);
      console.log('- נפח:', audioRef.current.volume);
      console.log('- זמן נוכחי:', audioRef.current.currentTime);
      console.log('- משך:', audioRef.current.duration);
    }
  };

  // Timer למעקב אחרי התקדמות השיר
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // פונקציה לניטור התקדמות השיר
  const startProgressMonitoring = (trackIndex?: number) => {
    // עצירת טיימר קיים
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    
    const currentIndex = trackIndex !== undefined ? trackIndex : currentTrackIndex;
    console.log(`🔍 התחלת מוניטורינג לשיר ${currentIndex + 1}`);
    
    progressTimerRef.current = setInterval(() => {
      if (!audioRef.current || !isMusicPlaying) return;
      
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      
      // בדיקה אם השיר הסתיים
      if (duration > 0 && current >= duration - 0.5) {
        console.log(`🎵 שיר ${currentIndex + 1} הסתיים (מוניטורינג) - עובר לשיר הבא`);
        console.log(`🔍 currentTrackIndex במוניטורינג: ${currentIndex}`);
        clearInterval(progressTimerRef.current!);
        playNextTrack();
      }
      
      // בדיקה אם השיר נתקע
      if (audioRef.current.paused && isMusicPlaying) {
        console.log('⚠️ הנגן נתקע - מנסה להפעיל מחדש');
        audioRef.current.play().catch(() => {
          console.log('❌ נכשל להפעיל מחדש');
        });
      }
    }, 1000); // בדיקה כל שנייה
  };

  // פונקציה פשוטה להוספת event listeners בסיסיים
  const addBasicAudioListeners = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
  
    // הסר מאזינים קודמים באמצעות הרפרנס השמור
    if (eventHandlersRef.current.handleLoadedMeta) audio.removeEventListener('loadedmetadata', eventHandlersRef.current.handleLoadedMeta);
    if (eventHandlersRef.current.handleEnded) audio.removeEventListener('ended', eventHandlersRef.current.handleEnded);
    if (eventHandlersRef.current.handlePlaying) audio.removeEventListener('playing', eventHandlersRef.current.handlePlaying);
    if (eventHandlersRef.current.handlePause) audio.removeEventListener('pause', eventHandlersRef.current.handlePause);
    if (eventHandlersRef.current.handleStalled) audio.removeEventListener('stalled', eventHandlersRef.current.handleStalled);
    if (eventHandlersRef.current.handleError) audio.removeEventListener('error', eventHandlersRef.current.handleError);

    // הגדרת המאזינים החדשים - שימוש ב-refs כדי לקבל ערכים עדכניים
    const newHandleLoadedMeta = () => {
      if (!audioRef.current) return;
      const dur = Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0;
      trackDurationMsRef.current = isNaN(dur) ? 0 : Math.round(dur * 1000);
      console.log(`📀 נטען Meta לשיר ${currentTrackIndex + 1}: ${dur.toFixed(1)} שניות`);
      if (fullyPlayingRef.current) {
        scheduleFullyNext();
      } else {
        console.log(`🎵 נגן רגיל - המעבר יתבצע אוטומטית בסיום השיר`);
      }
    };
  
    const newHandleEnded = () => {
      // קבלת הערך העדכני מ-ref במקום מ-state
      const currentIndex = currentTrackIndexRef.current;
      console.log(`🎵 אירוע 'ended' התרחש לשיר ${currentIndex + 1}. עובר לשיר הבא.`);
      console.log(`🔍 currentTrackIndex ב-ended: ${currentIndex}`);
      setIsMusicPlaying(false);
      playNextTrack();
    };

    const newHandlePlaying = () => {
      const currentIndex = currentTrackIndexRef.current;
      console.log(`▶️✅ אירוע 'playing' התרחש לשיר ${currentIndex + 1}. הנגן פעיל.`);
      setIsMusicPlaying(true);
      setAutoplayBlocked(false);
    };

    const newHandleStalled = () => {
      const currentIndex = currentTrackIndexRef.current;
      console.warn(`⏳ אירוע 'stalled' התרחש לשיר ${currentIndex + 1}. ייתכן שיש בעיית רשת.`);
    };

    const newHandleError = (e: Event) => {
      const currentIndex = currentTrackIndexRef.current;
      const mediaError = (e.target as HTMLAudioElement).error;
      console.error(`❌ אירוע 'error' על הנגן לשיר ${currentIndex + 1}. קוד: ${mediaError?.code}, הודעה: ${mediaError?.message}`);
      setIsMusicPlaying(false);
    };

    const newHandlePause = () => {
      const currentIndex = currentTrackIndexRef.current;
      console.log(`⏸️ אירוע 'pause' התרחש לשיר ${currentIndex + 1}.`);
      setIsMusicPlaying(false);
    };
  
    // הוספת המאזינים החדשים
    audio.addEventListener('loadedmetadata', newHandleLoadedMeta, { once: true });
    audio.addEventListener('ended', newHandleEnded);
    audio.addEventListener('playing', newHandlePlaying);
    audio.addEventListener('pause', newHandlePause);
    audio.addEventListener('stalled', newHandleStalled);
    audio.addEventListener('error', newHandleError);
  
    // שמירת המאזינים החדשים ברפרנס לצורך הסרה עתידית
    eventHandlersRef.current = {
      handleLoadedMeta: newHandleLoadedMeta,
      handleEnded: newHandleEnded,
      handlePlaying: newHandlePlaying,
      handlePause: newHandlePause,
      handleStalled: newHandleStalled,
      handleError: newHandleError
    };
  };

  // פונקציה למעבר לשיר הבא
  const playNextTrack = async () => {
    // קבלת הערך העדכני מ-ref
    const currentIndex = currentTrackIndexRef.current;
    const nextIndex = (currentIndex + 1) % musicTracks.length;
    console.log(`🎵 מעבר לשיר ${nextIndex + 1}/${musicTracks.length}: ${musicTracks[nextIndex]}`);
    console.log(`🔍 currentTrackIndex לפני עדכון: ${currentIndex}`);
    
    // עצירת המוניטורינג הנוכחי
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    
    // עצירת הנגן הנוכחי לחלוטין
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // עדכון מצב הנגן לפני המעבר
    setIsMusicPlaying(false);
    setCurrentTrackIndex(nextIndex);
    currentTrackIndexRef.current = nextIndex;
    console.log(`🔍 currentTrackIndex אחרי עדכון: ${nextIndex}`);
    const nextUrl = getTrackUrl(nextIndex);

    try {
      const fully: any = (window as any).fully;
      if (fullyPlayingRef.current && fully && typeof fully.playSound === 'function') {
        // השג duration לפני ניגון
        const durationMs = await getTrackDuration(nextUrl);
        trackDurationMsRef.current = durationMs > 0 ? durationMs : 300000; // default 5min if failed
        
        fully.playSound(nextUrl);
        scheduleFullyNext();
        return;
      }
    } catch {}

    if (audioRef.current) {
      // הפסקת השיר הנוכחי
      audioRef.current.pause();
      audioRef.current.src = nextUrl;
      audioRef.current.load();
      
      // החלפת listeners
      addBasicAudioListeners();
      
      // ודא שהלופ כבוי
      audioRef.current.loop = false;

      // המתנה קצרה ואז ניגון
      setTimeout(() => {
        console.log(`[playNextTrack setTimeout] isMusicPlaying: ${isMusicPlaying}, audioRef.current: ${!!audioRef.current}`);
        if (audioRef.current) {
          console.log(`[playNextTrack setTimeout] קורא ל-play() על ${audioRef.current.src}`);
          audioRef.current.play()
            .then(() => {
              console.log(`✅ [playNextTrack] .then() - שיר ${nextIndex + 1} התחיל לנגן`);
              startProgressMonitoring(nextIndex);
            })
            .catch((error) => {
              console.error(`❌ [playNextTrack] .catch() - שגיאה בניגון שיר ${nextIndex + 1}:`, error);
              // נסה שוב אחרי שגיאה
              setTimeout(() => {
                if (audioRef.current) {
                  console.log(`[playNextTrack retry] מנסה לנגן שוב...`);
                  audioRef.current.play().catch(e => console.error(`[playNextTrack retry] נכשל שוב`, e));
                }
              }, 1000);
            });
        }
      }, 100);
    }
  };

  // פונקציה למעבר לשיר הקודם
  const playPreviousTrack = async () => {
    // קבלת הערך העדכני מ-ref
    const currentIndex = currentTrackIndexRef.current;
    const prevIndex = currentIndex === 0 ? musicTracks.length - 1 : currentIndex - 1;
    console.log(`🎵 מעבר לשיר הקודם ${prevIndex + 1}/${musicTracks.length}: ${musicTracks[prevIndex]}`);
    
    // עצירת המוניטורינג הנוכחי
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    
    // עצירת הנגן הנוכחי לחלוטין
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // עדכון מצב הנגן לפני המעבר
    setIsMusicPlaying(false);
    setCurrentTrackIndex(prevIndex);
    currentTrackIndexRef.current = prevIndex;
    const prevUrl = getTrackUrl(prevIndex);

    try {
      const fully: any = (window as any).fully;
      if (fullyPlayingRef.current && fully && typeof fully.playSound === 'function') {
        // השג duration לפני ניגון
        const durationMs = await getTrackDuration(prevUrl);
        trackDurationMsRef.current = durationMs > 0 ? durationMs : 300000; // default 5min if failed
        
        fully.playSound(prevUrl);
        scheduleFullyNext();
        return;
      }
    } catch {}

    if (audioRef.current) {
      // הפסקת השיר הנוכחי
      audioRef.current.pause();
      audioRef.current.src = prevUrl;
      audioRef.current.load();
      
      // החלפת listeners
      addBasicAudioListeners();
      
      // ודא שהלופ כבוי
      audioRef.current.loop = false;

      // המתנה קצרה ואז ניגון
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              console.log(`✅ שיר ${prevIndex + 1} התחיל לנגן`);
              startProgressMonitoring(prevIndex);
            })
            .catch((error) => {
              console.error(`❌ שגיאה בניגון שיר ${prevIndex + 1}:`, error);
              // נסה שוב אחרי שגיאה
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.play().catch(console.error);
                }
              }, 1000);
            });
        }
      }, 100);
    }
  };

  // פונקציה לרענון קשיח
  const handleHardRefresh = () => {
    window.location.reload();
  };

  // אתחול אודיו + ניסיון Autoplay אגרסיבי + fallback מושתק
  useEffect(() => {
    audioRef.current = new Audio(getTrackUrl(0));
    audioRef.current.volume = 0.3;
    audioRef.current.loop = false; // וידוא נוסף שהלופ כבוי בהתחלה
    // תחילה ננסה ללא השתקה
    audioRef.current.muted = false;
    
    // עדכון ה-ref
    currentTrackIndexRef.current = 0;
    
    // הוספת event listeners בסיסיים
    addBasicAudioListeners();

    // ניסיון ראשון: ניגון עם volume מלא
    audioRef.current.play()
      .then(() => {
        console.log('🎵 מוזיקה הופעלה אוטומטית!');
        setIsMusicPlaying(true);
        startProgressMonitoring(); // התחלת המוניטורינג
      })
      .catch(() => {
        console.log('❌ Autoplay נחסם - מעבר למצב מושתק');
        setAutoplayBlocked(true);
        // אם נחסם, עבור למצב מושתק
        if (audioRef.current) {
          audioRef.current.muted = true;
          audioRef.current.play().catch(() => {
            console.log('גם autoplay מושתק נחסם - מחכה לאינטראקציה');
          });
        }
      });

    // אם Fully Kiosk זמין, נסה להפעיל דרך הממשק המקומי (עוקף חסימות דפדפן)
    try {
      const fully: any = (window as any).fully;
      if (fully && typeof fully.setAudioVolume === 'function') {
        try { fully.setAudioVolume(0.3); } catch {}
      }
    } catch {}
    
    // Event listeners נוספים בפונקציה addAudioEventListeners

    // נסיון חוזר אוטומטי למשך דקה ראשונה (כל 5ש׳׳), למקרה שהמדיניות השתחררה
    let retries = 0;
    const retryTimer = setInterval(async () => {
      if (!audioRef.current) return;
      if (!audioRef.current.paused || fullyPlayingRef.current) {
        clearInterval(retryTimer);
        return;
      }
      if (retries >= 12) {
        clearInterval(retryTimer);
        return;
      }
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
        setAutoplayBlocked(false);
        startProgressMonitoring(); // התחלת המוניטורינג
        clearInterval(retryTimer);
        console.log('🎵 מוזיקה הופעלה בניסיון חוזר!');
      }).catch(async () => {
        try {
          const fully: any = (window as any).fully;
          if (fully && typeof fully.playSound === 'function') {
            const initialUrl = getTrackUrl(currentTrackIndex);
            const durationMs = await getTrackDuration(initialUrl);
            trackDurationMsRef.current = durationMs > 0 ? durationMs : 300000;
            fully.playSound(initialUrl);
            fullyPlayingRef.current = true;
            setIsMusicPlaying(true);
            setAutoplayBlocked(false);
            startProgressMonitoring(); // התחלת המוניטורינג
            clearInterval(retryTimer);
            console.log('🎵 מוזיקה הופעלה דרך Fully Kiosk!');
            scheduleFullyNext();
            return;
          }
        } catch {}
        retries += 1;
      });
    }, 5000);

    // ביטול השתקה והפעלה בנגיעה/מקש ראשון (עוזר ב-Fully Kiosk / Android)
    const unlockOnInteract = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = false;
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
        setAutoplayBlocked(false);
        startProgressMonitoring(); // התחלת המוניטורינג
        console.log('🎵 מוזיקה הופעלה לאחר אינטראקציה!');
      }).catch(() => {
        console.log('❌ נכשל גם לאחר אינטראקציה');
      });
      window.removeEventListener('pointerdown', unlockOnInteract);
      window.removeEventListener('keydown', unlockOnInteract);
    };
    window.addEventListener('pointerdown', unlockOnInteract, { once: true });
    window.addEventListener('keydown', unlockOnInteract, { once: true });
    
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        // הסרת מאזינים מהרפרנס לפני איפוס
        if (eventHandlersRef.current.handleLoadedMeta) audio.removeEventListener('loadedmetadata', eventHandlersRef.current.handleLoadedMeta);
        if (eventHandlersRef.current.handleEnded) audio.removeEventListener('ended', eventHandlersRef.current.handleEnded);
        if (eventHandlersRef.current.handlePlaying) audio.removeEventListener('playing', eventHandlersRef.current.handlePlaying);
        if (eventHandlersRef.current.handlePause) audio.removeEventListener('pause', eventHandlersRef.current.handlePause);
        if (eventHandlersRef.current.handleStalled) audio.removeEventListener('stalled', eventHandlersRef.current.handleStalled);
        if (eventHandlersRef.current.handleError) audio.removeEventListener('error', eventHandlersRef.current.handleError);

        audioRef.current = null;
      }

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      window.removeEventListener('pointerdown', unlockOnInteract);
      window.removeEventListener('keydown', unlockOnInteract);
      clearInterval(retryTimer);
      if (fullyNextTimerRef.current) clearTimeout(fullyNextTimerRef.current);
    };
  }, []);

  // נסה לחדש ניגון כשחוזרים לפוקוס (למשל לאחר יציאה קצרה ל-Home/Screen saver)
  useEffect(() => {
    const onVisibility = () => {
      if (!audioRef.current) return;
      if (document.visibilityState === 'visible' && isMusicPlaying) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isMusicPlaying]);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await Promise.resolve(params)
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!resolvedParams) {
      console.log('⏳ ממתין ל-resolvedParams...')
      return
    }

    const fetchData = async () => {
      try {
        if (!supabase) {
          console.error('❌ Supabase client לא זמין')
          return
        }
        
        console.log('🚀 התחלת טעינת נתונים עבור ID:', resolvedParams.id)
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (userError) {
          console.error('❌ שגיאה באחזור משתמש:', userError)
          console.error('❌ פרטי השגיאה:', {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code
          })
          return
        }

        if (!userData) {
          console.error('❌ משתמש לא נמצא עבור ID:', resolvedParams.id)
          return
        }

        console.log('✅ נתוני משתמש נטענו:', userData)
        
        // בדיקת הרשאות - רק המשתמש עצמו יכול לגשת לתוכן שלו
        if (userData.id !== resolvedParams.id) {
          console.error('❌ ניסיון גישה לא מורשה:', resolvedParams.id)
          setAccessDenied(true)
          setLoading(false)
          return
        }
        
        setUser(userData)

        // Fetch active notices
        const { data: noticesData, error: noticesError } = await supabase
          .from('notices')
          .select('*')
          .eq('user_id', resolvedParams.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (noticesError) {
          console.error('Error fetching notices:', noticesError)
        }

        console.log('✅ הודעות נטענו:', noticesData)
        setNotices(noticesData || [])

        // Fetch active images
        const { data: imagesData, error: imagesError } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', resolvedParams.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (imagesError) {
          console.error('Error fetching images:', imagesError)
        }

        console.log('✅ תמונות נטענו:', imagesData)
        setImages(imagesData || [])
        
        // לוג לדיבוג הקרוסלה
        if (imagesData && imagesData.length > 0) {
          console.log('🖼️ קרוסלה מוכנה:', {
            totalImages: imagesData.length,
            activeImages: imagesData.filter(img => img.is_active).length,
            firstImage: imagesData[0]?.filename
          })
        }

        // Fetch styles
        const { data: stylesData, error: stylesError } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', resolvedParams.id)
          .order('created_at', { ascending: false });

        if (stylesError) {
          console.error('Error fetching styles:', stylesError);
        }

        if (stylesData && stylesData.length > 0) {
          setStyle(stylesData[0]);

          console.log('✅ סגנון נטען:', stylesData[0]);
        } else {
          const defaultStyle = {
            background_color: '#FFFFFF',
            text_color: '#000000',
            slide_duration: 5000,
            image_display_mode: 'contain'
          } as any;
          setStyle(defaultStyle);
          console.log('✅ סגנון ברירת מחדל נטען:', defaultStyle);
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!style || images.length === 0) return

    // תיקון currentImageIndex אם הוא גדול מדי
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0)
    }

    const slideTimer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, style.slide_duration || 5000)

    return () => clearInterval(slideTimer)
  }, [images.length, style, currentImageIndex])

  // תיקון אוטומטי של currentImageIndex כשהתמונות משתנות
  useEffect(() => {
    if (images.length === 0) {
      setCurrentImageIndex(0)
      return
    }
    
    // אם האינדקס הנוכחי גדול מדי, איפוס ל-0
    if (currentImageIndex >= images.length) {
      console.log('🔄 תיקון currentImageIndex:', currentImageIndex, '-> 0 (סה"כ תמונות:', images.length, ')')
      setCurrentImageIndex(0)
    }
  }, [images.length, currentImageIndex])


  useEffect(() => {
    const noticeTimer = setInterval(() => {
      if (notices.length > 0 && !noticePaused) {
        setNoticeFade(true)
        setTimeout(() => {
          setCurrentNoticeIndex((prev) => (prev + 1) % notices.length)
          setNoticeFade(false)
        }, 300)
      }
    }, 4000)

    return () => clearInterval(noticeTimer)
  }, [notices.length, noticePaused])

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news')
        const data = await response.json()
        setNews(data)
      } catch (error) {
        console.error('Error fetching news:', error)
      }
    }

    fetchNews()
    const newsRefreshTimer = setInterval(fetchNews, 10 * 60 * 1000)

    return () => clearInterval(newsRefreshTimer)
  }, [])

  useEffect(() => {
    localStorage.removeItem('skipAutoRedirect')
  }, [])

  const [weatherData, setWeatherData] = useState({
    current: 'שמשי 22°C',
    forecast: [
      { day: 'ה', icon: '⛅', high: '27', low: '19' },
      { day: 'ו', icon: '🌧️', high: '24', low: '20' },
      { day: 'ש', icon: '🌧️', high: '26', low: '21' },
      { day: 'א', icon: '☀️', high: '28', low: '22' },
      { day: 'ב', icon: '☀️', high: '30', low: '23' },
      { day: 'ג', icon: '⛅', high: '29', low: '22' },
      { day: 'ד', icon: '☀️', high: '31', low: '24' }
    ]
  })

  useEffect(() => {
    if (!user) return
    
    const fetchWeather = async () => {
      try {
        const location = 'תל אביב'
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`)
        const data = await response.json()
        
        const current = `${data.current_condition[0].weatherDesc[0].value} ${data.current_condition[0].temp_C}°C`
        
        const forecast = data.weather.slice(0, 7).map((day: any, index: number) => {
          const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
          const today = new Date().getDay()
          const dayIndex = (today + index) % 7
          
          let icon = '☀️'
          const code = parseInt(day.hourly[0].weatherCode)
          if (code >= 200 && code < 300) icon = '⛈️'
          else if (code >= 300 && code < 600) icon = '🌧️'
          else if (code >= 600 && code < 700) icon = '❄️'
          else if (code >= 700 && code < 800) icon = '🌫️'
          else if (code === 800) icon = '☀️'
          else if (code > 800) icon = '⛅'
          
          return {
            day: dayNames[dayIndex],
            icon,
            high: day.maxtempC,
            low: day.mintempC
          }
        })
        
        setWeatherData({ current, forecast })
      } catch (error) {
        console.error('Error fetching weather:', error)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const fetchHebrewDate = async () => {
      try {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const url = `https://www.hebcal.com/converter?gy=${yyyy}&gm=${mm}&gd=${dd}&g2h=1&cfg=json&strict=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.hebrew) {
          setHebrewDate(data.hebrew);
        }
      } catch (e) {
        setHebrewDate('');
      }
    };
    fetchHebrewDate();
  }, []);

  useEffect(() => {
    const fetchShabbatTimes = async () => {
      try {
        console.log('🕯️ Starting to fetch shabbat times...');
        
        const today = new Date();
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
        const year = nextFriday.getFullYear();
        const month = String(nextFriday.getMonth() + 1).padStart(2, '0');
        const day = String(nextFriday.getDate()).padStart(2, '0');

        const nextSaturday = new Date(nextFriday);
        nextSaturday.setDate(nextFriday.getDate() + 1);
        const saturdayYear = nextSaturday.getFullYear();
        const saturdayMonth = String(nextSaturday.getMonth() + 1).padStart(2, '0');
        const saturdayDay = String(nextSaturday.getDate()).padStart(2, '0');

        console.log(`📅 Fetching for date range: ${year}-${month}-${day} to ${saturdayYear}-${saturdayMonth}-${saturdayDay}`);
        
        const response = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&start=${year}-${month}-${day}&end=${saturdayYear}-${saturdayMonth}-${saturdayDay}&maj=on&min=off&ss=on&mod=off&mf=off&lg=h&le=y&s=on&geo=geoname&geonameid=293397&m=on&s=on&i=on&b=18&M=on&year=h`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📡 Hebcal API response:', data);
        
        const events = data.items || [];
        const candleLighting = events.find((event: any) => event.category === "candles");
        const havdalah = events.find((event: any) => event.category === "havdalah");
        const parsha = events.find((event: any) => event.category === "parashat");
        
        // בדיקת חגים - חיפוש אירועים מסוג holiday או yomtov
        const holidayEvents = events.filter((event: any) => {
          if (event.category === "holiday" || event.yomtov === true) {
            const title = event.title || '';
            // רשימת מילות מפתח לזיהוי חגים
            const holidayKeywords = [
              'ראש השנה', 'ר"ה', 'Rosh Hashana', 'Rosh Hashanah',
              'יום כיפור', 'כיפור', 'Yom Kippur',
              'סוכות', 'Sukkot',
              'שמיני עצרת', 'שמחת תורה', 'Simchat Torah',
              'חנוכה', 'Chanukah', 'Hanukkah',
              'פורים', 'Purim',
              'פסח', 'Pesach', 'Passover',
              'שבועות', 'Shavuot',
              'תשעה באב', 'ט"ב', 'Tisha B\'Av'
            ];
            return holidayKeywords.some(keyword => title.includes(keyword)) || event.yomtov === true;
          }
          return false;
        });

        console.log('🕯️ Found events:', { candleLighting, havdalah, parsha, holidays: holidayEvents.length });

        // קבע אם זה חג או שבת
        let holidayName = 'שבת'; // default לשבת
        if (holidayEvents.length > 0) {
          // יש חג - נשתמש בשם החג
          holidayName = holidayEvents[0].title || 'שבת';
        } else if (parsha) {
          // אם יש פרשה זה כנראה שבת רגילה
          holidayName = 'שבת';
        }
        
        if (candleLighting && havdalah) {
          const entryTime = candleLighting.date.split('T')[1].slice(0, 5);
          const exitTime = havdalah.date.split('T')[1].slice(0, 5);
          const entryDate = candleLighting.date; // תאריך מלא
          const exitDate = havdalah.date; // תאריך מלא
          const parshaTitle = parsha?.title || (holidayEvents.length > 0 ? holidayEvents[0].title : "לא נמצאה פרשה");
          
          console.log('✅ Setting shabbat/holiday times:', { entryTime, exitTime, entryDate, exitDate, parshaTitle, holidayName, isHoliday: holidayEvents.length > 0 });
          
          setShabbatTimes({
            entry: entryTime,
            exit: exitTime,
            entryDate: entryDate,
            exitDate: exitDate,
            parsha: parshaTitle
          });
          
          // שמירת שם החג/שבת
          setCurrentHolidayName(holidayName);
        } else if (holidayEvents.length > 0) {
          // אם יש חג אבל אין שבת, נשתמש בזמנים של החג
          const holiday = holidayEvents[0];
          const holidayDate = new Date(holiday.date);
          // נניח שחג נכנס בערב ונמשך עד הערב הבא
          const entryTime = `${String(holidayDate.getHours()).padStart(2, '0')}:${String(holidayDate.getMinutes()).padStart(2, '0')}`;
          const nextDay = new Date(holidayDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const exitTime = `${String(nextDay.getHours()).padStart(2, '0')}:${String(nextDay.getMinutes()).padStart(2, '0')}`;
          
          setShabbatTimes({
            entry: entryTime,
            exit: exitTime,
            entryDate: holiday.date,
            exitDate: nextDay.toISOString(),
            parsha: holiday.title
          });
          
          // שמירת שם החג
          setCurrentHolidayName(holiday.title || 'שבת');
        } else {
          console.log('⚠️ No candle lighting or havdalah found, using fallback');
          setShabbatTimes({ 
            entry: '19:30', 
            exit: '20:30',
            entryDate: '',
            exitDate: '',
            parsha: 'פרשת השבוע' 
          });
          
          // fallback לשבת
          setCurrentHolidayName('שבת');
        }
        
      } catch (e) {
        console.error('❌ Error fetching shabbat times:', e);
        setShabbatTimes({ 
          entry: '19:30', 
          exit: '20:30',
          entryDate: '',
          exitDate: '',
          parsha: 'פרשת השבוע' 
        });
        
        // fallback לשבת
        setCurrentHolidayName('שבת');
      }
    };
    
    fetchShabbatTimes();
    
    const dailyTimer = setInterval(fetchShabbatTimes, 86400000);
    
    return () => clearInterval(dailyTimer);
  }, []);

  // פונקציה לבדיקה אם אנחנו בזמן שבת/חג (3 שעות לפני כניסה עד 3 שעות אחרי יציאה)
  const checkShabbatMode = () => {
    if (!shabbatTimes.entry || !shabbatTimes.exit) return false;
    
    const now = new Date();
    
    let shabbatEntry: Date;
    let shabbatExit: Date;
    
    // אם יש תאריכים מלאים מה-API, נשתמש בהם
    if (shabbatTimes.entryDate && shabbatTimes.exitDate) {
      shabbatEntry = new Date(shabbatTimes.entryDate);
      shabbatExit = new Date(shabbatTimes.exitDate);
    } else {
      // fallback - חישוב ידני
      const [entryHour, entryMin] = shabbatTimes.entry.split(':').map(Number);
      const [exitHour, exitMin] = shabbatTimes.exit.split(':').map(Number);
      
      // מציאת יום שישי הקרוב (כניסת שבת)
      const today = new Date();
      const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
      const friday = new Date(today);
      friday.setDate(today.getDate() + daysUntilFriday);
      
      // זמן כניסת שבת (יום שישי בערב)
      shabbatEntry = new Date(friday);
      shabbatEntry.setHours(entryHour, entryMin, 0, 0);
      
      // יום שבת (יציאת שבת)
      const saturday = new Date(friday);
      saturday.setDate(friday.getDate() + 1);
      
      // זמן יציאת שבת (יום שבת בערב)
      shabbatExit = new Date(saturday);
      shabbatExit.setHours(exitHour, exitMin, 0, 0);
      
      // אם אנחנו אחרי יציאת השבת של השבוע הנוכחי, נבדוק את השבוע הבא
      if (now > shabbatExit) {
        shabbatEntry.setDate(shabbatEntry.getDate() + 7);
        shabbatExit.setDate(shabbatExit.getDate() + 7);
      }
    }
    
    // 3 שעות לפני כניסת שבת
    const threeHoursBeforeEntry = new Date(shabbatEntry);
    threeHoursBeforeEntry.setHours(threeHoursBeforeEntry.getHours() - 3);
    
    // 3 שעות אחרי יציאת שבת
    const threeHoursAfterExit = new Date(shabbatExit);
    threeHoursAfterExit.setHours(threeHoursAfterExit.getHours() + 3);
    
    // בדיקה אם אנחנו בטווח
    return now >= threeHoursBeforeEntry && now <= threeHoursAfterExit;
  };

  // useEffect לבדיקת מצב שבת/חג כל דקה
  useEffect(() => {
    const updateShabbatMode = () => {
      const shouldBeInShabbatMode = checkShabbatMode();
      
      if (shouldBeInShabbatMode && !isShabbatMode) {
        // כניסה למצב שבת - שמירת מצב נוכחי והחלפה לתמונת שבת
        console.log('🕯️ כניסה למצב שבת/חג');
        
        // שמירת האינדקס המקורי
        if (originalImageIndexRef.current === null) {
          originalImageIndexRef.current = currentImageIndex;
        }
        
        // שמירת מצב המוזיקה והשתקתה
        wasMusicPlayingRef.current = isMusicPlaying;
        if (isMusicPlaying && audioRef.current) {
          audioRef.current.pause();
          setIsMusicPlaying(false);
          console.log('🔇 מוזיקה הושתקה לכבוד שבת/חג');
        }
        
        setIsShabbatMode(true);
      } else if (!shouldBeInShabbatMode && isShabbatMode) {
        // יציאה ממצב שבת - החזרת מצב קודם
        console.log('✨ יציאה ממצב שבת/חג');
        
        // החזרת האינדקס המקורי
        if (originalImageIndexRef.current !== null) {
          setCurrentImageIndex(originalImageIndexRef.current);
          originalImageIndexRef.current = null;
        }
        
        // החזרת מוזיקה אם הייתה פעילה
        if (wasMusicPlayingRef.current && audioRef.current) {
          // ננסה להפעיל את המוזיקה מחדש
          audioRef.current.play()
            .then(() => {
              setIsMusicPlaying(true);
              console.log('▶️ מוזיקה הופעלה מחדש לאחר שבת');
            })
            .catch(() => {
              console.log('⚠️ לא ניתן להפעיל מוזיקה מחדש אוטומטית');
            });
        }
        wasMusicPlayingRef.current = false;
        
        setIsShabbatMode(false);
      }
    };

    // בדיקה ראשונית מיד כשהקומפוננטה נטענת או כשהזמנים משתנים
    updateShabbatMode();

    // בדיקה אוטומטית כל 30 שניות - ללא צורך ברפרש
    // זה מבטיח שהמעבר בין מצבים יתרחש בזמן המדויק
    const interval = setInterval(updateShabbatMode, 30000);

    return () => clearInterval(interval);
  }, [shabbatTimes.entry, shabbatTimes.exit, shabbatTimes.entryDate, shabbatTimes.exitDate, isShabbatMode, currentImageIndex, isMusicPlaying]);

  // רענון אוטומטי של הדף פעמיים ביום - 11:00 בבוקר ו-23:00 בלילה
  useEffect(() => {
    const scheduleNextRefresh = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      
      // שעות הרענון
      const refreshHours = [11, 23]; // 11:00 ו-23:00
      
      // מציאת השעה הבאה לרענון
      let nextRefreshHour = refreshHours.find(hour => 
        hour > currentHour || 
        (hour === currentHour && currentMinute === 0 && currentSecond < 10)
      );
      
      // אם אין שעה היום, נקח את הראשונה למחר
      if (nextRefreshHour === undefined) {
        nextRefreshHour = refreshHours[0];
      }
      
      // יצירת תאריך לרענון הבא
      const nextRefresh = new Date();
      nextRefresh.setHours(nextRefreshHour, 0, 0, 0); // 0 דקות, 0 שניות
      
      // אם השעה כבר עברה היום, נעבור למחר
      if (nextRefresh <= now) {
        nextRefresh.setDate(nextRefresh.getDate() + 1);
      }
      
      // חישוב זמן עד הרענון (במילישניות)
      const timeUntilRefresh = nextRefresh.getTime() - now.getTime();
      
      console.log(`🔄 רענון אוטומטי מתוזמן ל-${nextRefreshHour}:00 (בעוד ${Math.round(timeUntilRefresh / 1000 / 60)} דקות)`);
      
      // נקה טיימר קודם אם קיים
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // הגדרת טיימר לרענון
      refreshTimerRef.current = setTimeout(() => {
        console.log('🔄 מבצע רענון אוטומטי של הדף...');
        window.location.reload();
      }, timeUntilRefresh);
    };
    
    // תזמון ראשוני
    scheduleNextRefresh();
    
    // בדיקה כל שעה כדי לתזמן מחדש (מטפל בשינוי שעון קיץ/חורף)
    const hourlyCheck = setInterval(() => {
      scheduleNextRefresh();
    }, 3600000); // בדיקה כל שעה
    
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      clearInterval(hourlyCheck);
    };
  }, []); // רץ פעם אחת בלבד

  const handleSecretClick = () => {
    const now = Date.now()
    if (now - lastClickTime.current < 1000) {
      clickCount.current++
    } else {
      clickCount.current = 1
    }
    lastClickTime.current = now
    
    // הפעל מוזיקה אחרי אינטראקציה ראשונה
    if (clickCount.current === 1 && !isMusicPlaying) {
      setTimeout(() => {
        toggleMusic();
      }, 500);
    }
    
    if (clickCount.current >= 10) {
      localStorage.setItem('skipAutoRedirect', '1')
      setTimeout(() => {
        localStorage.removeItem('skipAutoRedirect')
      }, 10 * 60 * 1000)
      alert('מצב עקיפה הופעל ל-10 דקות!')
      clickCount.current = 0
    }
  }

  useEffect(() => {
    console.log('🎨 סגנון נוכחי:', {
      background_color: style?.background_color,
      text_color: style?.text_color,
      style: style
    })
  }, [style])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 font-hebrew">
        <div className="text-white text-5xl font-bold animate-fade-in">טוען...</div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-700 font-hebrew">
        <div className="text-white text-5xl font-bold animate-fade-in">גישה נדחתה</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 font-hebrew">
        <div className="text-white text-5xl font-bold animate-fade-in">בניין לא נמצא</div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-hebrew"
      style={{
        background: style?.background_color ? 
          `linear-gradient(135deg, ${style.background_color}10, ${style.background_color}20, ${style.background_color}10)` : 
          'linear-gradient(135deg, #f8fafc, #e2e8f0, #f8fafc)',
        color: style?.text_color || '#1f2937',
      }}
      onClick={handleSecretClick}
    >
      {/* Top Bar - Enhanced Design */}
      <div 
        className="w-full shadow-lg px-6 py-4 relative"
        style={{
          background: style?.background_color ? 
            `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
            'linear-gradient(135deg, #1d4ed8, #3730a3, #1d4ed8)',
          borderBottom: style?.background_color ? `2px solid ${style.background_color}60` : '2px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left Side - Building Info */}
          <div 
            className="text-4xl font-bold tracking-wide drop-shadow-lg flex items-center"
            style={{ color: style?.text_color || '#ffffff' }}
          >
            ברוכים הבאים {user?.street_name} {user?.building_number}
          </div>
          
          {/* Center - Time with Hebrew Date */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 text-4xl md:text-5xl font-bold flex items-center justify-center gap-8"
            style={{ color: style?.text_color || '#ffffff' }}
          >
            <span className="text-2xl font-bold" style={{ opacity: 0.9 }}>{hebrewDate}</span>
            <span className="text-5xl">{formatTime(currentTime)}</span>
            <span className="text-2xl" style={{ opacity: 0.8 }}>{currentTime.toLocaleDateString('he-IL')}</span>
          </div>
          
          {/* Right Side - System Info & Music Controls */}
          <div className="text-right flex items-center gap-4">
            {/* Music Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={playPreviousTrack}
                className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                title="שיר קודם"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={toggleMusic}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isMusicPlaying 
                    ? 'bg-green-500 bg-opacity-80 hover:bg-opacity-90' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
                title={isMusicPlaying ? "עצור מוזיקה" : "הפעל מוזיקה"}
              >
                {isMusicPlaying ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={playNextTrack}
                className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                title="שיר הבא"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={checkAudioHealth}
                className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                title="בדיקת תקינות"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <div className="text-center">
                <span className="text-sm text-white bg-black bg-opacity-30 px-2 py-1 rounded">
                  {currentTrackIndex + 1}/5
                </span>
                {!isMusicPlaying && (
                  <div className="text-xs text-yellow-300 bg-black bg-opacity-50 px-2 py-1 rounded mt-1">
                    לחץ על המסך להפעלה
                  </div>
                )}
              </div>
            </div>
            
            <div 
              className="text-2xl font-bold mb-2 animate-pulse"
              style={{
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4, #10b981, #f59e0b)',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 3s ease-in-out infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              שלג דיגיטל
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 6rem - 4rem)' }}>
        {/* Right Column - Management Info & Notices (30%) */}
        <div className="flex flex-col min-h-full" style={{ width: '30%' }}>
          {/* Management Info Card */}
          <div 
            className="px-6 py-4 w-full text-center transition-all duration-500 hover:shadow-2xl relative mb-6"
            style={{
              background: style?.background_color ? 
                `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
                'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
              color: style?.text_color || '#374151',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
              minHeight: '25vh'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <h3 className="text-5xl font-bold" style={{ color: style?.text_color || '#1f2937' }}>פרטי ניהול</h3>
            </div>
            
            {user?.management_company && (
              <div className="text-3xl mb-4 font-semibold" style={{ color: style?.text_color || '#374151' }}>
                חברת ניהול: {user.management_company}
              </div>
            )}
            {user?.management_contact && (
              <div className="text-2xl mb-4 flex items-center justify-center" style={{ color: style?.text_color || '#6b7280' }}>
                איש קשר: {user.management_contact}
                <User className="w-8 h-8 ml-2" />
              </div>
            )}
            {user?.management_phone && (
              <div className="text-2xl flex items-center justify-center" style={{ color: style?.text_color || '#6b7280' }}>
                טלפון: {user.management_phone}
                <Phone className="w-8 h-8 ml-2" />
              </div>
            )}
          </div>
          
          {/* הודעות ועד */}
          <div className="w-full flex-1 flex flex-col">
            <div 
              className="px-6 py-4 text-center font-bold tracking-wide text-5xl"
              style={{
                background: style?.background_color ? 
                  `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
                  'linear-gradient(135deg, #dc2626, #b91c1c, #dc2626)',
                color: style?.text_color || '#ffffff'
              }}
            >
              הודעות ועד
              {notices.length > 0 && noticePaused && (
                <span className="mr-2 text-2xl align-middle" style={{ color: style?.text_color || '#fbbf24' }}>⏸️</span>
              )}
            </div>
                          <div 
                className="p-4 flex flex-col justify-center transition-all duration-300 hover:shadow-2xl relative flex-1"
                style={{
                  background: style?.background_color ? 
                    `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
                  color: style?.text_color || '#374151',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
                }}
              >
              {notices.length > 0 ? (
                <div 
                  className={`text-center transition-opacity duration-300 ${noticeFade ? 'opacity-0' : 'opacity-100'} cursor-pointer`}
                  onClick={() => setNoticePaused(!noticePaused)}
                  title={noticePaused ? "לחץ להפעלת קרוסלה" : "לחץ לעצירת קרוסלה"}
                >
                  <div className="font-bold text-4xl mb-6 tracking-wide" style={{ color: style?.text_color || '#1f2937' }}>
                    {notices[currentNoticeIndex]?.title || 'אין כותרת'}
                  </div>
                  <div className="mb-8 text-3xl leading-relaxed" style={{ color: style?.text_color || '#374151' }}>
                    {notices[currentNoticeIndex]?.content || 'אין תוכן'}
                  </div>

                </div>
                              ) : (
                  <div className="text-center" style={{ color: style?.text_color || '#6b7280' }}>
                    <div className="text-2xl mb-4">אין הודעות להצגה</div>
                    <div className="text-lg">הודעות חדשות יופיעו כאן</div>
                  </div>
                )}
            </div>
          </div>
          
                      {user?.welcome_text && (
              <div 
                className="mt-4 text-2xl text-center font-bold py-4 px-6 shadow-lg"
                style={{
                  background: style?.background_color ? 
                    `linear-gradient(135deg, ${style.background_color}20, ${style.background_color}30, ${style.background_color}20)` : 
                    'linear-gradient(135deg, #dbeafe, #bfdbfe, #dbeafe)',
                  color: style?.text_color || '#1e40af'
                }}
              >
                {user.welcome_text}
              </div>
            )}
        </div>

        {/* Center Column - Image Carousel (40%) */}
             <div
       className="h-full flex items-center justify-center transition-all duration-500 relative overflow-hidden"
       style={{
         width: '40%',
         background: style?.background_color 
           ? `linear-gradient(135deg, ${style.background_color}90, ${style.background_color}95, ${style.background_color}90)`
           : 'linear-gradient(45deg, #000000, #1a1a1a)'
       }}
     >

          {isShabbatMode ? (
            // תמונת חג/שבת ייחודית
            <img
              src={getHolidayImage(currentHolidayName)}
              alt={currentHolidayName || "שבת שלום"}
              className="w-full h-full"
              style={{
                objectPosition: 'center center',
                objectFit: 'contain'
              }}
              onError={(e) => {
                console.error('❌ שגיאה בטעינת תמונת חג/שבת:', currentHolidayName);
                // fallback לתמונת שבת כללית
                const target = e.target as HTMLImageElement;
                target.src = '/images/shabbat.gif';
              }}
            />
          ) : images.length > 0 && images[currentImageIndex] ? (
                         <img
               src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${images[currentImageIndex]?.filename}`}
               alt="תמונת בניין"
               className="w-full h-full"
               style={{
                 objectPosition: 'center center',
                 objectFit: 'fill'
               }}
               onError={(e) => {
                 console.error('❌ שגיאה בטעינת תמונה:', images[currentImageIndex]?.filename)
                 // אם התמונה לא נטענת, עבור לתמונה הבאה
                 setCurrentImageIndex((prev) => (prev + 1) % images.length)
               }}
             />
          ) : (
              <div 
                className="text-center text-5xl font-bold p-12 shadow-lg"
                style={{
                  color: style?.text_color || '#374151',
                  background: style?.background_color ? `linear-gradient(135deg, ${style.background_color}90, ${style.background_color}95, ${style.background_color}90)` : 'rgba(255, 255, 255, 0.9)'
                }}
              >
                {images.length === 0 ? 'אין תמונות להצגה' : 'טוען תמונות...'}
              </div>
            )}
        </div>

        {/* Left Column - News Feed & Shabbat Times (30%) */}
        <div className="flex flex-col min-h-full" style={{ width: '30%' }}>
          <div className="flex-1 flex flex-col">
            <NewsColumn news={news} style={style} />
          </div>
          
          {/* Shabbat Times Card */}
          <div 
            className="p-4 w-full relative transition-all duration-500 hover:shadow-2xl mt-6"
            style={{
              background: style?.background_color ? 
                `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
                'linear-gradient(135deg, #60a5fa, #3b82f6, #60a5fa)',
              color: '#ffffff',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Top Bar with Clock Icon */}
            <div 
              className="flex items-center justify-between mb-3 pb-2 border-b"
              style={{ borderColor: style?.text_color ? `${style.text_color}30` : 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="flex items-center">
                <span className="text-3xl font-bold tracking-wide" style={{ color: style?.text_color || '#ffffff' }}>זמני שבת</span>
              </div>
              <Clock className="w-10 h-10" style={{ color: style?.text_color || '#ffffff' }} />
            </div>
            
            {/* Main Content */}
            <div className="flex items-center justify-between">
              {/* Left Side - Times */}
                              <div className="text-right">
                  {shabbatTimes.parsha ? (
                    <div className="font-bold text-2xl mb-4 tracking-wide" style={{ color: style?.text_color || '#ffffff' }}>{shabbatTimes.parsha}</div>
                  ) : (
                    <div className="text-xl mb-4" style={{ color: style?.text_color ? `${style.text_color}80` : 'rgba(255, 255, 255, 0.8)' }}>טוען פרשת השבוע...</div>
                  )}
                  {shabbatTimes.entry ? (
                    <div className="text-xl mb-2" style={{ color: style?.text_color ? `${style.text_color}90` : 'rgba(255, 255, 255, 0.9)' }}>כניסת שבת: <span className="font-bold">{shabbatTimes.entry}</span></div>
                  ) : (
                    <div className="text-xl mb-2" style={{ color: style?.text_color ? `${style.text_color}80` : 'rgba(255, 255, 255, 0.8)' }}>טוען זמני שבת...</div>
                  )}
                  {shabbatTimes.exit ? (
                    <div className="text-xl" style={{ color: style?.text_color ? `${style.text_color}90` : 'rgba(255, 255, 255, 0.9)' }}>צאת שבת: <span className="font-bold">{shabbatTimes.exit}</span></div>
                  ) : (
                    <div className="text-xl" style={{ color: style?.text_color ? `${style.text_color}80` : 'rgba(255, 255, 255, 0.8)' }}>טוען זמני שבת...</div>
                  )}
                </div>
              
              {/* Right Side - Animated Candles */}
              <div className="flex items-center justify-center">
                <img 
                  src="/images/shabbat-candles.gif" 
                  alt="נרות שבת מונפשים" 
                  className="w-40 h-24"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Widget - Bottom Bar */}
      <div 
        className="fixed bottom-0 left-0 w-full h-16 z-40 flex items-center justify-center text-white shadow-lg relative"
        style={{
          background: style?.background_color ? 
            `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
            'linear-gradient(135deg, #3730a3, #2563eb, #3730a3)',
          borderTop: style?.background_color ? `2px solid ${style.background_color}60` : '2px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        <WeatherWidget style={style} />
        
        {/* Hard Refresh Button */}
        <div className="absolute -top-6 left-6">
          <button
            onClick={handleHardRefresh}
            className="w-12 h-12 rounded-full shadow-lg border-2 transition-all duration-300 hover:scale-110"
            style={{
              borderColor: style?.text_color || '#ffffff',
              backgroundColor: style?.background_color || '#2563eb',
              color: style?.text_color || '#ffffff'
            }}
            title="רענון קשיח"
          >
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6" style={{ color: style?.text_color || '#ffffff' }} />
            </div>
          </button>
        </div>
        
        {/* Music Control Button */}
        <div className="absolute -top-6 right-6">
          {/* הודעת autoplay נחסם */}
          {autoplayBlocked && !isMusicPlaying && (
            <div className="absolute -top-16 right-0 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap animate-pulse">
              🎵 גע במסך להפעלת מוזיקה
            </div>
          )}
          
          <button
            onClick={toggleMusic}
            className="w-12 h-12 rounded-full shadow-lg border-2 transition-all duration-300 hover:scale-110"
            style={{
              borderColor: style?.text_color || '#ffffff',
              backgroundColor: isMusicPlaying 
                ? (style?.background_color || '#10b981') 
                : (style?.background_color ? `${style.background_color}80` : '#4b5563'),
              color: style?.text_color || '#ffffff'
            }}
            title={isMusicPlaying ? 'עצור מוזיקה' : 'הפעל מוזיקה'}
          >
            <div className="flex items-center justify-center">
              {isMusicPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: style?.text_color || '#ffffff' }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: style?.text_color || '#ffffff' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
} 

// קומפוננטת עמודת חדשות מעוצבת עם כרטיסיות נפרדות
function NewsColumn({ news, style }: { news: NewsItem[], style: Style | null }) {
  // קיבוץ לפי מקור - שימוש ב-useMemo כדי למנוע הגדרה מחדש בכל רינדור
  const grouped = useMemo(() => {
    return news.reduce((acc: Record<string, NewsItem[]>, item: NewsItem) => {
      const key = item.source || 'אחר';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [news]);

  // סדר הצגה מועדף
  const order = ['ynet', 'ONE', 'גלובס'];
  const sourceTitles: Record<string, string> = {
    ynet: 'ynet - חדשות חמות',
    ONE: 'ONE - עדכוני ספורט',
    'גלובס': 'גלובס - כלכלה ומסחר',
  };

  // אינדקס נוכחי לכל קבוצה
  const [indexes, setIndexes] = useState<Record<string, number>>({ ynet: 0, ONE: 0, 'גלובס': 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // נקה טיימר קודם אם קיים
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setIndexes(prev => {
        const next = { ...prev };
        order.forEach(src => {
          const arr = grouped[src] || [];
          if (arr.length > 0) {
            next[src] = ((prev[src] || 0) + 1) % arr.length;
          }
        });
        return next;
      });
    }, 10000); // 10 שניות

    return () => { 
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [grouped]); // תלוי רק ב-grouped שהוא עכשיו memoized

  return (
    <div className="w-full flex flex-col h-full">
      {order.map((src, index) => (
                  <div 
            key={src} 
            className={`p-4 relative transition-all duration-500 hover:shadow-2xl ${index < order.length - 1 ? 'mb-6' : ''} flex-1`}
            style={{
              background: style?.background_color ? 
                `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
                'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
              color: style?.text_color || '#374151',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
          <div 
            className="text-2xl font-bold mb-6 border-b-2 pb-4 flex items-center tracking-wide"
            style={{ 
              color: style?.text_color || '#b91c1c',
              borderColor: style?.background_color ? `${style.background_color}40` : '#fecaca'
            }}
          >
            <Newspaper className="w-10 h-10 mr-4" />
            {sourceTitles[src]}
          </div>
          <div className="min-h-[4em] flex items-start">
            {grouped[src]?.length ? (
              <>
                <span className="mt-2 mr-4 text-xl" style={{ color: style?.text_color || '#3b82f6' }}>•</span>
                <span className="text-xl font-medium leading-relaxed" style={{ color: style?.text_color || '#1f2937' }}>
                  {grouped[src]?.[indexes[src] || 0]?.title}
                </span>
              </>
            ) : (
              <span className="text-xl" style={{ color: style?.text_color || '#9ca3af' }}>אין עדכונים</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// קומפוננטת ווידג'ט מזג אוויר חיצוני
function WeatherWidget({ style }: { style: Style | null }) {
  const widgetRef = useRef<HTMLDivElement>(null);

  // פונקציה לחישוב צבע טקסט מתאים לרקע
  const getContrastingTextColor = (backgroundColor: string): string => {
    // המרה ל-RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // חישוב בהירות
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // אם רקע בהיר (מעל 128) → טקסט שחור
    // אם רקע כהה (מתחת ל-128) → טקסט לבן
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }
    
    // השתמש בצבעים מותאמים לסגנון
    let bgColor, textColor;
    
    if (style?.background_color) {
      // אם יש סגנון נבחר, השתמש ברקע של הסגנון
      bgColor = style.background_color;
      // חשב צבע טקסט מתאים לרקע
      textColor = getContrastingTextColor(style.background_color);
    } else {
      // ברירת מחדל - רקע כחול כהה וטקסט לבן
      bgColor = '#1e3a8a';
      textColor = '#FFFFFF';
    }
    
    const div = document.createElement('div');
    div.id = 'ww_4d5960b26d6ed';
    div.setAttribute('v', '1.3');
    div.setAttribute('loc', 'auto');
    div.setAttribute('a', JSON.stringify({
      t: "responsive",
      lang: "he",
      sl_lpl: 1,
      ids: [],
      font: "Arial",
      sl_ics: "one_a",
      sl_sot: "celsius",
      cl_bkg: bgColor,
      cl_font: textColor,
      cl_cloud: "#FFFFFF",      // עננים תמיד לבנים
      cl_persp: "#81D4FA",      // פרספקטיבה תמיד כחולה
      cl_sun: "#FFC107",        // שמש תמיד צהובה
      cl_moon: "#FFC107",       // ירח תמיד צהוב
      cl_thund: "#FF5722",      // ברק תמיד כתום
      cl_odd: "0000000a",
      el_nme: 3
    }));
    div.innerHTML = '<a href="https://weatherwidget.org/" id="ww_4d5960b26d6ed_u" target="_blank">Weather widget html</a>';
    widgetRef.current?.appendChild(div);

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://app3.weatherwidget.org/js/?id=ww_4d5960b26d6ed';
    widgetRef.current?.appendChild(script);

    return () => {
      if (widgetRef.current) widgetRef.current.innerHTML = '';
    };
  }, [style]);

  return (
    <div ref={widgetRef} className="w-full h-full flex items-center justify-center" />
  );
} 

// פונקציה חדשה להשגת משך השיר
const getTrackDuration = async (url: string): Promise<number> => {
  return new Promise((resolve) => {
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
      const dur = Number.isFinite(tempAudio.duration) ? tempAudio.duration : 0;
      resolve(Math.round(dur * 1000));
    }, { once: true });
    tempAudio.addEventListener('error', () => resolve(0), { once: true });
    tempAudio.load();
  });
};