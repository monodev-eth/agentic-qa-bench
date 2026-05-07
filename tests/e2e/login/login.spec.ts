import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/login.page'

const SEED = { email: 'demo@example.com', password: 'demo1234' }

test.describe('Login surface', () => {
  let login: LoginPage

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page)
    await login.goto()
  })

  test('renders the login form', async () => {
    await expect(login.heading).toBeVisible()
    await expect(login.emailInput).toBeVisible()
    await expect(login.passwordInput).toBeVisible()
    await expect(login.signInButton).toBeVisible()
  })

  test('email and password inputs accept typed values', async () => {
    await login.emailInput.fill('user@example.com')
    await login.passwordInput.fill('hunter2-long-password')
    await expect(login.emailInput).toHaveValue('user@example.com')
    await expect(login.passwordInput).toHaveValue('hunter2-long-password')
  })

  test('submitting wrong credentials surfaces an error', async () => {
    await login.signIn('wrong@example.com', 'wrongpass')
    await expect(login.errorAlert).toBeVisible({ timeout: 5000 })
    await expect(login.errorAlert).toContainText(/invalid login credentials/i)
  })

  test('submitting seed credentials lands on the todo list', async ({ page }) => {
    await login.signIn(SEED.email, SEED.password)
    await expect(page.getByRole('heading', { name: 'Todo List.' })).toBeVisible()
    await expect(page.getByText('Walk the dog')).toBeVisible()
    await expect(page.getByText('Buy groceries')).toBeVisible()
  })
})
