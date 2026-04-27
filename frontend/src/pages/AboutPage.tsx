import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

const BRAND_LOGO_SRC = '/images/dhanvanthiri-logo.png';

const values = [
  { label: 'Small-batch cooking', copy: 'Prepared in measured batches so flavour, texture, and freshness stay consistent.' },
  { label: 'Tamil kitchen roots', copy: 'Recipes inspired by family tables, sun-cured pickles, roasted podi, and slow thokku.' },
  { label: 'Clean ingredient choices', copy: 'Curry leaves, garlic, sesame, moringa, horse gram, and familiar pantry spices.' },
];

const process = [
  ['Select', 'Ingredients are chosen for aroma, freshness, and traditional suitability.'],
  ['Prepare', 'Spices are roasted, ground, and cooked patiently for depth.'],
  ['Pack', 'Every jar and pouch is packed carefully for everyday use.'],
];

export function AboutPage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  return (
    <>
      <Helmet>
        <title>About Us | Traditional Tamil Foods, Pickles & Podi | Dhanvanthiri Foods</title>
        <meta name="description" content="Dhanvanthiri Foods preserves the rich heritage of traditional Tamil foods. Discover our authentic homemade Tamil pickles, thokku, and podi." />
        <meta name="keywords" content="Traditional Tamil Foods, Tamil Pickles, Tamil Podi, Tamil Thokku, South Indian condiments" />
      </Helmet>

      <main className="overflow-hidden bg-[#fbf8f0] text-slate-900">
        <section className="relative min-h-[78vh] overflow-hidden bg-[#173d32] text-white">
          <img
            src="/images/about/brand-story.png"
            alt="Traditional Tamil Kitchen Background"
            className="absolute inset-0 h-full w-full object-cover opacity-38"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,47,38,0.94),rgba(15,47,38,0.72)_44%,rgba(15,47,38,0.3))]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
            <div className="flex max-w-3xl flex-col justify-center animate-on-scroll fade-up">
              <div className="mb-7 flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white/95 p-2 shadow-2xl ring-1 ring-white/30">
                  <img src={BRAND_LOGO_SRC} alt="Dhanvanthiri Logo" className="h-full w-full origin-center scale-[1.75] object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-200">Dhanvanthiri Foods</p>
                  <p className="mt-1 text-sm text-brand-50/80">Traditional Tamil foods, made with care</p>
                </div>
              </div>

              <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Preserving the Heritage of Traditional Tamil Foods
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-brand-50/90">
                {t(
                  'Homestyle pickles, thokku, and podi made with the patience of a Tamil kitchen and the care of a modern food brand.',
                  'தமிழ் சமையலறையின் பொறுமையுடனும், நவீன உணவு பிராண்டின் அக்கறையுடனும் தயாரிக்கப்படும் ஊறுகாய், தொக்கு மற்றும் பொடி.'
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#173d32] shadow-xl transition hover:-translate-y-0.5 hover:bg-amber-50">
                  Shop Products
                </Link>
                <Link to="/pages/contact" className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                  Talk to Us
                </Link>
              </div>
            </div>

            <div className="relative hidden items-end lg:flex">
              <div className="absolute -left-8 top-12 rounded-2xl bg-amber-300 px-5 py-4 text-[#173d32] shadow-2xl animate-on-scroll scale-in">
                <p className="text-3xl font-black">28+</p>
                <p className="text-xs font-bold uppercase tracking-wide">Traditional recipes</p>
              </div>
              <img
                src="/images/about/mission-vision.png"
                alt="Premium traditional ingredients"
                className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl ring-1 ring-white/20 animate-on-scroll scale-in"
              />
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#c45f35]">About Dhanvanthiri Foods</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Food that remembers where it came from.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-700">
                <strong>Dhanvanthiri Foods</strong> is dedicated to preserving and sharing the rich heritage of <strong>Traditional Tamil Foods</strong> through authentic homemade recipes.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {values.map((item, index) => (
                <article key={item.label} className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl animate-on-scroll fade-up" data-animate-delay={`${index * 90}ms`}>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">0{index + 1}</span>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{item.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-8">
            <div className="relative animate-on-scroll scale-in">
              <div className="absolute -inset-5 rounded-[2rem] bg-[#f2e3c4]" />
              <img
                src="/images/about/brand-story.png"
                alt="Traditional South Indian Kitchen"
                className="relative aspect-[4/5] w-full rounded-[1.6rem] object-cover shadow-2xl"
              />
            </div>
            <div className="animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Our Story</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                In many Tamil homes, the kitchen is where memories are created.
              </h2>
              <div className="mt-7 space-y-5 text-lg leading-8 text-slate-700">
                <p>
                  The aroma of roasted spices, mustard seeds in hot oil, and jars resting under warm sunlight are part of a tradition passed down for generations.
                </p>
                <p>
                  We wanted to preserve the recipes that mothers and grandmothers prepared with simple ingredients, time-tested techniques, and great care.
                </p>
                <p className="rounded-2xl border-l-4 border-[#c45f35] bg-[#fff7e7] p-5 font-semibold text-[#66351f]">
                  Our goal is not just to create food, but to preserve a heritage.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#c45f35]">How We Make It</p>
              <h2 className="mt-4 text-3xl font-bold sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Slow, careful, familiar.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {process.map(([label, copy], index) => (
                <div key={label} className="relative rounded-2xl bg-[#173d32] p-7 text-white shadow-xl animate-on-scroll fade-up" data-animate-delay={`${index * 100}ms`}>
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-amber-300 text-lg font-black text-[#173d32]">{index + 1}</div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{label}</h3>
                  <p className="mt-3 leading-7 text-brand-50/85">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#122f27] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
            <div className="animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-200">Mission & Vision</p>
              <h2 className="mt-4 text-3xl font-bold sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Built for homes that want real Tamil flavour without shortcuts.
              </h2>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/7 p-6 backdrop-blur animate-on-scroll fade-up">
                <h3 className="text-xl font-bold">Our Mission</h3>
                <p className="mt-3 leading-7 text-brand-50/85">
                  To prepare authentic pickles, thokku, and podi with natural ingredients and traditional recipes while keeping quality, taste, and hygiene at the centre.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/7 p-6 backdrop-blur animate-on-scroll fade-up" data-animate-delay="100ms">
                <h3 className="text-xl font-bold">Our Vision</h3>
                <p className="mt-3 leading-7 text-brand-50/85">
                  To become a trusted brand known for celebrating Tamil culinary heritage across India and beyond.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
