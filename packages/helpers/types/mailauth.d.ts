declare module "mailauth" {
  export interface MailAuthResult {
    dkim: Dkim;
    spf: Spf;
    dmarc: Dmarc;
    arc: Arc;
    bimi: Bimi;
    receivedChain: ReceivedChain[];
    headers: string;
  }

  export interface Dkim {
    headerFrom: string[];
    envelopeFrom: string;
    results: Result[];
  }

  export interface Result {
    signingDomain: string;
    selector: string;
    signature: string;
    algo: string;
    format: string;
    bodyHash: string;
    bodyHashExpecting: string;
    signingHeaders: SigningHeaders;
    status: Status;
    canonBodyLength: number;
    publicKey: string;
    modulusLength: number;
    rr: string;
    info: string;
  }

  export interface SigningHeaders {
    keys: string;
    headers: string[];
    canonicalizedHeader: string;
  }

  export interface Status {
    result: string;
    comment: string;
    header: Header;
    aligned: any;
  }

  export interface Header {
    i: string;
    s: string;
    a: string;
    b: string;
  }

  export interface Spf {
    domain: string;
    "envelope-from": string;
    status: Status2;
    header: string;
    info: string;
    lookups: Lookups;
  }

  export interface Status2 {
    result: string;
    comment: string;
    smtp: Smtp;
  }

  export interface Smtp {
    mailfrom: string;
  }

  export interface Lookups {
    limit: number;
    count: number;
    void: number;
    subqueries: Subqueries;
  }

  export interface Subqueries {}

  export interface Dmarc {
    status: Status3;
    domain: string;
    policy: string;
    p: string;
    sp: string;
    rr: string;
    alignment: Alignment;
    info: string;
  }

  export interface Status3 {
    result: string;
    comment: string;
    header: Header2;
  }

  export interface Header2 {
    from: string;
    d: string;
  }

  export interface Alignment {
    spf: Spf2;
    dkim: Dkim2;
  }

  export interface Spf2 {
    result: boolean;
    strict: boolean;
  }

  export interface Dkim2 {
    result: boolean;
    strict: boolean;
  }

  export interface Arc {
    status: Status4;
    i: number;
    signature: Signature;
    authenticationResults: AuthenticationResults;
    info: string;
    authResults: string;
  }

  export interface Status4 {
    result: string;
    comment: string;
  }

  export interface Signature {
    signingDomain: string;
    selector: string;
    signature: string;
    algo: string;
    format: string;
    bodyHash: string;
    bodyHashExpecting: string;
    signingHeaders: SigningHeaders2;
    status: Status5;
    canonBodyLength: number;
    publicKey: string;
    modulusLength: number;
    rr: string;
  }

  export interface SigningHeaders2 {
    keys: string;
    headers: string[];
    canonicalizedHeader: string;
  }

  export interface Status5 {
    result: string;
    header: Header3;
  }

  export interface Header3 {
    i: string;
    s: string;
    a: string;
    b: string;
  }

  export interface AuthenticationResults {
    mta: string;
    dkim: Dkim3[];
    spf: Spf3;
    dmarc: Dmarc2;
  }

  export interface Dkim3 {
    result: string;
    header: Header4;
  }

  export interface Header4 {
    i: string;
    s: string;
    b: string;
  }

  export interface Spf3 {
    result: string;
    smtp: Smtp2;
    comment: string;
  }

  export interface Smtp2 {
    mailfrom: string;
  }

  export interface Dmarc2 {
    result: string;
    header: Header5;
    comment: string;
  }

  export interface Header5 {
    from: string;
  }

  export interface Bimi {
    status: Status6;
    info: string;
  }

  export interface Status6 {
    header: Header6;
    result: string;
    comment: string;
  }

  export interface Header6 {}

  export interface ReceivedChain {
    by: By;
    with: With;
    id: Id;
    timestamp: string;
    full: string;
    from?: From;
    tls?: Tls;
    for?: For;
  }

  export interface By {
    value: string;
  }

  export interface With {
    value: string;
  }

  export interface Id {
    value: string;
  }

  export interface From {
    value: string;
    comment: string;
  }

  export interface Tls {
    value: string;
    comment: string;
  }

  export interface For {
    value: string;
  }

  export function authenticate(email: string, options: any) : Promise<MailAuthResult>;
}
