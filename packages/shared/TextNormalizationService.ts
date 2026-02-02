/**
 * Text Normalization Service - Chuẩn hóa văn bản tiếng Việt
 * 
 * Mục đích: Chuyển đổi teencode, slang, viết tắt sang văn bản chuẩn trước khi TTS
 * 
 * Input: Raw text từ Telegram message (có thể chứa teencode/slang)
 * Output: Normalized text phù hợp cho TTS
 * 
 * Sử dụng khi: Trước khi gọi TTS API để tạo audio
 */

// Dictionary inline để tránh CommonJS/ESM import issues
const TEENCODE_DICTIONARY: Record<string, string> = {
  // Basic teencode (đã có)
  "ko": "không", "k": "không", "khum": "không", "hông": "không", "hok": "không",
  "đc": "được", "dc": "được", "ok": "được", "okela": "được", "okie": "được",
  "cm": "chúng mày", "vs": "với", "m": "mày", "t": "tao", "j": "gì",
  "ntn": "như thế nào", "ls": "là sao", "kb": "không biết", "bt": "biết", "bik": "biết", "bjk": "biết",
  "cx": "cũng", "cg": "cũng", "mk": "mình", "mik": "mình", "ng": "người", "ngta": "người ta",
  "tui": "tôi", "iu": "yêu", "ik": "đi", "di": "đi", "lm": "làm", "lam": "làm",
  "vk": "vợ", "ck": "chồng", "ox": "ông xã", "bx": "bà xã", "vc": "vợ chồng",
  "bme": "bố mẹ", "ctrai": "con trai", "cgai": "con gái", "qhe": "quan hệ",
  "bthường": "bình thường", "uhm": "ừ", "uh": "ừ", "u": "ừ", "hừm": "ừ",
  "vz": "vậy", "z": "vậy", "zậy": "vậy", "zay": "vậy", "thoy": "thôi",
  "ny": "người yêu", "nyc": "người yêu cũ", "nycm": "người yêu của mình",
  "ty": "tỷ", "anh": "anh", "a": "anh", "e": "em", "c": "chị",
  "v": "vì", "nv": "nhưng vì", "nh": "như", "tl": "trả lời", "rep": "trả lời",
  "ib": "nhắn tin riêng", "pm": "nhắn tin riêng", "r": "rồi", "ròi": "rồi",
  "đ": "đã", "đang": "đang", "đag": "đang", "dg": "đang",
  "trc": "trước", "sau": "sau", "khi": "khi", "luc": "lúc", "tg": "thời gian",
  "h": "giờ", "p": "phút", "s": "giây", "thnao": "thế nào",
  "sn": "sinh nhật", "snvv": "sinh nhật vui vẻ", "hpbd": "chúc mừng sinh nhật",
  "g9": "chúc ngủ ngon", "gn": "chúc ngủ ngon", "bb": "tạm biệt", "bye": "tạm biệt", "bai": "tạm biệt",
  "klq": "không liên quan", "đlgt": "đang làm gì thế",
  "hk": "học", "hn": "Hà Nội", "hcm": "Hồ Chí Minh", "sg": "Sài Gòn",
  "qt": "quá trời", "qá": "quá", "wa": "quá", "wá": "quá",
  "zui": "vui", "dzo": "vào", "dzô": "vào", "ra": "ra", "o": "ở", "ơ": "ở",
  "thik": "thích", "ghét": "ghét", "ks": "không sao",
  "chx": "chưa", "chưa": "chưa",
  "zoom": "zùm", "ak": "à", "ạ": "ạ", "hả": "hả", "hử": "hử",
  "nha": "nhé", "nhó": "nhé", "nko": "nhé không",
  "hen": "hẹn", "mai": "mai", "tối": "tối", "lun": "luôn", "luon": "luôn",
  "nữa": "nữa", "nx": "nữa", "mà": "mà", "mak": "mà",
  "nhg": "nhưng", "nhưg": "nhưng", "trog": "trong",
  "ngoai": "ngoài", "trên": "trên", "dưới": "dưới", "giữa": "giữa",
  "xung": "xung quanh", "chung": "chung quanh", "khoảng": "khoảng", "tầm": "tầm",
  "kêu": "kêu", "bảo": "bảo", "nói": "nói", "noi": "nói", "ns": "nói",
  "nch": "nói chuyện", "nc": "nói chuyện",
  "đồ": "đồ", "món": "món", "cái": "cái", "con": "con", "thằng": "thằng", "đứa": "đứa",
  "má": "mẹ", "ba": "ba", "bố": "bố", "bo": "bố", "me": "mẹ",
  
  // Gen Z Slang 2025/2026 (mới thêm)
  "đỉnh": "tuyệt vời", "đỉnh cao": "xuất sắc", "peak": "đỉnh",
  "tẻn tẻn": "vui vẻ", "tẻn": "vui",
  "8386": "chúc mừng", "tám ba tám sáu": "chúc mừng",
  "6677": "xấu", "sáu sáu bảy bảy": "xấu",
  "bảnh": "tôi", "gato": "ghen tị",
  "xịn sò": "sang trọng", "xịn": "đẹp", "sò": "đẹp",
  "bựa": "hài hước", "dỗi": "giận", "trẻ trâu": "non nớt",
  "sml": "thất bại", "cày": "chăm chỉ", "bóc phốt": "vạch trần",
  "căng": "căng thẳng", "toang": "hỏng", "sống ảo": "giả tạo",
  "lầy": "ngớ ngẩn", "vãi": "quá", "thả thính": "tán tỉnh",
  "cơm chó": "hạnh phúc của người khác", "cẩu lương": "hạnh phúc của người khác",
  "trà xanh": "kẻ thứ ba", "tuesday": "kẻ thứ ba",
  "u là tr": "ối trời ơi", "j dz tr": "gì vậy trời",
  "vcl": "quá", "nt": "nhắn tin", "4u": "cho bạn",
  "stt": "trạng thái", "avt": "ảnh đại diện", "tt": "tương tác",
  
  // Abbreviations bổ sung
  "tks": "cảm ơn", "tk": "cảm ơn", "thanks": "cảm ơn",
  "sry": "xin lỗi", "sr": "xin lỗi", "sorry": "xin lỗi",
  "plz": "làm ơn", "pls": "làm ơn", "please": "làm ơn",
  "bc": "bởi vì", "bv": "bởi vì",
  "đúng ko": "đúng không", "có phải ko": "có phải không",
  "làm j": "làm gì", "ăn j": "ăn gì", "nghĩ j": "nghĩ gì",
  "ở đâu": "ở đâu", "đi đâu": "đi đâu", "ra sao": "ra sao",
  "trog khi": "trong khi", "lúc nào": "lúc nào", "bao h": "bao giờ",
  "h nào": "giờ nào", "ngày nào": "ngày nào",
  "ngoài ra": "ngoài ra",
  "hơn nữa": "hơn nữa", "thêm nữa": "thêm nữa",
  "tuy nhiên": "tuy nhiên", "tuy vậy": "tuy vậy",
  "vì thế": "vì thế", "vì vậy": "vì vậy", "do đó": "do đó",
  "nhưng mà": "nhưng mà", "song le": "song le",
  "chẳng hạn": "chẳng hạn", "ví dụ": "ví dụ", "vd": "ví dụ"
};

