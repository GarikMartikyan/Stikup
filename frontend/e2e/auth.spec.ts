import { test, expect } from '@playwright/test';

test.describe('auth pages', () => {
  test('login page renders heading and form fields', async ({ page }) => {
    await page.route('/auth/me', (route) =>
      route.fulfill({ status: 401, body: '' }),
    );

    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form shows error on bad credentials', async ({ page }) => {
    await page.route('/auth/me', (route) =>
      route.fulfill({ status: 401, body: '' }),
    );
    await page.route('/auth/login', (route) =>
      route.fulfill({ status: 401, body: '' }),
    );

    await page.goto('/login');

    await page.getByLabel('Email').fill('bad@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toContainText(
      'Invalid email or password.',
    );
  });

  test('login form redirects to dashboard on success', async ({ page }) => {
    await page.route('/auth/me', (route) =>
      route.fulfill({ status: 401, body: '' }),
    );
    await page.route('/auth/login', (route) =>
      route.fulfill({ status: 204, body: '' }),
    );
    await page.route('/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ userId: 'abc123' }),
      }),
    );

    await page.goto('/login');

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('register page renders heading and form fields', async ({ page }) => {
    await page.route('/auth/me', (route) =>
      route.fulfill({ status: 401, body: '' }),
    );

    await page.goto('/register');

    await expect(
      page.getByRole('heading', { name: /create your account/i }),
    ).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});
