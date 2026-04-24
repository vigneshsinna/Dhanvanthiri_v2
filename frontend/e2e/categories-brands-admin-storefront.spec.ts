import { expect, test } from '@playwright/test';
import { canMutateAdminData } from './support/env';
import { adminApi, getAdminApiToken } from './support/admin';
import { getPublicApi, uniqueSlug, waitForStorefrontRefresh } from './support/storefront';

test.describe('Phase 4 - Categories and brands admin to React storefront', () => {
  test.skip(!canMutateAdminData(), 'Set E2E_ALLOW_MUTATION=true and E2E_DB_IS_DISPOSABLE=true against a seeded testing database to run mutating catalog bridge checks.');

  test('category create/edit/featured state reflects through public API and product listing', async ({ page, request }) => {
    const token = await getAdminApiToken(request);
    const slug = uniqueSlug('e2e-category');
    const name = `E2E Category ${slug}`;
    const updatedName = `${name} Updated`;

    const createCategory = await adminApi(request, 'post', 'categories', token, {
      name,
      slug,
      featured: true,
    });
    expect(createCategory.ok(), await createCategory.text()).toBeTruthy();
    const category = (await createCategory.json()).data;

    const updateCategory = await adminApi(request, 'put', `categories/${category.id}`, token, {
      name: updatedName,
      slug,
      featured: false,
    });
    expect(updateCategory.ok(), await updateCategory.text()).toBeTruthy();

    const productSlug = uniqueSlug('e2e-category-product');
    const createProduct = await adminApi(request, 'post', 'products', token, {
      name: `E2E Category Product ${productSlug}`,
      slug: productSlug,
      category_id: category.id,
      price: 245,
      status: 'active',
      stock_quantity: 7,
    });
    expect(createProduct.ok(), await createProduct.text()).toBeTruthy();
    const product = (await createProduct.json()).data;

    const categoryProducts = await getPublicApi(request, `products/category/${slug}`);
    expect(categoryProducts.ok(), await categoryProducts.text()).toBeTruthy();
    expect(await categoryProducts.text()).toContain(productSlug);

    await waitForStorefrontRefresh(page, '/products', product.name);

    await adminApi(request, 'delete', `products/${product.id}`, token);
    await adminApi(request, 'delete', `categories/${category.id}`, token);
  });

  test('brand create/edit reflects through public API and product membership', async ({ request }) => {
    const token = await getAdminApiToken(request);
    const slug = uniqueSlug('e2e-brand');
    const name = `E2E Brand ${slug}`;
    const updatedName = `${name} Updated`;

    const createBrand = await adminApi(request, 'post', 'brands', token, { name, slug });
    expect(createBrand.ok(), await createBrand.text()).toBeTruthy();
    const brand = (await createBrand.json()).data;

    const updateBrand = await adminApi(request, 'put', `brands/${brand.id}`, token, { name: updatedName, slug });
    expect(updateBrand.ok(), await updateBrand.text()).toBeTruthy();

    const productSlug = uniqueSlug('e2e-brand-product');
    const createProduct = await adminApi(request, 'post', 'products', token, {
      name: `E2E Brand Product ${productSlug}`,
      slug: productSlug,
      brand_id: brand.id,
      price: 275,
      status: 'active',
      stock_quantity: 8,
    });
    expect(createProduct.ok(), await createProduct.text()).toBeTruthy();
    const product = (await createProduct.json()).data;

    const brands = await getPublicApi(request, 'brands');
    expect(brands.ok(), await brands.text()).toBeTruthy();
    expect(await brands.text()).toContain(slug);

    const brandedProducts = await getPublicApi(request, `products?brands=${brand.id}`);
    expect(brandedProducts.ok(), await brandedProducts.text()).toBeTruthy();
    expect(await brandedProducts.text()).toContain(productSlug);

    await adminApi(request, 'delete', `products/${product.id}`, token);
    await adminApi(request, 'delete', `brands/${brand.id}`, token);
  });
});
