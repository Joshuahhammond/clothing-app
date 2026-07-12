// Stores with publicly readable Shopify catalogs (verified via /products.json).
// Each one is effectively a free product API: title, price, images, tags, URL.

export type Source = {
  id: string;
  name: string;
  domain: string;
  vibe: string;
};

export const SOURCES: Source[] = [
  { id: "everlane", name: "Everlane", domain: "everlane.com", vibe: "modern minimalist basics, denim, workwear staples; men + women; mid-range" },
  { id: "jennikayne", name: "Jenni Kayne", domain: "jennikayne.com", vibe: "quiet luxury, coastal California, cashmere and neutrals; premium" },
  { id: "doen", name: "DÔEN", domain: "shopdoen.com", vibe: "romantic vintage-inspired California dresses and blouses; premium" },
  { id: "rails", name: "Rails", domain: "railsclothing.com", vibe: "elevated casual, silky shirting, effortless LA style; contemporary" },
  { id: "staud", name: "STAUD", domain: "staud.clothing", vibe: "modern feminine, sculptural silhouettes, statement pieces; contemporary" },
  { id: "frankandeileen", name: "Frank & Eileen", domain: "frankandeileen.com", vibe: "heritage Irish shirting, oversized button-downs; premium" },
  { id: "nakedcashmere", name: "NAKED Cashmere", domain: "nakedcashmere.com", vibe: "pure cashmere knits and loungewear; premium" },
  { id: "agolde", name: "AGOLDE", domain: "agolde.com", vibe: "premium LA denim, vintage-inspired fits" },
  { id: "goodamerican", name: "Good American", domain: "goodamerican.com", vibe: "size-inclusive denim and bodycon basics; mid-range" },
  { id: "aloyoga", name: "Alo Yoga", domain: "aloyoga.com", vibe: "athleisure, studio-to-street activewear; mid-range" },
  { id: "marinelayer", name: "Marine Layer", domain: "marinelayer.com", vibe: "soft casual basics, coastal weekend wear; men + women; mid-range" },
  { id: "faherty", name: "Faherty", domain: "fahertybrand.com", vibe: "coastal casual, sweaters and linen; men + women; mid-premium" },
  { id: "oakandfort", name: "Oak + Fort", domain: "oakandfort.com", vibe: "clean minimalist essentials, muted palette; men + women; mid-range" },
  { id: "colorfulstandard", name: "Colorful Standard", domain: "colorfulstandard.com", vibe: "organic cotton basics in every color; men + women; affordable" },
  { id: "christydawn", name: "Christy Dawn", domain: "christydawn.com", vibe: "romantic sustainable prairie dresses; premium" },
  { id: "withjean", name: "With Jéan", domain: "withjean.com", vibe: "feminine going-out pieces, mini dresses; contemporary" },
  { id: "meshki", name: "MESHKI", domain: "meshki.us", vibe: "sleek minimal going-out, satin and knits; mid-range" },
  { id: "ohpolly", name: "Oh Polly", domain: "ohpolly.com", vibe: "bodycon occasion and event dresses; mid-range" },
  { id: "showmeyourmumu", name: "Show Me Your Mumu", domain: "showmeyourmumu.com", vibe: "boho party and bridesmaid, playful prints; mid-range" },
  { id: "petalandpup", name: "Petal & Pup", domain: "petalandpup.com", vibe: "feminine dresses and workwear; affordable-mid" },
  { id: "princesspolly", name: "Princess Polly", domain: "us.princesspolly.com", vibe: "trendy Gen-Z going-out and casual; affordable" },
  { id: "vici", name: "VICI", domain: "vicicollection.com", vibe: "trendy boutique, layered looks; affordable-mid" },
  { id: "pinklily", name: "Pink Lily", domain: "pinklily.com", vibe: "sweet Southern boutique style; affordable" },
  { id: "fashionnova", name: "Fashion Nova", domain: "fashionnova.com", vibe: "fast-fashion trendy, curve-friendly; budget" },
  { id: "cupshe", name: "Cupshe", domain: "cupshe.com", vibe: "swim and resort wear; budget" },
];

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
