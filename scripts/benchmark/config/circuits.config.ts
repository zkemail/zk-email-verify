/**
 * Circuit configuration definitions for benchmarking
 */

export interface CircuitConfig {
  id: string;
  category: 'scaling' | 'rsa' | 'precompute' | 'features';
  maxHeadersLength: number;
  maxBodyLength: number;
  n: number;  // RSA chunk bits
  k: number;  // RSA chunk count
  ignoreBodyHashCheck: 0 | 1;
  enableHeaderMasking: 0 | 1;
  enableBodyMasking: 0 | 1;
  removeSoftLineBreaks: 0 | 1;
  shaPrecomputeSelector?: string;
  /** Position (0–1) in body to auto-extract a selector. Overrides shaPrecomputeSelector. */
  shaPrecomputePosition?: number;
  /** When set, findEmailFile matches emails against this body size instead of maxBodyLength.
   *  Use for SHA-precompute configs where maxBodyLength is smaller than the full email body. */
  sourceEmailBodySize?: number;
}

// Scaling configs - measure how constraints scale with header/body size
// NOTE: DKIM signed headers SHA-pad to ~384 bytes, so maxHeadersLength must be >= 384.
// Body must satisfy: ceil((bodyBytes + 9) / 64) * 64 <= maxBodyLength (SHA-256 padding).
export const SCALING_CONFIGS: CircuitConfig[] = [
  {
    // Minimum viable DKIM circuit: 384 = smallest multiple of 64 that fits ~359-byte signed headers
    id: 'SCALE-MIN',
    category: 'scaling',
    maxHeadersLength: 384,
    maxBodyLength: 256,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'SCALE-1',
    category: 'scaling',
    maxHeadersLength: 448,
    maxBodyLength: 384,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'SCALE-2',
    category: 'scaling',
    maxHeadersLength: 512,
    maxBodyLength: 512,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'SCALE-3',
    category: 'scaling',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'SCALE-4',
    category: 'scaling',
    maxHeadersLength: 1024,
    maxBodyLength: 1024,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'SCALE-5',
    category: 'scaling',
    maxHeadersLength: 1024,
    maxBodyLength: 2048,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'SCALE-6',
    category: 'scaling',
    maxHeadersLength: 2048,
    maxBodyLength: 2048,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'SCALE-7',
    category: 'scaling',
    maxHeadersLength: 2048,
    maxBodyLength: 4096,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    // Large header, tiny body — tests header-dominated constraint scaling
    id: 'SCALE-HEADER-HEAVY',
    category: 'scaling',
    maxHeadersLength: 4096,
    maxBodyLength: 320,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  // SCALE-BODY-HEAVY (maxBody=8192) removed — 4.9M constraints exceeds ptau-22 limit (4.19M).
  // Extrapolate from SCALE-MIN through SCALE-7 instead.
];

// RSA key size comparison configs
// Note: email-verifier requires n*k > 2048, so RSA-1024 is not supported
export const RSA_CONFIGS: CircuitConfig[] = [
  {
    id: 'RSA-2048',
    category: 'rsa',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121,
    k: 17, // 2048-bit: 121 * 17 = 2057 bits
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
];

// Feature flag impact configs
export const FEATURE_CONFIGS: CircuitConfig[] = [
  {
    id: 'FEAT-BASE',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'FEAT-NOBODY',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 1,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'FEAT-HMASK',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 1,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'FEAT-BMASK',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 1,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'FEAT-SOFT',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 1408,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 1,
  },
  {
    id: 'FEAT-FULL',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 1,
    enableBodyMasking: 1,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'FEAT-NOBODY-BMASK',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 1,
    enableHeaderMasking: 0,
    enableBodyMasking: 1,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'FEAT-NOBODY-HMASK',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 1,
    enableHeaderMasking: 1,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
  },
  {
    id: 'FEAT-NOBODY-FULL',
    category: 'features',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 1,
    enableHeaderMasking: 1,
    enableBodyMasking: 1,
    removeSoftLineBreaks: 0,
  },
];

// SHA precompute configs — same circuit as FEAT-BASE, only inputs differ.
// Selectors are extracted dynamically from the actual email body at the given position (0–1).
// This avoids hardcoding strings that may not exist in the email selected by findEmailFile.
export const PRECOMPUTE_CONFIGS: CircuitConfig[] = [
  {
    id: 'PRECOMP-NONE',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    // No selector — baseline, full SHA from start
  },
  {
    id: 'PRECOMP-EARLY',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.1,  // ~10% into body
  },
  {
    id: 'PRECOMP-MID',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.5,  // ~50% into body
  },
  {
    id: 'PRECOMP-LATE',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 768,
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.8,  // ~80% into body
  },
];

// SHA precompute with REDUCED maxBodyLength — demonstrates actual constraint savings.
// Same email as PRECOMP-NONE (b512, SHA-padded to 640 bytes), but maxBodyLength shrunk
// to fit only the remaining body after precompute.
export const PRECOMPUTE_REDUCED_CONFIGS: CircuitConfig[] = [
  {
    id: 'PRECOMP-MID-SMALL',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 448,   // remaining after 50% precompute + 1 block margin for alignment
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.5,
    sourceEmailBodySize: 512,  // force same email as PRECOMP-NONE
  },
  {
    id: 'PRECOMP-LATE-SMALL',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 320,   // remaining after 80% precompute + 1 block margin for alignment
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.8,
    sourceEmailBodySize: 512,  // force same email as PRECOMP-NONE
  },
];

export const ALL_CONFIGS: CircuitConfig[] = [
  ...SCALING_CONFIGS,
  ...RSA_CONFIGS,
  ...FEATURE_CONFIGS,
  ...PRECOMPUTE_CONFIGS,
  ...PRECOMPUTE_REDUCED_CONFIGS,
];

// Get config by ID
export function getConfigById(id: string): CircuitConfig | undefined {
  return ALL_CONFIGS.find(c => c.id === id);
}

// Get configs by category
export function getConfigsByCategory(category: CircuitConfig['category']): CircuitConfig[] {
  return ALL_CONFIGS.filter(c => c.category === category);
}