const PROFANITY_DICTIONARY: Record<string, string> = {
  "dm": "[beep]",
  "dcm": "[beep]",
  "đcm": "[beep]",
  "vl": "[beep]",
  "cl": "[beep]",
  "cc": "[beep]"
};

export interface NormalizationOptions {
  /**
   * Có thay thế profanity words không
   * @default true
   */
  filterProfanity?: boolean;
  
  /**
   * Có normalize teencode không
   * @default true
   */
  normalizeTeencode?: boolean;

  /**
   * Có normalize numbers và units không
   * @default true
   */
  normalizeNumbers?: boolean;

  /**
   * Case sensitive khi replace
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Custom replacements bổ sung
   */
  customReplacements?: Record<string, string>;
}

export class TextNormalizationService {
  private dictionary: Record<string, string>;
  private profanityDict: Record<string, string>;

  constructor() {
    // Load dictionaries from constants
    this.dictionary = { ...TEENCODE_DICTIONARY };
    this.profanityDict = { ...PROFANITY_DICTIONARY };
  }

  /**
   * Normalize text với các options
   * 
   * @param text - Text cần normalize
   * @param options - Tùy chọn normalization
   * @returns Normalized text
   * 
   * @example
   * ```ts
   * const service = new TextNormalizationService();
   * const normalized = service.normalize("ko đc cm"); 
   * // Output: "không được chúng mày"
   * 
   * const withNumbers = service.normalize("3cm, 5kg, 1.000.000đ");
   * // Output: "ba xen ti mét, năm ki lô gam, một triệu đồng"
   * ```
   */
  normalize(text: string, options: NormalizationOptions = {}): string {
    const {
      filterProfanity = true,
      normalizeTeencode = true,
      normalizeNumbers = true,
      caseSensitive = false,
      customReplacements = {},
    } = options;

    let result = text;

    // Step 1: Apply custom replacements trước
    result = this.applyReplacements(result, customReplacements, caseSensitive);

    // Step 2: Normalize teencode
    if (normalizeTeencode) {
      result = this.applyReplacements(result, this.dictionary, caseSensitive);
    }

    // Step 3: Filter profanity (sau cùng để catch cả teencode profanity)
    if (filterProfanity) {
      result = this.applyReplacements(result, this.profanityDict, caseSensitive);
    }

    // Step 4: Normalize numbers and units
    if (normalizeNumbers) {
      result = this.normalizeNumbersAndUnits(result);
    }

    // Step 5: Clean up multiple spaces
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  /**
   * Apply một dictionary of replacements lên text
   * 
   * @param text - Text cần replace
   * @param replacements - Dictionary mapping từ source -> target
   * @param caseSensitive - Case sensitive hay không
   * @returns Text sau khi replace
   */
  private applyReplacements(
    text: string,
    replacements: Record<string, string>,
    caseSensitive: boolean
  ): string {
    let result = text;

    // Sắp xếp keys theo độ dài giảm dần để tránh replace substring trước
    // Ví dụ: "không" trước "ko" để tránh "không" -> "khônghông"
    const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const value = replacements[key];
      
      // Tạo regex với word boundaries để tránh false positive
      // Ví dụ: "ko" chỉ match "ko" chứ không match "kỹ"
      const flags = caseSensitive ? 'g' : 'gi';
      
      // Escape special regex characters trong key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Word boundary (\b) cho Latin characters, custom boundary cho Vietnamese
      // Vietnamese word boundary: whitespace, punctuation, start/end of string
      const regex = new RegExp(
        `(?<=^|\\s|[.,!?;:])${escapedKey}(?=\\s|[.,!?;:]|$)`,
        flags
      );

      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Thêm custom replacements vào runtime
   * 
   * @param customDict - Dictionary bổ sung
   * 
   * @example
   * ```ts
   * service.addCustomDictionary({ "bruh": "anh em" });
   * ```
   */
  addCustomDictionary(customDict: Record<string, string>): void {
    Object.assign(this.dictionary, customDict);
  }

  /**
   * Check xem text có chứa teencode không
   * 
   * @param text - Text cần check
   * @returns true nếu có teencode
   */
  containsTeencode(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    const teencodeWords = Object.keys(this.dictionary).map(k => k.toLowerCase());
    
    return words.some(word => teencodeWords.includes(word));
  }

  /**
   * Get danh sách các teencode words được tìm thấy trong text
   * 
   * @param text - Text cần analyze
   * @returns Array of found teencode words
   */
  findTeencodeWords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const teencodeWords = Object.keys(this.dictionary).map(k => k.toLowerCase());
    
    return words.filter(word => teencodeWords.includes(word));
  }

  /**
   * Convert số thành chữ tiếng Việt
   * 
   * @param num - Số cần convert (0-999,999,999,999)
   * @returns Chữ số tiếng Việt
   * 
   * @example
   * ```ts
   * numberToWords(123) // "một trăm hai mươi ba"
   * numberToWords(1000000) // "một triệu"
   * ```
   */
  private numberToWords(num: number): string {
    if (num === 0) return "không";
    
    const ones = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
    
    // Hàm phụ cho số < 1000
    const convertHundreds = (n: number): string => {
      if (n === 0) return "";
      
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      
      let result = "";
      
      if (hundred > 0) {
        result += ones[hundred] + " trăm";
        if (remainder > 0) result += " ";
      }
      
      if (ten > 1) {
        result += tens[ten];
        if (one > 0) {
          result += " " + (one === 1 ? "mốt" : ones[one]);
        }
      } else if (ten === 1) {
        result += "mười";
        if (one > 0) {
          result += " " + (one === 5 ? "lăm" : ones[one]);
        }
      } else if (one > 0) {
        if (hundred > 0) result += "linh ";
        result += ones[one];
      }
      
      return result.trim();
    };
    
    // Xử lý số lớn
    if (num >= 1000000000) {
      const billions = Math.floor(num / 1000000000);
      const remainder = num % 1000000000;
      let result = convertHundreds(billions) + " tỷ";
      if (remainder > 0) {
        result += " " + this.numberToWords(remainder);
      }
      return result.trim();
    }
    
    if (num >= 1000000) {
      const millions = Math.floor(num / 1000000);
      const remainder = num % 1000000;
      let result = convertHundreds(millions) + " triệu";
      if (remainder > 0) {
        result += " " + this.numberToWords(remainder);
      }
      return result.trim();
    }
    
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      let result = convertHundreds(thousands) + " nghìn";
      if (remainder > 0) {
        result += " " + convertHundreds(remainder);
      }
      return result.trim();
    }
    
    return convertHundreds(num);
  }

