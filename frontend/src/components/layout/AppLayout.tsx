import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GlobalAlerts } from '@/components/layout/GlobalAlerts';
import { NewsletterSignup } from '@/components/layout/NewsletterSignup';
import { PromotionalPopups } from '@/components/layout/PromotionalPopups';
import { useLogoutMutation, useMeQuery } from '@/features/auth/api';
import { isItUserRole } from '@/features/auth/roleDisplay';
import { clearCredentials, setCredentials } from '@/features/auth/store/authSlice';
import { syncCartStateFromResponse, useCartQuery } from '@/features/cart/api';
import { useWebsiteSettingsQuery } from '@/features/cms/api';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';
import { useAppDispatch, useAppSelector } from '@/lib/utils/hooks';
import { usePageScrollReveal } from '@/lib/utils/usePageScrollReveal';

const BRAND_LOGO_SRC = '/images/dhanvanthiri-logo.png';
const BRAND_NAME = 'Dhanvanthiri Foods';

type NavItem = {
  label: string;
  href: string;
};

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, accessToken } = useAppSelector((s) => s.auth);
  const cart = useAppSelector((s) => s.cart);

  const logoutMut = useLogoutMutation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pageContentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const currentLocale = getStorefrontLocale();
  const handleLocaleChange = (newLocale: string) => {
    localStorage.setItem('dhanvanthiri_locale', newLocale);
    window.location.reload();
  };

  const copy = {
    announcement: getLocalizedText(currentLocale, {
      en: 'Free shipping on orders above Rs.499 | Freshly handmade with love',
      ta: 'ரூ.499க்கு மேற்பட்ட ஆர்டர்களுக்கு இலவச டெலிவரி | அன்புடன் கைமுறையில் தயாரிப்பு',
    }),
    navProducts: getLocalizedText(currentLocale, { en: 'Products', ta: 'தயாரிப்புகள்' }),
    navBlog: getLocalizedText(currentLocale, { en: 'Blog', ta: 'வலைப்பதிவு' }),
    navFaq: getLocalizedText(currentLocale, { en: 'FAQ', ta: 'கேள்விகள்' }),
    navAbout: getLocalizedText(currentLocale, { en: 'About', ta: 'எங்களை பற்றி' }),
    orders: getLocalizedText(currentLocale, { en: 'Orders', ta: 'ஆர்டர்கள்' }),
    profile: getLocalizedText(currentLocale, { en: 'Profile', ta: 'சுயவிவரம்' }),
    signIn: getLocalizedText(currentLocale, { en: 'Sign In', ta: 'உள்நுழைய' }),
    logout: getLocalizedText(currentLocale, { en: 'Logout', ta: 'வெளியேறு' }),
    wishlist: getLocalizedText(currentLocale, { en: 'Wishlist', ta: 'விருப்பப்பட்டியல்' }),
    shop: getLocalizedText(currentLocale, { en: 'Shop', ta: 'கடை' }),
    allProducts: getLocalizedText(currentLocale, { en: 'All Products', ta: 'அனைத்து தயாரிப்புகள்' }),
    cart: getLocalizedText(currentLocale, { en: 'Cart', ta: 'கார்ட்' }),
    company: getLocalizedText(currentLocale, { en: 'Company', ta: 'நிறுவனம்' }),
    aboutUs: getLocalizedText(currentLocale, { en: 'About Us', ta: 'எங்களை பற்றி' }),
    contact: getLocalizedText(currentLocale, { en: 'Contact', ta: 'தொடர்பு' }),
    legal: getLocalizedText(currentLocale, { en: 'Legal', ta: 'சட்ட தகவல்' }),
    shippingPolicy: getLocalizedText(currentLocale, { en: 'Shipping Policy', ta: 'அனுப்பும் கொள்கை' }),
    refundPolicy: getLocalizedText(currentLocale, { en: 'Refund Policy', ta: 'பணம் திருப்பும் கொள்கை' }),
    privacyPolicy: getLocalizedText(currentLocale, { en: 'Privacy Policy', ta: 'தனியுரிமை கொள்கை' }),
    terms: getLocalizedText(currentLocale, { en: 'Terms & Conditions', ta: 'விதிமுறைகள்' }),
    footerDescription: getLocalizedText(currentLocale, {
      en: 'Traditional South Indian pickles and thokku, handcrafted with authentic family recipes passed down through generations.',
      ta: 'பாரம்பரிய தென்னிந்திய ஊறுகாய் மற்றும் தொக்கு, தலைமுறைகள் கடந்த குடும்ப சமையல் முறையில் கைமுறையில் தயாரிக்கப்படுகிறது.',
    }),
    footerCopyright: getLocalizedText(currentLocale, {
      en: 'Dhanvanthiri Foods. All rights reserved. Made with love in India.',
      ta: 'Dhanvanthiri Foods. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. இந்தியாவில் அன்புடன் தயாரிக்கப்பட்டது.',
    }),
  };

  const { data: meData } = useMeQuery(isAuthenticated);
  useEffect(() => {
    if (meData?.data?.user && accessToken) {
      dispatch(setCredentials({ user: meData.data.user, accessToken }));
    }
  }, [accessToken, dispatch, meData]);

  const { data: settingsData } = useWebsiteSettingsQuery();
  const websiteSettings = settingsData?.website && typeof settingsData.website === 'object' && !Array.isArray(settingsData.website)
    ? settingsData.website
    : {};
  const navigationSettings = settingsData?.navigation && typeof settingsData.navigation === 'object' && !Array.isArray(settingsData.navigation)
    ? settingsData.navigation
    : {};
  const socialSettings = settingsData?.social && typeof settingsData.social === 'object' && !Array.isArray(settingsData.social)
    ? settingsData.social
    : {};

  const getLocalizedSetting = (value: unknown, fallback: string) => {
    if (!value) return fallback;

    if (typeof value === 'object' && value !== null) {
      const localizedValue = (value as Record<string, string>)[currentLocale] || (value as Record<string, string>).en;
      return localizedValue || fallback;
    }

    return String(value);
  };

  const primaryNav = (() => {
    const configuredNav = Array.isArray(navigationSettings.primary) ? navigationSettings.primary : [];

    if (configuredNav.length > 0) {
      return configuredNav
        .map((item: any) => ({
          label: String(item?.label ?? '').trim(),
          href: normalizeNavHref(String(item?.href ?? '').trim()),
        }))
        .filter((item: NavItem) => item.label && item.href);
    }

    return [
      { label: copy.navProducts, href: '/products' },
      { label: copy.navBlog, href: '/blog' },
      { label: copy.navFaq, href: '/faq' },
      { label: copy.navAbout, href: '/pages/about' },
    ];
  })();

  const socialLinks = (() => {
    const raw = socialSettings.links;
    if (!raw) return [];
    return Array.isArray(raw) ? raw.filter((link: any) => link?.is_active) : [];
  })();

  const storeName = getLocalizedSetting(websiteSettings.name, BRAND_NAME);
  const storeLogo = getLocalizedSetting(websiteSettings.logo, BRAND_LOGO_SRC);
  const footerLogo = getLocalizedSetting(websiteSettings.footerLogo, storeLogo);
  const footerDescription = getLocalizedSetting(websiteSettings.footerDescription, copy.footerDescription);
  const footerCopyright = getLocalizedSetting(websiteSettings.footerCopyright, copy.footerCopyright);
  const announcementText = getLocalizedSetting(websiteSettings.announcement, copy.announcement);

  const { data: cartData } = useCartQuery();
  useEffect(() => {
    syncCartStateFromResponse(cartData);
  }, [cartData]);

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const currentSearch = new URLSearchParams(location.search).get('search') ?? '';
    setSearchQuery(currentSearch);
  }, [location.search]);

  usePageScrollReveal(pageContentRef, `${location.pathname}${location.search}`);
  usePageScrollReveal(footerRef, `${location.pathname}${location.search}`);

  const handleLogout = async () => {
    try {
      await logoutMut.mutateAsync();
    } catch {
      // Ignore logout transport errors and clear local auth state anyway.
    }

    dispatch(clearCredentials());
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  const navLinkClass = (path: string) =>
    `relative px-3 py-2 text-sm font-medium transition-colors ${isActive(path)
      ? 'text-brand-700'
      : 'text-slate-600 hover:text-brand-700'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <div className="bg-brand-800 px-4 py-2 text-center text-xs font-medium text-brand-100">
        {announcementText}
      </div>
      <GlobalAlerts />
      <PromotionalPopups />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md" data-testid="storefront-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-14 w-14 overflow-hidden sm:h-16 sm:w-16">
              <img src={storeLogo} alt={storeName} className="h-full w-full origin-center scale-[1.85] object-contain" />
            </div>
            <span className="text-lg font-bold leading-tight tracking-tight text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {storeName}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {primaryNav.map((item: NavItem) => (
              <Link key={`${item.label}-${item.href}`} to={item.href} className={navLinkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <form
            role="search"
            className="hidden min-w-[220px] max-w-xs flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 lg:flex"
            onSubmit={handleSearchSubmit}
          >
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search products"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="ml-2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-brand-700"
            >
              <svg className="h-4 w-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
              </svg>
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Link
              to="/wishlist"
              className="relative rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-red-500"
              aria-label={copy.wishlist}
            >
              <svg className="h-5 w-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </Link>
            <Link
              to="/cart"
              className="relative rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Cart"
            >
              <svg className="h-5 w-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {cart.itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white shadow-sm">
                  {cart.itemCount}
                </span>
              )}
            </Link>

            <select
              value={currentLocale}
              onChange={(event) => handleLocaleChange(event.target.value)}
              className="hidden cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 md:block"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>

            {isAuthenticated ? (
              <div className="hidden items-center gap-1 md:flex">
                <Link to="/account/orders" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  {copy.orders}
                </Link>
                <Link to="/profile" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  {user?.name ?? copy.profile}
                </Link>
                {user && ['admin', 'super_admin'].includes(user.role) && (
                  <a href="/admin" className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
                    {isItUserRole(user.role) ? 'IT Portal' : 'Admin'}
                  </a>
                )}
                <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                  {copy.logout}
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md md:inline-flex">
                {copy.signIn}
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t bg-white px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              <form
                role="search"
                className="mb-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search products"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button type="submit" aria-label="Search" className="ml-2 rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-brand-700">
                  <svg className="h-4 w-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
                  </svg>
                </button>
              </form>
              <div className="mb-1 flex gap-2 border-b p-2">
                <button onClick={() => handleLocaleChange('en')} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${currentLocale === 'en' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>English</button>
                <button onClick={() => handleLocaleChange('ta')} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${currentLocale === 'ta' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>தமிழ்</button>
              </div>
              {primaryNav.map((item: NavItem) => (
                <Link key={`mobile-${item.label}-${item.href}`} to={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to="/wishlist" className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">{copy.wishlist}</Link>
                  <Link to="/account/orders" className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">{copy.orders}</Link>
                  <Link to="/profile" className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">{copy.profile}</Link>
                  {user && ['admin', 'super_admin'].includes(user.role) && (
                    <a href="/admin" className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
                      {isItUserRole(user.role) ? 'IT Portal' : 'Admin'}
                    </a>
                  )}
                  <button onClick={handleLogout} className="rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">{copy.logout}</button>
                </>
              ) : (
                <Link to="/login" className="mt-1 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700">
                  {copy.signIn}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main key={location.pathname} className="flex-1">
        <div ref={pageContentRef} className={location.pathname === '/' ? 'w-full pb-8' : 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
          <Outlet />
        </div>
      </main>

      <NewsletterSignup />

      <footer ref={footerRef} className="relative z-20 border-t border-slate-200/10 bg-[#102F26] text-brand-100" data-testid="storefront-footer">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            <div className="animate-on-scroll fade-up lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="h-24 w-24 overflow-hidden">
                  <img src={footerLogo} alt={storeName} className="h-full w-full origin-center scale-[1.9] object-contain" />
                </div>
                <span className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{storeName}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-brand-300">
                {footerDescription}
              </p>

              {socialLinks.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {socialLinks.map((link: any, index: number) => (
                    <a key={index} href={link.url} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-800/80 text-brand-200 transition-colors hover:bg-brand-600 hover:text-white" aria-label={link.platform}>
                      <span className="text-[10px] font-medium capitalize">{String(link.platform).substring(0, 2)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="animate-on-scroll fade-up">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-400">{copy.shop}</h4>
              <nav className="space-y-2.5 text-sm">
                <Link to="/products" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.allProducts}</Link>
                <Link to="/cart" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.cart}</Link>
                <Link to="/faq" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.navFaq}</Link>
              </nav>
            </div>

            <div className="animate-on-scroll fade-up">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-400">{copy.company}</h4>
              <nav className="space-y-2.5 text-sm">
                <Link to="/pages/about" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.aboutUs}</Link>
                <Link to="/pages/contact" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.contact}</Link>
                <Link to="/blog" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.navBlog}</Link>
              </nav>
            </div>

            <div className="animate-on-scroll fade-up">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-400">{copy.legal}</h4>
              <nav className="space-y-2.5 text-sm">
                <Link to="/pages/shipping-policy" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.shippingPolicy}</Link>
                <Link to="/pages/refund-policy" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.refundPolicy}</Link>
                <Link to="/pages/privacy-policy" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.privacyPolicy}</Link>
                <Link to="/pages/terms-and-conditions" className="block text-brand-200 transition-all duration-200 hover:text-white hover:translate-x-0.5">{copy.terms}</Link>
              </nav>
            </div>
          </div>

          <div className="mt-12 border-t border-brand-800/60 pt-6 text-center text-xs text-brand-400/80 animate-on-scroll fade-up" data-animate-delay="400ms">
            &copy; {new Date().getFullYear()} {footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}

function normalizeNavHref(href: string): string {
  if (!href) {
    return '/';
  }

  if (!/^https?:\/\//i.test(href)) {
    return href.startsWith('/') ? href : `/${href}`;
  }

  try {
    const url = new URL(href);
    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    return href;
  }
}
