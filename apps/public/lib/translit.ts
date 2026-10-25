// apps/public/lib/translit.ts
//
// تحويل أسماء الأشخاص من العربية إلى الإنجليزية (يُستخدم عند اختيار English).
//
// الطريقة: قاموس بإملاء مضبوط لكل كلمة موجودة حالياً في الشجرة (بحوالي 314 كلمة)،
// وإذا أضفت لاحقاً اسماً غير موجود في القاموس يُحوَّل حرفياً بشكل تقريبي.
// لتصحيح أي إملاء: عدّل القيمة في WORDS أدناه (المفتاح بالعربي والقيمة بالإنجليزي).

const WORDS: Record<string, string> = {
  آدم: "Adam", أسيد: "Usaid", أنس: "Anas", إلياس: "Elias", ابراهيم: "Ibrahim", ابو: "Abu", احمد: "Ahmad",
  ادم: "Adam", ادهم: "Adham", اديب: "Adeeb", اسامه: "Osama", اسحق: "Ishaq", اسعد: "Asaad", اسلام: "Islam",
  اسماعيل: "Ismail", اشرف: "Ashraf", اكرم: "Akram", الجدع: "Al-Jadaa", الجليل: "Al-Jalil", الحسن: "Al-Hasan",
  الخضير: "Al-Khudair", الدين: "al-Din", الصوص: "Al-Sous", الله: "Allah", المنتصر: "Al-Muntasir",
  القواسمي: "Al-Qawasmi", امجد: "Amjad", امير: "Amir", امين: "Amin", انس: "Anas", انور: "Anwar",
  اياد: "Iyad", ايمن: "Ayman", ايهاب: "Ihab", ايهم: "Ayham", ايوب: "Ayyoub",
  باسل: "Basel", باسم: "Basem", بالله: "Billah", بحر: "Bahr", بدر: "Badr", بدوي: "Badawi", براء: "Baraa",
  بسام: "Bassam", بسيم: "Baseem", بشار: "Bashar", بكر: "Bakr", بلال: "Bilal", بنان: "Banan", بهاء: "Bahaa",
  بيض: "Baid",
  تامر: "Tamer", تقي: "Taqi", تيسير: "Tayseer", تيم: "Taim",
  ثائر: "Thaer",
  جابر: "Jaber", جاد: "Jad", جبريل: "Jibreel", جعفر: "Jaafar", جمال: "Jamal", جميل: "Jameel", جهاد: "Jihad",
  جواد: "Jawad", جود: "Jood", جودت: "Jawdat",
  حاتم: "Hatem", حازم: "Hazem", حافظ: "Hafez", حامد: "Hamed", حبيب: "Habib", حجازي: "Hijazi", حربي: "Harbi",
  حسام: "Hussam", حسان: "Hassan", حسن: "Hasan", حسني: "Husni", حسيب: "Haseeb", حسين: "Hussein", حكم: "Hakam",
  حلمي: "Helmi", حمدي: "Hamdi", حمره: "Hamra", حمزة: "Hamza", حمزه: "Hamza", حيان: "Hayyan",
  خالد: "Khaled", خالص: "Khalis", خضر: "Khader", خليل: "Khalil",
  دانيال: "Daniel", داوود: "Dawoud", ذياب: "Dhiab",
  رائد: "Raed", راتب: "Rateb", راشد: "Rashed", راضي: "Radi", رافت: "Raafat", راكان: "Rakan", رامي: "Rami",
  رباح: "Rabah", ربحي: "Ribhi", ربيع: "Rabee", رشاد: "Rashad", رشدي: "Rushdi", رشيد: "Rasheed",
  رضوان: "Radwan", رعد: "Raad", رفعت: "Refaat", رفيق: "Rafiq", ركان: "Rakan", رمضان: "Ramadan", ريان: "Rayyan",
  زكريا: "Zakaria", زهير: "Zuhair", زياد: "Ziad", زيد: "Zaid", زين: "Zain",
  سائد: "Saed", ساجد: "Sajed", ساري: "Sari", سام: "Sam", سامح: "Sameh", سامر: "Samer", سامي: "Sami",
  سعد: "Saad", سعدي: "Saadi", سعيد: "Saeed", سفيان: "Sufian", سلمان: "Salman", سليم: "Saleem",
  سليمان: "Sulaiman", سميح: "Sameeh", سمير: "Samir", سند: "Sanad", سيف: "Saif",
  شادي: "Shadi", شاكر: "Shaker", شريف: "Sharif", شعيب: "Shuaib", شفيق: "Shafiq", شكري: "Shukri",
  شهاب: "Shihab", شوقي: "Shawqi",
  صادق: "Sadiq", صالح: "Saleh", صبحي: "Subhi", صفوان: "Safwan", صفوت: "Safwat", صلاح: "Salah",
  صهيب: "Suhaib", ضرار: "Dirar", ضياء: "Diaa",
  طارق: "Tariq", طاهر: "Taher",
  عادل: "Adel", عاصم: "Asem", عاطف: "Atef", عامر: "Amer", عبادة: "Obada", عباده: "Obada", عباس: "Abbas",
  عبالحميد: "Abdulhamid", عبد: "Abd", عبدالحافظ: "Abdulhafez", عبدالحق: "Abdulhaq", عبدالحكيم: "Abdulhakim",
  عبدالحليم: "Abdulhalim", عبدالحميد: "Abdulhamid", عبدالحي: "Abdulhai", عبدالرؤوف: "Abdulraouf",
  عبدالرحمن: "Abdulrahman", عبدالرحيم: "Abdulrahim", عبدالرزاق: "Abdulrazzaq", عبدالسلام: "Abdulsalam",
  عبدالسميع: "Abdulsamee", عبدالعزيز: "Abdulaziz", عبدالعفو: "Abdulafou", عبدالغني: "Abdulghani",
  عبدالفتاح: "Abdulfattah", عبدالقادر: "Abdulqader", عبدالكريم: "Abdulkareem", عبدالله: "Abdullah",
  عبدالمعز: "Abdulmoez", عبدالملك: "Abdulmalik", عبدالهادي: "Abdulhadi", عبيدة: "Obaida", عبيده: "Obaida",
  عثمان: "Othman", عدنان: "Adnan", عدي: "Adi", عرفات: "Arafat", عروة: "Orwa", عز: "Izz", عصام: "Issam",
  عفيف: "Afif", علاء: "Alaa", علي: "Ali", عماد: "Imad", عمار: "Ammar", عمر: "Omar", عمرو: "Amr",
  عمير: "Umair", عنان: "Anan", عوني: "Awni", عيد: "Eid", عيسى: "Issa",
  غالب: "Ghaleb", غسان: "Ghassan",
  فؤاد: "Fuad", فادي: "Fadi", فارس: "Fares", فايز: "Faez", فتحي: "Fathi", فخذ: "Branch", فخري: "Fakhri",
  فراس: "Firas", فريد: "Fareed", فضل: "Fadl", فلاح: "Falah", فهد: "Fahad", فهمي: "Fahmi", فواز: "Fawwaz",
  فوزي: "Fawzi",
  قاسم: "Qasem", قتيبة: "Qutaiba", قصي: "Qusai", قلب: "Qalb", قيس: "Qais",
  كامل: "Kamel", كرم: "Karam", كريم: "Kareem", كمال: "Kamal", كنان: "Kinan",
  لؤي: "Luay", لطفي: "Lutfi", ليث: "Laith",
  مأمون: "Mamoun", مؤمن: "Moamen", مؤيد: "Muayyad", ماجد: "Majed", مازن: "Mazen", مالك: "Malek",
  ماهر: "Maher", مثنى: "Muthanna", مجاهد: "Mujahed", مجد: "Majd", مجدي: "Majdi", محمد: "Mohammed",
  محمود: "Mahmoud", محي: "Muhyi", مراد: "Murad", مروان: "Marwan", مسلم: "Muslim", مصطفى: "Mustafa",
  مصعب: "Musab", مضر: "Mudar", مظهر: "Mazhar", معاذ: "Muath", معاويه: "Muawiya", معتز: "Moataz",
  معتصم: "Moatasem", معن: "Maan", مفيد: "Mufid", مقداد: "Miqdad", مكرم: "Mukarram", مكي: "Makki",
  منتصر: "Muntasir", منجد: "Munjid", منذر: "Munther", منير: "Munir", مهدي: "Mahdi", مهند: "Muhannad",
  موسى: "Musa", موفق: "Muwaffaq",
  نادر: "Nader", نارد: "Nard", ناصر: "Nasser", نبيل: "Nabil", نزار: "Nizar", نسيم: "Naseem", نضال: "Nidal",
  نظام: "Nizam", نظمي: "Nazmi", نعمان: "Numan", نعيم: "Naim", نمر: "Nimr", نواره: "Nawara", نوح: "Nuh",
  نور: "Nour", نورالدين: "Nuruddin", نورسان: "Noursan",
  هاشم: "Hashem", هاني: "Hani", هشام: "Hisham", همام: "Hammam", هيثم: "Haitham",
  وئام: "Wiam", وائل: "Wael", وجد: "Wajd", وديع: "Wadee", وسام: "Wisam", وسيم: "Wasim", وليد: "Waleed",
  ياسر: "Yasser", ياسين: "Yasin", يامن: "Yamen", يحيى: "Yahya", يزن: "Yazan", يعقوب: "Yaqoub",
  يمان: "Yaman", ينال: "Yanal", يوسف: "Yousef", يونس: "Younes",
  خضير: "Khudair",
  // أسماء المشرفين
  توفيق: "Tawfiq", عبدالمنعم: "Abdulmunim", الني: "Al-Nini", د: "Dr",
};

