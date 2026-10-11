import { test, expect } from '@playwright/test';
import { badge, products, openShop, addToCart, chooseDelivery } from './helpers';

/* ================= Free practice: Warm-up ================= */

test('P1 the toast appears, then disappears', async ({ page }) => {
  // prediction: the toast "Lokta Paper Notebook added to cart" shows, then hides, and the badge is 1.
  await openShop(page);
  await products(page).filter({ hasText: 'Lokta Paper Notebook' })
    .getByRole('button', { name: 'Add to cart' }).click();

  const toast = page.getByRole('status');
  await expect(toast).toHaveText('Lokta Paper Notebook added to cart');
  await expect(toast).toBeHidden();
  await expect(badge(page)).toHaveText('1');
});

test('P2 the last Singing Bowl sells out', async ({ page }) => {
  // prediction: after one add, the bowl button says "Sold out" and is disabled.
  await openShop(page);
  const bowl = products(page).filter({ hasText: 'Singing Bowl' });
  await bowl.getByRole('button', { name: 'Add to cart' }).click();

  await expect(badge(page)).toHaveText('1');
  await expect(bowl.getByRole('button', { name: 'Sold out' })).toBeDisabled();
});
