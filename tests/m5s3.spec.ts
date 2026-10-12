import { test, expect } from '@playwright/test';
import { badge, products, openShop, addToCart, chooseDelivery } from './helpers';

/* Free practice: Warm-up */

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

/* Free practice: Core */

test('P3 quantities, line totals and subtotal', async ({ page }) => {
  // prediction: Gundruk line total is Rs 540.00, subtotal is Rs 5,040.00, badge is 4.
  await openShop(page);
  await addToCart(page, 'Pashmina Shawl', '1');
  await addToCart(page, 'Gundruk', '2');

  const gundruk = page.getByRole('row', { name: /Gundruk/ });
  await gundruk.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(gundruk.getByTestId('qty')).toHaveText('2');
  await gundruk.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(gundruk.getByTestId('qty')).toHaveText('3');

  // 3 x 180 = 540. Subtotal = 4,500 + 540 = 5,040
  await expect(gundruk.getByTestId('line-total')).toHaveText('Rs 540.00');
  await expect(page.getByTestId('subtotal')).toHaveText('Rs 5,040.00');
  await expect(badge(page)).toHaveText('4');
});

test('P4 promo code: bad code, then DASHAIN10', async ({ page }) => {
  // prediction: the bad code is rejected, DASHAIN10 takes Rs 85.00 off, and the total is Rs 865.00.
  await openShop(page);
  await addToCart(page, 'Dhaka Topi', '1');
  await chooseDelivery(page, 'Inside Kathmandu Valley');

  const message = page.getByTestId('promo-message');

  // Bad code
  await page.getByLabel('Promo code').fill('NOPE');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(message).toHaveText('Sorry, that code is not valid.');
  await expect(page.getByTestId('discount')).toHaveText('Rs 0.00');

  // Good code: 10% of 850 = 85
  await page.getByLabel('Promo code').fill('DASHAIN10');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(message).toHaveText('DASHAIN10 applied: 10% off your items');
  await expect(page.getByTestId('subtotal')).toHaveText('Rs 850.00');
  await expect(page.getByTestId('delivery-fee')).toHaveText('Rs 100.00');
  await expect(page.getByTestId('discount')).toHaveText('Rs 85.00');
  // 850 + 100 - 85 = 865
  await expect(page.getByTestId('order-total')).toHaveText('Rs 865.00');
});

test('P5 remove: Cancel keeps the item, OK empties the cart', async ({ page }) => {
  // prediction: Cancel keeps the item (badge 1), OK empties the cart (badge 0).
  await openShop(page);
  await addToCart(page, 'Dhaka Topi', '1');
  const row = page.getByTestId('cart-row');

  // Cancel: the item must stay
  let confirmText = '';
  page.once('dialog', async dialog => {
    confirmText = dialog.message();
    await dialog.dismiss();
  });
  await row.getByRole('button', { name: 'Remove' }).click();
  expect(confirmText).toBe('Remove Dhaka Topi from your cart?');
  await expect(row).toBeVisible();
  await expect(badge(page)).toHaveText('1');

  // OK: the item goes
  page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
  await expect(badge(page)).toHaveText('0');
});

test('P6 alert when checking out without a delivery area', async ({ page }) => {
  // prediction: an alert says "Please choose a delivery area before checkout." and Checkout does not open.

  await openShop(page);
  await addToCart(page, 'Lokta Paper Notebook', '1');

  let alertText = '';
  page.once('dialog', async dialog => {
    alertText = dialog.message();
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  expect(alertText).toBe('Please choose a delivery area before checkout.');
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeHidden();
});

/* Free practice: Challenge */

test('P7 gift note through the prompt', async ({ page }) => {
  // prediction: the total is Rs 4,750.00 and the page shows my gift note.
  await openShop(page);
  await addToCart(page, 'Pashmina Shawl', '1');
  await chooseDelivery(page, 'Outside Kathmandu Valley');

  // 4,500 + 250 = 4,750
  await expect(page.getByTestId('order-total')).toHaveText('Rs 4,750.00');
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();

  page.once('dialog', dialog => dialog.accept('Happy Dashain, Aama!'));
  await page.getByRole('button', { name: 'Add a gift note' }).click();

  await expect(page.getByTestId('gift-note')).toContainText('Happy Dashain, Aama!');
  await expect(page.frameLocator('iframe[title="eSewa payment"]').getByTestId('pay-amount'))
    .toHaveText('Rs 4,750.00');
});

test('P8 wrong MPIN shows an error inside eSewa and places no order', async ({ page }) => {
  // prediction: eSewa shows "Incorrect eSewa ID or MPIN." and "Order placed!" never appears.
  await openShop(page);
  await addToCart(page, 'Dhaka Topi', '1');
  await chooseDelivery(page, 'Inside Kathmandu Valley');
  await expect(page.getByTestId('order-total')).toHaveText('Rs 950.00');
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  const esewa = page.frameLocator('iframe[title="eSewa payment"]');
  await esewa.getByLabel('eSewa ID').fill('9841234567');
  await esewa.getByLabel('MPIN').fill('0000');
  await esewa.getByRole('button', { name: 'Pay now' }).click();

  await expect(esewa.getByRole('alert')).toHaveText('Incorrect eSewa ID or MPIN.');
  await expect(page.getByRole('heading', { name: 'Order placed!' })).toBeHidden();
});

test('P9 the receipt tab matches the order', async ({ page }) => {
  // prediction: the receipt tab shows the same order ID and a total of Rs 1,550.00.
  await openShop(page);
  await addToCart(page, 'Dhaka Topi', '1');
  await addToCart(page, 'Ilam Orthodox Tea', '2');
  await chooseDelivery(page, 'Inside Kathmandu Valley');
  await expect(page.getByTestId('order-total')).toHaveText('Rs 1,550.00');
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  const esewa = page.frameLocator('iframe[title="eSewa payment"]');
  await esewa.getByLabel('eSewa ID').fill('9841234567');
  await esewa.getByLabel('MPIN').fill('1234');
  await esewa.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByRole('heading', { name: 'Order placed!' })).toBeVisible();
  const orderId = await page.getByTestId('order-id').textContent();

  // Listen first, click, then collect the new tab
  const receiptPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'View receipt' }).click();
  const receipt = await receiptPromise;

  await expect(receipt).toHaveTitle('Receipt | Sajilo Bazaar');
  await expect(receipt.getByTestId('receipt-order-id')).toHaveText(orderId!);
  await expect(receipt.getByTestId('receipt-total')).toHaveText('Rs 1,550.00');
  await expect(receipt.getByTestId('receipt-delivery')).toHaveText('Rs 100.00');
});

test('P10 help chat pop-up', async ({ page }) => {
  // prediction: the agent joins, replies to my message, and the shop still works after I close the pop-up.
  await openShop(page);

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Need help? Chat with us' }).click();
  const help = await popupPromise;

  await expect(help).toHaveTitle('Sajilo Bazaar Support');
  await expect(help.getByText('Sita from Sajilo Bazaar has joined the chat.')).toBeVisible();

  await help.getByLabel('Type your message').fill('Is the Pashmina Shawl in stock?');
  await help.getByRole('button', { name: 'Send' }).click();
  await expect(help.getByText('Is the Pashmina Shawl in stock?')).toBeVisible();
  await expect(help.getByText('Thanks for your message. We will get back to you within 10 minutes.'))
    .toBeVisible();

  await help.close();

  // The shop page is still usable
  await addToCart(page, 'Gundruk', '1');
});
