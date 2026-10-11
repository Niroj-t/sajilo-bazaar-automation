import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const APP = pathToFileURL(path.resolve('app/sajilo-bazaar.html')).href;

export const products = (page: Page) =>
  page.getByRole('list', { name: 'Products' }).getByRole('listitem');

export const badge = (page: Page) => page.getByTestId('cart-count');

export async function openShop(page: Page) {
  await page.goto(APP);
  await expect(products(page)).toHaveCount(6);
}

export async function addToCart(page: Page, name: string, expectedCount: string) {
  await products(page)
    .filter({ hasText: name })
    .getByRole('button', { name: 'Add to cart' })
    .click();
  await expect(badge(page)).toHaveText(expectedCount);
}

export async function chooseDelivery(
  page: Page,
  area: 'Inside Kathmandu Valley' | 'Outside Kathmandu Valley',
) {
  await page.getByLabel('Delivery area').selectOption({ label: area });
}