// توحيد الإملاء قبل البحث في القاموس (همزات، ة/ه، ى/ي، تشكيل) حتى تُحتسب الصيغ المختلفة لنفس الاسم
const norm = (w: string) =>
  w
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و");

const NORMALIZED: Record<string, string> = {};
for (const [ar, en] of Object.entries(WORDS)) NORMALIZED[norm(ar)] = en;

// ───── تحويل تقريبي للأسماء غير الموجودة في القاموس ─────
const LETTERS: Record<string, string> = {
  ا: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z", س: "s",
  ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m",
  ن: "n", ه: "h", و: "w", ي: "y", ى: "a", ء: "", ئ: "e", ؤ: "o",
};
const NON_CONSONANT = new Set(["ا", "و", "ي", "ى", "ء"]);

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function fallbackWord(word: string): string {
  let w = norm(word);
  let prefix = "";
  if (w.startsWith("ال") && w.length > 3) {
    prefix = "Al-";
    w = w.slice(2);
  }
  let out = "";
  const chars = [...w];
  chars.forEach((ch, i) => {
    out += LETTERS[ch] ?? ch;
    const next = chars[i + 1];
    // نضيف حرف علة بسيط بين حرفين ساكنين متتاليين ليسهل النطق
    if (next && !NON_CONSONANT.has(ch) && !NON_CONSONANT.has(next) && LETTERS[next] !== undefined && i > 0) {
      out += "a";
    }
  });
  return prefix + capitalize(out);
}

