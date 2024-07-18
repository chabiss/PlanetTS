import { SimplexNoiseGenerator } from './NoiseGenerator';

const { parentPort } = require('worker_threads');

parentPort.on('message', (message) => {
    console.log('Received from main thread:', message);
    parentPort.postMessage('Hello, main thread!');
});

