import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Leaf, FlaskConical, ChefHat, Award, ArrowRight, Star, ShieldCheck } from 'lucide-react';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

const BRAND_LOGO_SRC = '/images/dhanvanthiri-logo.png';

const STATS = [
  { value: '27+', label: 'Traditional Recipes' },
  { value: '3', label: 'Product Categories' },
  { value: '100%', label: 'Natural Ingredients' },
  { value: '0', label: 'Preservatives Added' },
];

const PROMISES = [
  { icon: Leaf, title: 'No Preservatives', desc: 'Crafted using only natural ingredients — zero artificial additives, colors, or preservatives.', color: 'bg-emerald-50 text-emerald-700' },
  { icon: FlaskConical, title: 'Small-Batch Made', desc: 'Prepared in measured batches so every jar delivers consistent flavour and texture.', color: 'bg-amber-50 text-amber-700' },
  { icon: ChefHat, title: 'Traditional Recipes', desc: 'Slow-cooked, sun-cured, and roasted using methods inherited from Tamil kitchens.', color: 'bg-orange-50 text-orange-700' },
  { icon: Award, title: 'Premium Quality', desc: 'Every ingredient is selected for aroma, freshness, and traditional suitability.', color: 'bg-brand-50 text-brand-700' },
];

const PRODUCTS = [
  { src: '/images/products/Thakkali Thokku (Tomato Mashed Pickle).jpg', name: 'Thakkali Thokku', category: 'Thokku' },
  { src: '/images/products/Poondu Thokku (Garlic Mashed Pickle).jpg', name: 'Poondu Thokku', category: 'Thokku' },
  { src: '/images/products/Murungai Keerai Podi (Moringa Spice Mix or (Moringa Powder).jpg', name: 'Murungai Keerai Podi', category: 'Podi' },
  { src: '/images/products/Karuveppilai Podi (Curry Leaves Spice Mix or Curry Leaves Powder).jpg', name: 'Karuveppilai Podi', category: 'Podi' },
  { src: "/images/products/Maanga Oorugai(Mango Pickle).jpg", name: 'Maanga Oorugai', category: 'Urukai' },
  { src: '/images/products/Citron Pickle (Narthangai Oorugai).jpg', name: 'Narthangai Oorugai', category: 'Urukai' },
];

const INGREDIENTS = [
  'Curry Leaves', 'Moringa', 'Garlic', 'Black Sesame', 'Horse Gram', 'Centella',
  'Shallots', 'Ivy Gourd', 'Bitter Gourd', 'Tomato', 'Coriander', 'Banana Flower',
  'Citron', 'Mango', 'Lime', 'Groundnut', 'Adamant Creeper', 'Dal',
];

const processSteps = [
  { step: '01', label: 'Select', copy: 'Ingredients are chosen for aroma, freshness, and traditional suitability.', accent: 'from-amber-400 to-amber-300' },
  { step: '02', label: 'Prepare', copy: 'Spices are roasted, ground, and cooked patiently over gentle heat for depth.', accent: 'from-emerald-400 to-emerald-300' },
  { step: '03', label: 'Pack', copy: 'Every jar and pouch is sealed carefully, ready for everyday kitchen use.', accent: 'from-orange-400 to-orange-300' },
];

const REVIEWS = [
  { name: 'Meena R.', location: 'Chennai', rating: 5, text: 'The Thakkali Thokku tastes exactly like my grandmother used to make. Pure nostalgia in every spoonful.' },
  { name: 'Arun K.', location: 'Bangalore', rating: 5, text: 'Murungai Keerai Podi is a staple in our home now. Incredibly authentic flavour — no compromises.' },
  { name: 'Priya S.', location: 'Coimbatore', rating: 5, text: 'Tried the Narthangai Oorugai and was blown away. Finally found a brand that doesn\'t cut corners.' },
];

