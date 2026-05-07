import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly heading: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly signInButton: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Login' })
    this.emailInput = page.getByPlaceholder('Your email address')
    this.passwordInput = page.getByPlaceholder('Your password')
    this.signInButton = page.getByRole('button', { name: /sign in/i })
    this.errorAlert = page.getByRole('alert').filter({ hasText: /\S/ })
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'networkidle' })
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.signInButton.click()
  }
}
