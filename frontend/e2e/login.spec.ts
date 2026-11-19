import { test, expect } from '@playwright/test'

test('affiche le formulaire de connexion et ses champs accessibles', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Connectez-vous' })).toBeVisible()
  await expect(page.getByLabel("Nom d'utilisateur")).toBeVisible()
  await expect(page.getByLabel('Mot de passe')).toBeVisible()
})

test('refuse des identifiants invalides avec un message', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel("Nom d'utilisateur").fill('inconnu')
  await page.getByLabel('Mot de passe').fill('invalid-password')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText(/Invalid username or password/i)).toBeVisible()
})
