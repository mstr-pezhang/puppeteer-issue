import { Browser, Page } from 'puppeteer';
import express from 'express';

import launchBrowser from '../util/launchBrowser';

const app = express();
app.use(express.static('static'));
const server = app.listen(3750);

let browser: Browser;
let page: Page;

test('Launch Chrome', async () => {
	browser = await launchBrowser();
});

test('Open a new tab', async () => {
	page = await browser.newPage();
});

test('Enable DOM & CSS', async () => {
	const client = Reflect.get(page, '_client').call(page);
	await client.send('DOM.enable');
	await client.send('CSS.enable');
});

test('Enable request interception', async () => {
	await page.setRequestInterception(true);

	page.on('request', (req) => {
		req.continue();
	});
});

test('Open sample page', async () => {
	await page.setViewport({
		width: 979,
		height: 746,
	});
	await page.goto('http://localhost:3750');
});

test('Wait for 10s', (done) => {
	setTimeout(done, 10 * 1000);
}, 15 * 1000);

test('Evaluate font family', async () => {
	const client = Reflect.get(page, '_client').call(page);
	const doc = await client.send('DOM.getDocument');
	const node = await client.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.sample-text' });
	const { fonts } = await client.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId });
	const [font] = fonts;
	expect(font.familyName).toBe('Open Sans SemiBold');
	expect(font.isCustomFont).toBe(true);
}, 100 * 1000);

test('Close', async () => {
	await page.close();
	await browser.close();
	server.close();
});
