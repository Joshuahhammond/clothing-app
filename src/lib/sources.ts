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
  // ——— activewear / gym ———
  { id: "gymshark", name: "Gymshark", domain: "gymshark.com", vibe: "performance gym wear, seamless leggings and lifting sets; men + women; mid-range" },
  { id: "aybl", name: "AYBL", domain: "www.aybl.com", vibe: "sculpting seamless gym sets, squat-proof leggings; women; affordable-mid" },
  { id: "nvgtn", name: "NVGTN", domain: "nvgtn.com", vibe: "contour seamless leggings and scrunch shorts, gym-influencer staple; women" },
  { id: "setactive", name: "Set Active", domain: "setactive.co", vibe: "matching athleisure sets in muted earth tones, LA studio-to-street; women" },
  { id: "dfyne", name: "DFYNE", domain: "dfyne.com", vibe: "high-impact sculpting activewear, bold and refined; women; mid-range" },
  { id: "buffbunny", name: "Buffbunny", domain: "buffbunny.com", vibe: "feminine lifting wear, supportive and curve-focused; women" },
  { id: "vitality", name: "Vitality", domain: "vitalityathletic.com", vibe: "buttery cloud-soft leggings and flares, wellness aesthetic; women" },
  { id: "bornprimitive", name: "Born Primitive", domain: "bornprimitive.com", vibe: "training and crossfit wear, durable and patriotic-lean; men + women" },
  { id: "boandtee", name: "Bo+Tee", domain: "boandtee.com", vibe: "trendy gym-to-brunch sets and one-shoulder tops; women; affordable" },
  { id: "youngla", name: "YoungLA", domain: "youngla.com", vibe: "bodybuilding and streetwear-lean gym fits, pump covers; mostly men" },
  { id: "tenthousand", name: "Ten Thousand", domain: "tenthousand.cc", vibe: "minimal high-performance men's training gear; men; mid-premium" },
  { id: "outdoorvoices", name: "Outdoor Voices", domain: "outdoorvoices.com", vibe: "recreational athleisure, playful color-block, doing-things energy; men + women" },
  { id: "girlfriend", name: "Girlfriend Collective", domain: "girlfriend.com", vibe: "sustainable compressive activewear in rich muted colors, size-inclusive; women" },
  { id: "beyondyoga", name: "Beyond Yoga", domain: "beyondyoga.com", vibe: "buttery spacedye yoga and lounge wear; women; mid-premium" },
];

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
