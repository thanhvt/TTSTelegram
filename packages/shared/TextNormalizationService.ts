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

import teencodeDict from '../teencode-dictionary.json';

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
    // Load dictionaries từ JSON
    this.dictionary = teencodeDict.dictionary as Record<string, string>;
    this.profanityDict = teencodeDict.profanity as Record<string, string>;
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
   * ```
   */
  normalize(text: string, options: NormalizationOptions = {}): string {
    const {
      filterProfanity = true,
      normalizeTeencode = true,
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

    // Step 4: Clean up multiple spaces
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
