import * as ThreeTsEngine from './ThreeTsEngine.js'
import * as MathHelper from './MathHelper.js'
import { createNoise3D } from 'simplex-noise';

export class SimplexNoiseGenerator implements ThreeTsEngine.IHeightGenerator {
    private noiseFunc : any;
    private params : any;
    
    constructor(param : any) {
        this.noiseFunc = createNoise3D(() => Math.random());
        this.params = param;
    }

     // Noise parameters
     // this.Engine.GuiParams.Noise = { "scale": 1100, 
     // "octaves": 6, 
     // "persistence": 0.71, 
     // "lacunarity": 1.8, 
     // "exponentiation": 4.5, 
     // "height": 300 };

    GeHeightFromNCoord(x : number, y : number, z : number): number {
        let scale = this.params.scale;
        let octaves = this.params.octaves;
        let persistence = this.params.persistence;
        let lacunarity = this.params.lacunarity;
        let exponentiation = this.params.exponentiation;
        let height = this.params.height;
        let frequency = 1.0;
        let amplitude = 1.0;
        let normalization = 0;
        let total = 0;
        const G = 2.0 ** (-persistence);
        const xs = x / scale;
        const ys = y / scale;
        const zs = z / scale;

        for (let o = 0; o < octaves; o++) {
            const noiseValue = this.noiseFunc(
                xs * frequency, ys * frequency, zs * frequency) * 0.5 + 0.5;
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