function translateWord(word: string): string {
  return NORMALIZED[norm(word)] ?? fallbackWord(word);
}

const cache = new Map<string, string>();

/** يحوّل اسماً كاملاً (قد يحوي عدة كلمات وأقواساً) إلى الإنجليزية. */
export function transliterateName(name: string): string {
  if (!name) return name;
  const hit = cache.get(name);
  if (hit !== undefined) return hit;

  // نفصل الكلمات العربية عن الفواصل والأقواس حتى نحافظ عليها كما هي
  const parts = name.split(/([؀-ۿ]+)/);
  const words = parts.filter((p) => /[؀-ۿ]/.test(p));
  let wi = 0;
  const out: string[] = [];
  let skipWord = false; // الكلمة التالية اندمجت مع "عبد" فلا نكتبها مرة ثانية
  let dropSeparator = false;
  for (const part of parts) {
    if (!/[\u0600-\u06FF]/.test(part)) {
      if (dropSeparator && /^\s+$/.test(part)) {
        dropSeparator = false;
        continue;
      }
      out.push(part);
      continue;
    }
    if (skipWord) {
      skipWord = false;
      continue;
    }
    const cur = words[wi++];
    const nxt = words[wi]; // الكلمة التالية
    // "عبد الجليل" / "عبد الله"  →  Abduljalil / Abdullah (تُدمج مع "ال" التعريف)
    if (norm(cur) === "عبد" && nxt && norm(nxt).startsWith("ال")) {
      const rest = norm(nxt) === "الله" ? "lah" : translateWord(nxt).replace(/^Al-/, "").toLowerCase();
      out.push("Abdul" + rest);
      wi++;
      skipWord = true;
      dropSeparator = true;
      continue;
    }
    out.push(translateWord(cur));
  }
  // تنظيف المسافات المزدوجة
  const result = out.join("").replace(/\s{2,}/g, " ").trim().replace(/^Branch (.+)$/, "$1 Branch");
  cache.set(name, result);
  return result;
}
