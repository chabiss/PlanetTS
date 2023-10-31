import * as THREE from 'three'
import * as ThreeTsEngine from './ThreeTsEngine.js'
import * as MathHelper from './MathHelper.js'

export class HeightMap implements ThreeTsEngine.IHeightGenerator {
    private imageWidth : number;
    private imageHeight : number;
    private engine : ThreeTsEngine.GraphicEngine;
    private heightmapFile : string;
    private Texture : THREE.Texture;
    private imageData : ImageData;

    constructor(engine? : ThreeTsEngine.GraphicEngine ,  heightmapFile? : string, onLoaded? : (heightMap : HeightMap) => void) {
        this.engine = engine;
        this.heightmapFile = heightmapFile;
        this.engine?.GetTexture(this.heightmapFile, (texture) => {
            this.Texture = texture;
            this.imageData = this.GetImageData(texture);
            this.imageWidth = this.imageData.width
            this.imageHeight = this.imageData.height;
            onLoaded?.(this);
        });
    }

    private GetImageData(texture : any) : ImageData {
        let canvas = document.createElement('canvas');
        canvas.width = texture.width;
        canvas.height = texture.height;
        let context = canvas.getContext('2d');
        context.drawImage(texture, 0, 0);
        return context.getImageData(0, 0, texture.width, texture.height);
    }
    
    private GetPixel(x : number, y : number) : number {
        let index = (x + y * this.imageWidth) * 4;
        return this.imageData.data[index] / 255;
    }

    private GetHeight(x : number, y : number) : number {
        let x1 = MathHelper.Clamp(Math.floor(x), 0, this.imageWidth-1);
        let x2 = MathHelper.Clamp(x1+1, 0, this.imageWidth-1);
        let y1 = MathHelper.Clamp(Math.floor(y), 0, this.imageHeight-1);
        let y2 = MathHelper.Clamp(y1+1, 0, this.imageHeight-1);

        
        let height = MathHelper.DoBilinearInterpolation( 
                                            this.GetPixel(x1, y1), 
                                            this.GetPixel(x2, y1), 
                                            this.GetPixel(x1, y2), 
                                            this.GetPixel(x2, y2), 
                                            x-x1, y-y1);
                            
        return height;
    }

    GeHeightFromNCoord(x : number, y : number) : number {
        let x1 = x * this.imageWidth;
        let y1 = y * this.imageHeight; 
        let pixel = this.GetHeight(x1, y1);
        return pixel*200;
    }
}