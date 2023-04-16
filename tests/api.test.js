const request = require('supertest');
const fs = require('fs');

// Mock your application's environment variables
process.env.API_KEY = 'your_api_key';
process.env.SESSIONS_PATH = './sessions_test';

const app = require("../app");

// Mock your application's dependencies
jest.mock('axios');

// Define test cases
describe('API health checks', () => {
  it('should return a valid healthcheck', async () => {
    const response = await request(app).get('/ping');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'pong', success: true });
  });
});

describe('API Authentication Tests', () => {

  it('should return 403 Forbidden for invalid API key', async () => {
    const response = await request(app).get('/api/startSession/1');
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Invalid API key' });
  });

  it('should setup and terminate a client session', async () => {
    const response = await request(app).get('/api/startSession/1').set('x-api-key', 'your_api_key');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Session initiated successfully' });
    expect(fs.existsSync('./sessions_test/session-1')).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const response2 = await request(app).get('/api/terminateSession/1').set('x-api-key', 'your_api_key');
    expect(response2.status).toBe(200);
    expect(response2.body).toEqual({ success: true, message: 'Logged out successfully' });

    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(fs.existsSync('./sessions_test/session-1')).toBe(false);
  });

  it('should setup and flush multiple client sessions', async () => {
    const response = await request(app).get('/api/startSession/2').set('x-api-key', 'your_api_key');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Session initiated successfully' });
    expect(fs.existsSync('./sessions_test/session-2')).toBe(true);

    const response2 = await request(app).get('/api/startSession/3').set('x-api-key', 'your_api_key');
    expect(response2.status).toBe(200);
    expect(response2.body).toEqual({ success: true, message: 'Session initiated successfully' });
    expect(fs.existsSync('./sessions_test/session-3')).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const response3 = await request(app).get('/api/terminateInactiveSessions').set('x-api-key', 'your_api_key');
    expect(response3.status).toBe(200);
    expect(response3.body).toEqual({ success: true, message: 'Flush completed successfully' });

    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(fs.existsSync('./sessions_test/session-2')).toBe(false);
    expect(fs.existsSync('./sessions_test/session-3')).toBe(false);
  });

  // it('should send a message when POSTing to /api/sendMessage', async () => {
  //   const response = await request(app)
  //     .post('/api/sendMessage/123456789')
  //     .set('x-api-key', 'your_api_key')
  //     .send({ target_number: '6281287331783', message: 'Hello, world! Love from Jest' });
  //   expect(response.status).toBe(200);
  //   expect(response.body).toEqual({ success: true, message: 'Message sent successfully' });
  // });
});
