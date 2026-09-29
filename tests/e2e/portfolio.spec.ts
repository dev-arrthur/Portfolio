import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// The CI server uses an isolated local data directory and this test-only password.
// Never point this suite at a production deployment: it publishes and removes a CV.
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Portfolio-test-only-2026!';

test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth)).toBeLessThanOrEqual(1);
}

function onePagePdf(): Buffer {
  const stream = 'BT /F1 12 Tf 36 100 Td (Portfolio automated test - not a real CV) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 160] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let text = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(text));
    text += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  text += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(text, 'ascii');
}

test('desktop: all projects, filters, accessible details and contact destinations', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Arthur\s*Ferreira\./);
  await page.getByRole('button', { name: 'Agora não', exact: true }).click();
  await expect(page.locator('.pf-project-card')).toHaveCount(10);
  const names = ['thynkBarber', 'Página de Carreiras', 'App de Vantagens e Benefícios', 'Cobrança de Documentos', 'Sistema de Acompanhamento', 'WhatsApp Multichannel', 'RedeMG Farma', 'Recrie', 'Sistema de Cobranças', 'thynkXP'];
  for (const name of names) await expect(page.locator('.pf-project-card').getByRole('heading', { name, exact: true })).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('home-1440.png'), fullPage: true, animations: 'disabled' });

  await page.getByRole('button', { name: /^Internos/ }).click();
  await expect(page.locator('.pf-project-card')).toHaveCount(3);
  await expect(page.locator('.pf-project-count')).toHaveText('3 projetos');
  await page.getByRole('button', { name: /^Em desenvolvimento/ }).click();
  await expect(page.locator('.pf-project-card')).toHaveCount(2);
  await expect(page.locator('.pf-project-card').getByRole('heading', { name: 'WhatsApp Multichannel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Todos/ }).click();
  await expect(page.locator('.pf-project-card')).toHaveCount(10);

  await page.getByRole('button', { name: 'Ver detalhes de thynkBarber', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'thynkBarber', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Visitar projeto' })).toHaveAttribute('href', 'https://thynkbarber.com');
  await expect(dialog.getByRole('button', { name: 'Fechar detalhes do projeto' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();

  const socials = page.locator('.pf-socials');
  await expect(socials.getByRole('link', { name: 'Instagram', exact: true })).toHaveAttribute('href', 'https://www.instagram.com/hey.arrthur/');
  await expect(socials.getByRole('link', { name: 'WhatsApp', exact: true })).toHaveAttribute('href', /^https:\/\/wa\.me\/5532991145114(?:\?|$)/);
  await expect(socials.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', 'https://www.linkedin.com/in/arthurm-ferreira/');
  await expect(socials.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/dev-arrthur');
  await expect(page.getByRole('link', { name: 'dev.arrthur@gmail.com', exact: true })).toHaveAttribute('href', 'mailto:dev.arrthur@gmail.com');
  await expect(page.getByRole('link', { name: 'Quero saber mais', exact: true })).toHaveAttribute('href', /^https:\/\/wa\.me\/5532991145114\?/);
  await expectNoHorizontalOverflow(page);
});

test('mobile: navigation, project details and 390px layout stay usable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Arthur\s*Ferreira\./);
  await page.getByRole('button', { name: 'Agora não', exact: true }).click();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('home-390.png'), fullPage: true, animations: 'disabled' });

  const menu = page.getByRole('button', { name: 'Abrir menu', exact: true });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  const openMenu = page.getByRole('button', { name: 'Fechar menu', exact: true });
  await expect(openMenu).toHaveAttribute('aria-expanded', 'true');
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' });
  await expect(navigation.getByRole('link', { name: 'Projetos', exact: true })).toBeVisible();
  await navigation.getByRole('link', { name: 'Projetos', exact: true }).click();
  await expect(page).toHaveURL(/#projetos$/);
  await expect(page.getByRole('button', { name: 'Abrir menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.pf-project-card')).toHaveCount(10);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Ver detalhes de Página de Carreiras', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Página de Carreiras', exact: true });
  await expect(dialog).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await dialog.getByRole('button', { name: 'Fechar detalhes do projeto', exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test('consented visits and clicks reach admin; CV lifecycle tracks only public downloads', async ({ page, context }, testInfo) => {
  await page.goto('/');
  const origin = new URL(page.url()).origin;
  const deniedStats = await page.request.get('/api/admin/stats?days=30');
  expect(deniedStats.status()).toBe(401);

  const visitResponse = page.waitForResponse(response => response.url().endsWith('/api/track') && response.request().postDataJSON()?.type === 'pageview');
  await page.getByRole('button', { name: 'Permitir métricas', exact: true }).click();
  expect((await visitResponse).status()).toBe(204);
  await expect(page.getByRole('complementary', { name: 'Preferência de privacidade' })).not.toBeVisible();
  const clickResponse = page.waitForResponse(response => response.url().endsWith('/api/track') && response.request().postDataJSON()?.target === 'filter-internal');
  await page.getByRole('button', { name: /^Internos/ }).click();
  expect((await clickResponse).status()).toBe(204);
  await expect(page.locator('.pf-project-card')).toHaveCount(3);

  await page.goto('/admin');
  await expect(page.getByLabel('Sua senha', { exact: true })).toBeEnabled();
  await page.getByLabel('Sua senha', { exact: true }).fill(adminPassword);
  await page.getByRole('button', { name: 'Acessar painel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu portfólio, em números.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar CSV', exact: true })).toBeEnabled();
  await expect(page.locator('.admin-metric')).toHaveCount(4);
  await expectNoHorizontalOverflow(page);

  const getStats = async () => {
    const response = await page.request.get('/api/admin/stats?days=30', { headers: { Origin: origin } });
    expect(response.ok()).toBeTruthy();
    return response.json() as Promise<{ totals: { pageviews: number; visitors: number; clicks: number; downloads: number }; topClicks: Array<{ target: string; count: number }>; cv: { available: boolean }; setup: { ready: boolean } }>;
  };
  const firstStats = await getStats();
  expect(firstStats.setup.ready).toBe(true);
  expect(firstStats.totals.pageviews).toBeGreaterThanOrEqual(1);
  expect(firstStats.totals.visitors).toBeGreaterThanOrEqual(1);
  expect(firstStats.topClicks.find(item => item.target === 'filter-internal')?.count).toBeGreaterThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('admin-overview.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('admin-mobile.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 1000 });

  const csvDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV', exact: true }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/portfolio-indicadores.*\.csv$/);
  const csvPath = await csvDownload.path();
  expect(csvPath).not.toBeNull();
  const csv = await readFile(csvPath!, 'utf8');
  expect(csv).toContain('Data UTC');
  expect(csv).toContain('filter-internal');

  await page.getByRole('button', { name: 'Interações', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Atividade recente', exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Currículo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Currículo sempre em dia.', exact: true })).toBeVisible();
  const pdf = onePagePdf();
  const filename = 'Portfolio-Test-CV.pdf';
  let uploaded = false;
  try {
    await page.locator('input[type="file"]').setInputFiles({ name: filename, mimeType: 'application/pdf', buffer: pdf });
    await page.getByRole('button', { name: /^(Publicar|Substituir) currículo$/ }).click();
    await expect(page.getByText('Currículo publicado! O download já está disponível no portfólio.', { exact: true })).toBeVisible();
    uploaded = true;
    await expect(page.locator('.admin-cv-status')).toHaveText('Disponível');
    await expect(page.getByRole('heading', { name: filename, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remover currículo', exact: true })).toBeEnabled();

    const publicPage = await context.newPage();
    await publicPage.goto('/');
    const floatingCv = publicPage.locator('a.pf-cv-floating');
    await expect(floatingCv).toHaveText('Baixar currículo');
    await expect(floatingCv).toHaveAttribute('href', '/api/cv/download?source=floating');
    const downloadsBefore = (await getStats()).totals.downloads;
    const downloadPromise = publicPage.waitForEvent('download');
    await floatingCv.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(filename);
    expect(await download.failure()).toBeNull();
    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();
    expect(await readFile(downloadedPath!)).toEqual(pdf);
    await expect.poll(async () => (await getStats()).totals.downloads).toBe(downloadsBefore + 1);

    const adminPreview = await page.request.get('/api/cv/download?source=admin', { headers: { Origin: origin } });
    expect(adminPreview.ok()).toBeTruthy();
    expect(await adminPreview.body()).toEqual(pdf);
    expect((await getStats()).totals.downloads).toBe(downloadsBefore + 1);

    await page.getByRole('button', { name: 'Remover currículo', exact: true }).click();
    await page.getByRole('button', { name: 'Sim, remover', exact: true }).click();
    await expect(page.locator('.admin-cv-status')).toHaveText('Em breve');
    uploaded = false;
    const metadata = await publicPage.request.get('/api/cv');
    expect(await metadata.json()).toEqual({ available: false });
    await publicPage.reload();
    await expect(publicPage.locator('.pf-cv-floating')).toBeDisabled();
    await expect(publicPage.locator('.pf-cv-floating')).toHaveText('Currículo em breve');
    expect((await publicPage.request.get('/api/cv/download?source=floating')).status()).toBe(404);
    await publicPage.close();
  } finally {
    if (uploaded) await page.request.delete('/api/admin/cv', { headers: { Origin: origin } });
  }

  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta.', exact: true })).toBeVisible();
  expect((await page.request.get('/api/admin/stats?days=30')).status()).toBe(401);
});