export function AboutPage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });
  const tickerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Helmet>
        <title>About Us | Traditional Tamil Foods, Pickles & Podi | Dhanvanthiri Foods</title>
        <meta name="description" content="Dhanvanthiri Foods preserves the rich heritage of traditional Tamil foods. Discover our authentic homemade Tamil pickles, thokku, and podi." />
        <meta name="keywords" content="Traditional Tamil Foods, Tamil Pickles, Tamil Podi, Tamil Thokku, South Indian condiments" />
      </Helmet>

      <main className="overflow-hidden bg-[#fbf8f0] text-slate-900">

        {/* ── HERO ── */}
        <section className="relative min-h-[90vh] overflow-hidden bg-[#0f2b22]">
          {/* Dot-grid decorative overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          {/* Radial glow */}
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-emerald-700/30 blur-[120px]" />
          <div className="absolute -right-20 bottom-0 h-[400px] w-[500px] rounded-full bg-amber-500/20 blur-[100px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-32">
            <div className="flex max-w-3xl flex-col animate-on-scroll fade-up">
              {/* Badge */}
              <div className="mb-8 inline-flex w-fit items-center gap-2.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Traditional Tamil Foods
              </div>

              <h1
                className="text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-7xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Preserving the{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-amber-300">Heritage</span>
                  <span
                    className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded-sm opacity-30"
                    style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }}
                  />
                </span>{' '}
                of Tamil Kitchen.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-white/75">
                {t(
                  'Homestyle pickles, thokku, and podi made with the patience of a Tamil kitchen and the care of a modern food brand.',
                  'தமிழ் சமையலறையின் பொறுமையுடனும், நவீன உணவு பிராண்டின் அக்கறையுடனும் தயாரிக்கப்படும் ஊறுகாய், தொக்கு மற்றும் பொடி.'
                )}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 text-sm font-bold text-[#0f2b22] shadow-[0_8px_30px_rgba(251,191,36,0.4)] transition hover:-translate-y-0.5 hover:bg-amber-300"
                >
                  Explore Products <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/pages/contact"
                  className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Talk to Us
                </Link>
              </div>

              {/* Trust row */}
              <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-white/10 pt-8">
                {[
                  { icon: ShieldCheck, label: 'No Preservatives' },
                  { icon: Leaf, label: '100% Natural' },
                  { icon: ChefHat, label: 'Traditional Recipes' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-white/60">
                    <Icon className="h-4 w-4 text-emerald-400" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side — product mosaic */}
            <div className="relative hidden lg:block animate-on-scroll scale-in" data-animate-delay="150ms">
              <div className="grid grid-cols-2 gap-3">
                {PRODUCTS.slice(0, 4).map((p, i) => (
                  <div
                    key={p.name}
                    className={`overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10 ${i === 0 ? 'col-span-2 h-52' : 'h-40'}`}
                  >
                    <img
                      src={p.src}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-6 rounded-2xl bg-amber-400 px-5 py-4 text-[#0f2b22] shadow-2xl">
                <p className="text-3xl font-black leading-none">27+</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide">Traditional recipes</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── INGREDIENT TICKER ── */}
        <div className="overflow-hidden bg-[#173d32] py-4">
          <div
            ref={tickerRef}
            className="flex w-max gap-8"
            style={{ animation: 'ticker 35s linear infinite' }}
          >
            {[...INGREDIENTS, ...INGREDIENTS].map((ing, i) => (
              <span key={`${ing}-${i}`} className="flex shrink-0 items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                <span className="h-1 w-1 rounded-full bg-amber-400/60" />
                {ing}
              </span>
            ))}
          </div>
          <style>{`
            @keyframes ticker {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
          `}</style>
        </div>

        {/* ── STATS BAR ── */}
        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px bg-slate-100 overflow-hidden rounded-3xl shadow-soft md:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center bg-white px-8 py-10 text-center animate-on-scroll fade-up"
              >
                <span
                  className="text-5xl font-black leading-none text-[#173d32]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {value}
                </span>
                <span className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── OUR STORY ── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
            {/* Image mosaic */}
            <div className="relative animate-on-scroll scale-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 overflow-hidden rounded-[1.6rem] bg-slate-100 shadow-elevated">
                  <img
                    src="/images/products/Poondu Thokku (Garlic Mashed Pickle).jpg"
                    alt="Garlic Thokku"
                    className="aspect-[16/9] w-full object-cover transition duration-500 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.background = '#f2e3c4'; }}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-soft">
                  <img
                    src="/images/products/Ellu Podi (Black Sesame Spice Mix or Black Sesame Powder).jpg"
                    alt="Ellu Podi"
                    className="aspect-square w-full object-cover transition duration-500 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.background = '#f2e3c4'; }}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl bg-[#f2e3c4] shadow-soft">
                  <img
                    src="/images/products/Chinnavengayam Thokku (Shallot Mashed Pickle).jpg"
                    alt="Shallot Thokku"
                    className="aspect-square w-full object-cover transition duration-500 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.background = '#f2e3c4'; }}
                  />
                </div>
              </div>
              {/* Decorative ring */}
              <div className="pointer-events-none absolute -bottom-6 -right-6 h-36 w-36 rounded-full border-[14px] border-amber-200/50" />
            </div>

            <div className="animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Our Story</p>
              <h2
                className="mt-4 text-4xl font-bold leading-tight sm:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                In many Tamil homes, the kitchen is where memories are created.
              </h2>
              <div className="mt-7 space-y-5 text-lg leading-8 text-slate-600">
                <p>
                  The aroma of roasted spices, mustard seeds crackling in hot oil, and jars resting under warm sunlight — these are traditions passed down for generations.
                </p>
                <p>
                  We wanted to preserve the recipes that mothers and grandmothers prepared with simple ingredients, time-tested techniques, and great patience.
                </p>
              </div>
              {/* Pull quote */}
              <blockquote className="mt-8 rounded-2xl border-l-4 border-[#c45f35] bg-[#fff7e7] px-6 py-5">
                <p className="text-lg font-semibold italic leading-8 text-[#66351f]">
                  "Our goal is not just to create food, but to preserve a heritage."
                </p>
              </blockquote>
              <Link
                to="/products"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#173d32] underline underline-offset-4 decoration-2 decoration-amber-400 hover:text-[#c45f35]"
              >
                Explore our full range <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── OUR PROMISE ── */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#c45f35]">Our Promise</p>
              <h2
                className="mt-4 text-3xl font-bold sm:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                What sets Dhanvanthiri apart.
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Every decision we make starts with one question: would it belong in a traditional Tamil kitchen?
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PROMISES.map((p, i) => (
                <div
                  key={p.title}
                  className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-elevated animate-on-scroll fade-up"
                  data-animate-delay={`${i * 80}ms`}
                >
                  <div className={`mb-5 inline-flex rounded-2xl p-3 ${p.color}`}>
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{p.desc}</p>
                  {/* Decorative corner dot */}
                  <div className="absolute right-5 top-5 h-2 w-2 rounded-full bg-slate-200 group-hover:bg-amber-300 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCT SHOWCASE ── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6 animate-on-scroll fade-up">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#c45f35]">What We Make</p>
                <h2
                  className="mt-3 text-3xl font-bold sm:text-5xl"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  From the jar to your plate.
                </h2>
              </div>
              <Link
                to="/products"
                className="hidden shrink-0 items-center gap-2 rounded-full border border-[#173d32] px-5 py-2.5 text-sm font-bold text-[#173d32] transition hover:bg-[#173d32] hover:text-white sm:inline-flex"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {PRODUCTS.map((p, i) => (
                <Link
                  key={p.name}
                  to="/products"
                  className="group relative overflow-hidden rounded-2xl bg-slate-100 animate-on-scroll scale-in"
                  data-animate-delay={`${i * 60}ms`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={p.src}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).style.background = '#e8d8b8'; }}
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-1 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-300">{p.category}</p>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden animate-on-scroll fade-up">
              <Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[#173d32] underline underline-offset-4">
                View all products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── HOW WE MAKE IT ── */}
        <section className="bg-[#0f2b22] py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-300">How We Make It</p>
              <h2
                className="mt-4 text-3xl font-bold sm:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Slow, careful, familiar.
              </h2>
              <p className="mt-4 text-white/60">
                No shortcuts. No automation lines. Just the way it's always been done.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {processSteps.map((s, i) => (
                <div
                  key={s.label}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm animate-on-scroll fade-up"
                  data-animate-delay={`${i * 100}ms`}
                >
                  {/* Step number pill */}
                  <div className={`mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${s.accent} text-[#0f2b22] text-lg font-black`}>
                    {i + 1}
                  </div>
                  <h3
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.label}
                  </h3>
                  <p className="mt-3 leading-7 text-white/65">{s.copy}</p>
                  {/* Bottom step indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${i === 0 ? '#fbbf24' : i === 1 ? '#34d399' : '#fb923c'}, transparent)` }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CUSTOMER REVIEWS ── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#c45f35]">Customer Love</p>
              <h2
                className="mt-4 text-3xl font-bold sm:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                What our customers say.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {REVIEWS.map((r, i) => (
                <div
                  key={r.name}
                  className="rounded-3xl border border-amber-100 bg-white p-8 shadow-soft animate-on-scroll fade-up"
                  data-animate-delay={`${i * 80}ms`}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-5 text-[1.05rem] leading-8 text-slate-700 italic">"{r.text}"</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173d32] text-xs font-bold text-white">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section className="bg-[#0c2218] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-300">Mission & Vision</p>
              <h2
                className="mt-4 text-4xl font-bold leading-tight sm:text-6xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Built for homes that want real Tamil flavour{' '}
                <span className="text-amber-300">without shortcuts.</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/60">
                Every jar is a commitment — to the recipe, to the ingredients, and to you.
              </p>
            </div>

            <div className="grid gap-4 animate-on-scroll fade-up" data-animate-delay="100ms">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/20 p-2.5">
                  <ChefHat className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold">Our Mission</h3>
                <p className="mt-3 leading-7 text-white/65">
                  To prepare authentic pickles, thokku, and podi with natural ingredients and traditional recipes while keeping quality, taste, and hygiene at the centre.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <div className="mb-4 inline-flex rounded-xl bg-amber-500/20 p-2.5">
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold">Our Vision</h3>
                <p className="mt-3 leading-7 text-white/65">
                  To become a trusted brand known for celebrating Tamil culinary heritage across India and beyond.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative overflow-hidden bg-[#fbf8f0] py-24 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.10),transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="animate-on-scroll fade-up">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#c45f35]">Ready to taste tradition?</p>
              <h2
                className="mt-4 text-4xl font-bold leading-tight sm:text-6xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Order freshly made Tamil foods, shipped pan-India.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Every jar packed with flavour, every recipe rooted in tradition. Free shipping above ₹499.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-[#173d32] px-8 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(23,61,50,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0f2b22]"
                >
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/pages/contact"
                  className="rounded-full border border-slate-300 px-8 py-4 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
