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
  // FEAT-NOBODY-BMASK and FEAT-NOBODY-FULL removed:
  // Body masking with ignoreBodyHashCheck=1 doesn't make sense — when the body hash
  // check is skipped, the body is never loaded into the circuit, so there's nothing
  // to mask. In email-verifier.circom, enableBodyMasking is guarded inside the
  // ignoreBodyHashCheck!=1 block, making it a compile-time no-op.
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
];

// SHA precompute configs — reduced maxBodyLength demonstrates actual constraint savings.
// All use same 1024-byte source email (via sourceEmailBodySize) to match Noir benchmark configs.
// Circom's in_body_padded includes SHA padding, so maxBodyLength = SHA-padded remaining + 2-block margin.
// Selectors are extracted dynamically from the actual email body at the given position (0–1).
export const PRECOMPUTE_CONFIGS: CircuitConfig[] = [
  {
    id: 'PRECOMP-25',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 960,   // ~75% remaining (768) + SHA padding (64) + 2-block margin (128)
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.25,
    sourceEmailBodySize: 1024,
  },
  {
    id: 'PRECOMP-50',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 704,   // ~50% remaining (512) + SHA padding (64) + 2-block margin (128)
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.50,
    sourceEmailBodySize: 1024,
  },
  {
    id: 'PRECOMP-75',
    category: 'precompute',
    maxHeadersLength: 640,
    maxBodyLength: 448,   // ~25% remaining (256) + SHA padding (64) + 2-block margin (128)
    n: 121, k: 17,
    ignoreBodyHashCheck: 0,
    enableHeaderMasking: 0,
    enableBodyMasking: 0,
    removeSoftLineBreaks: 0,
    shaPrecomputePosition: 0.75,
    sourceEmailBodySize: 1024,
  },
];

export const ALL_CONFIGS: CircuitConfig[] = [
  ...SCALING_CONFIGS,
  ...RSA_CONFIGS,
  ...FEATURE_CONFIGS,
  ...PRECOMPUTE_CONFIGS,
];

// Get config by ID
export function getConfigById(id: string): CircuitConfig | undefined {
  return ALL_CONFIGS.find(c => c.id === id);
}

// Get configs by category
export function getConfigsByCategory(category: CircuitConfig['category']): CircuitConfig[] {
  return ALL_CONFIGS.filter(c => c.category === category);
}
