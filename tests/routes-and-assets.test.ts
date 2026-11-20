import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

const ROUTES = [
  '/',
  '/about',
  '/services',
  '/ports/alexandria',
  '/ports/dekheila',
  '/how-it-works',
  '/login',
  '/register',
  '/shipper',
  '/carrier',
  '/admin',
  '/shipments/new',
  '/shipments/test_probe',
  '/contact',
  '/terms',
  '/privacy',
];

const IMAGES = [
  '/src/assets/images/hero_container_port_1795013739077.jpg',
  '/src/assets/images/alexandria_port_terminal_1795013740135.jpg',
  '/src/assets/images/dekheila_port_logistics_1795013741729.jpg',
  '/src/assets/images/container_fleet_trucks_1795013739977.jpg',
];

describe('MH CARGO Routes & Visual Assets Availability Tests', () => {
  it('serves all 16 application routes with HTTP 200 and Arabic RTL document shell', async () => {
    for (const route of ROUTES) {
      const res = await fetch(`${BASE_URL}${route}`);
      assert.equal(res.status, 200, `Expected 200 for route ${route}`);
      const html = await res.text();
      assert.ok(html.includes('dir="rtl"'), `Missing RTL attribute on ${route}`);
      assert.ok(html.includes('MH CARGO'), `Missing MH CARGO title on ${route}`);
    }
  });

  it('serves all 4 generated maritime port & fleet image assets with HTTP 200', async () => {
    for (const imgPath of IMAGES) {
      const res = await fetch(`${BASE_URL}${imgPath}`);
      assert.equal(res.status, 200, `Expected 200 for image ${imgPath}`);
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.startsWith('image/'), `Expected image content-type for ${imgPath}`);
    }
  });
});
