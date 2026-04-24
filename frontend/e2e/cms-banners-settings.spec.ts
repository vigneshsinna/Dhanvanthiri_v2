import { expect, test } from '@playwright/test';
import { canMutateAdminData, e2eConfig } from './support/env';
import { adminApi, getAdminApiToken } from './support/admin';
import { getPublicApi, uniqueSlug, waitForStorefrontRefresh } from './support/storefront';

test.describe('Phase 6 - CMS, banners, and business settings', () => {
  test.skip(!canMutateAdminData(), 'Set E2E_ALLOW_MUTATION=true and E2E_DB_IS_DISPOSABLE=true against a seeded testing database to run mutating CMS/settings checks.');

  test('CMS/legal page update is visible on React /pages/{slug}', async ({ page, request }) => {
    const token = await getAdminApiToken(request, {
      email: process.env.E2E_SUPER_ADMIN_EMAIL!,
      password: process.env.E2E_SUPER_ADMIN_PASSWORD || e2eConfig.adminPassword,
    });
    const slug = uniqueSlug('e2e-page');
    const title = `E2E Page ${slug}`;
    const updatedTitle = `${title} Updated`;

    const createPage = await adminApi(request, 'post', 'pages', token, {
      title: { en: title },
      slug,
      content: { en: '<p>Initial E2E page content</p>' },
      meta_title: { en: title },
      meta_description: { en: 'E2E page description' },
    });
    expect(createPage.ok(), await createPage.text()).toBeTruthy();
    const pageRecord = (await createPage.json()).data;

    const updatePage = await adminApi(request, 'put', `pages/${pageRecord.id}`, token, {
      title: { en: updatedTitle },
      content: { en: '<p>Updated E2E legal content from admin.</p>' },
    });
    expect(updatePage.ok(), await updatePage.text()).toBeTruthy();

    const publicPage = await getPublicApi(request, `pages/${slug}`);
    expect(publicPage.ok(), await publicPage.text()).toBeTruthy();
    expect(await publicPage.text()).toContain('Updated E2E legal content from admin');

    await waitForStorefrontRefresh(page, `/pages/${slug}`, /Updated E2E legal content from admin/i);
    await adminApi(request, 'delete', `pages/${pageRecord.id}`, token);
  });

  test('homepage banner link update is visible through public banner API', async ({ request }) => {
    const token = await getAdminApiToken(request);
    const bannerUrl = `/products?e2e=${Date.now()}`;
    const createBanner = await adminApi(request, 'post', 'banners', token, {
      position: 1,
      url: bannerUrl,
    });
    expect(createBanner.ok(), await createBanner.text()).toBeTruthy();
    const banner = (await createBanner.json()).data;

    const publicBanners = await getPublicApi(request, 'banners');
    expect(publicBanners.ok(), await publicBanners.text()).toBeTruthy();
    expect(await publicBanners.text()).toContain(bannerUrl);

    await adminApi(request, 'delete', `banners/${banner.id}`, token);
  });

  test('business settings update is reflected by storefront settings API within one minute', async ({ request }) => {
    test.skip(!process.env.E2E_SUPER_ADMIN_EMAIL, 'Settings writes require a super admin token; set E2E_SUPER_ADMIN_EMAIL/E2E_SUPER_ADMIN_PASSWORD.');

    const token = await getAdminApiToken(request);
    const marker = `E2E Footer ${Date.now()}`;
    const updateSettings = await adminApi(request, 'put', 'settings', token, {
      settings: {
        frontend_copyright_text: marker,
        contact_email: 'e2e@example.test',
        contact_phone: '+910000000000',
      },
    });
    expect(updateSettings.ok(), await updateSettings.text()).toBeTruthy();

    await expect
      .poll(async () => {
        const settings = await getPublicApi(request, 'storefront/settings');
        return (await settings.text()).includes(marker);
      }, { timeout: 60_000, intervals: [1000, 2500, 5000] })
      .toBeTruthy();
  });
});
