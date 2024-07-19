import * as THREE from 'three';
import { SceneEntity } from './SceneEntity';

export class LightSceneEntity extends SceneEntity {
    private directionalLight : THREE.Light;
    private ambientLight : THREE.Light;
    
    constructor(){
        super("Light");
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(10000, 10000, 0);

        this.ambientLight = new THREE.AmbientLight(0x404040);
    }

    Attach(): void {
        this.Engine.AddObject3DToScene(this.directionalLight);
        this.Engine.AddObject3DToScene(this.ambientLight);
    }

    Detach(): void {
        this.Engine.RemoveObject3DFromScene(this.directionalLight);
        this.Engine.RemoveObject3DFromScene(this.ambientLight);
    }

    Update(): void {
    }
}