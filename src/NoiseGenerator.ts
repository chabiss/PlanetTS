import * as ThreeTsEngine from './ThreeTsEngine.js'
import * as MathHelper from './MathHelper.js'
import { createNoise2D } from 'simplex-noise';

export class SimplexNoiseGenerator implements ThreeTsEngine.IHeightGenerator {
    private noiseFunc : any;
    private params : any;
    
    constructor(param : any) {
        this.noiseFunc = createNoise2D(() => Math.random());
        this.params = param;
    }

     // Noise parameters
     // this.Engine.GuiParams.Noise = { "scale": 1100, 
     // "octaves": 6, 
     // "persistence": 0.71, 
     // "lacunarity": 1.8, 
     // "exponentiation": 4.5, 
     // "height": 300 };

    GeHeightFromNCoord(x : number, y : number): number {
        let scale = this.params.Noise.scale;
        let octaves = this.params.Noise.octaves;
        let persistence = this.params.Noise.persistence;
        let lacunarity = this.params.Noise.lacunarity;
        let exponentiation = this.params.Noise.exponentiation;
        let height = this.params.Noise.height;
        let frequency = 1.0;
        let amplitude = 1.0;
        let normalization = 0;
        let total = 0;
        const G = 2.0 ** (-persistence);
        const xs = x / scale;
        const ys = y / scale;

        for (let o = 0; o < octaves; o++) {
            const noiseValue = this.noiseFunc(
                xs * frequency, ys * frequency) * 0.5 + 0.5;
            total += noiseValue * amplitude;
            normalization += amplitude;
            amplitude *= G;
            frequency *= lacunarity;
          }

        total /= normalization;
        return Math.pow(
            total, exponentiation) * height;
    }
}