  /**
   * Normalize numbers với units thành Vietnamese words
   * 
   * @param text - Text chứa số và đơn vị
   * @returns Text với số đơn vị đã normalize
   * 
   * @example
   * ```ts
   * normalizeNumbersAndUnits("3cm") // "ba xen ti mét"
   * normalizeNumbersAndUnits("5kg") // "năm ki lô gam"
   * normalizeNumbersAndUnits("1.000.000đ") // "một triệu đồng"
   * ```
   */
  normalizeNumbersAndUnits(text: string): string {
    let result = text;
    
    // Currency: 1.000.000đ, 1.000.000₫, 1.000.000 VND
    result = result.replace(/(\d{1,3}(?:\.\d{3})*)\s*(đ|₫|vnd|vnđ|dong)/gi, (match, num, unit) => {
      const number = parseInt(num.replace(/\./g, ''));
      return this.numberToWords(number) + " đồng";
    });
    
    // Dates: 01/02, 12/05  
    result = result.replace(/(\d{1,2})\/(\d{1,2})/g, (match, day, month) => {
      const d = parseInt(day);
      const m = parseInt(month);
      return `${d === 1 ? "mùng " : ""}${this.numberToWords(d)} tháng ${this.numberToWords(m)}`;
    });
    
    // Units - Distance
    result = result.replace(/(\d+(?:\.\d+)?)\s*(km|m|cm|mm)/gi, (match, num, unit) => {
      const number = parseFloat(num);
      const unitWords: Record<string, string> = {
        'km': 'ki lô mét',
        'm': 'mét',
        'cm': 'xen ti mét',
        'mm': 'mi li mét'
      };
      return this.numberToWords(Math.floor(number)) + " " + unitWords[unit.toLowerCase()];
    });
    
    // Units - Weight
    result = result.replace(/(\d+(?:\.\d+)?)\s*(kg|g|mg|tấn)/gi, (match, num, unit) => {
      const number = parseFloat(num);
      const unitWords: Record<string, string> = {
        'tấn': 'tấn',
        'kg': 'ki lô gam',
        'g': 'gam',
        'mg': 'mi li gam'
      };
      return this.numberToWords(Math.floor(number)) + " " + unitWords[unit.toLowerCase()];
    });
    
    // Time units
    result = result.replace(/(\d+)\s*(giây|phút|giờ|ngày|tuần|tháng|năm)/gi, (match, num, unit) => {
      const number = parseInt(num);
      return this.numberToWords(number) + " " + unit.toLowerCase();
    });
    
    // Standalone numbers (cuối cùng để không conflict với patterns trên)
    result = result.replace(/\b(\d{1,3}(?:\.\d{3})*|\d+)\b/g, (match) => {
      const cleanNum = match.replace(/\./g, '');
      const number = parseInt(cleanNum);
      if (!isNaN(number) && number >= 0) {
        return this.numberToWords(number);
      }
      return match;
    });
    
    return result;
  }
}

/**
 * Singleton instance để reuse
 */
export const textNormalizationService = new TextNormalizationService();

/**
 * Helper function để normalize nhanh
 * 
 * @param text - Text cần normalize
 * @param options - Options
 * @returns Normalized text
 * 
 * @example
 * ```ts
 * import { normalizeText } from '@tts-telegram/shared';
 * const clean = normalizeText("ko đc cm vs m");
 * // Output: "không được chúng mày với mày"
 * ```
 */
export function normalizeText(text: string, options?: NormalizationOptions): string {
  return textNormalizationService.normalize(text, options);
}
