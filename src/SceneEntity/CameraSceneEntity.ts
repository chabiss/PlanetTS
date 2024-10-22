import { SceneEntity } from './SceneEntity';
import { GraphicEngine } from '../GraphicEngine';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';

export class CameraSceneEntity extends SceneEntity {
    private flyControls!: FlyControls;

    private updateSpeed: number = 0.1;
    private movementSpeed: number = 10;
    private enabled: boolean = true;

    constructor(){
        super("Camera");
    }    

    Attach(): void {
        this.flyControls = new FlyControls(this.Engine.Camera, this.Engine.DomElement);
        this.flyControls.movementSpeed = 10;
        this.flyControls.rollSpeed = Math.PI / 48;
        this.flyControls.dragToLook = true;
    }

    Detach(): void {

    }

    Update(): void {
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(GraphicEngine.Keys.SPACE)) {
            this.enabled = !this.enabled;
            this.flyControls.enabled = this.enabled;
        }

        if (this.IsKeyLatched(GraphicEngine.Keys.KEY_2)) {
            this.movementSpeed += 5;
            this.flyControls.movementSpeed = this.movementSpeed;
        }

        if (this.IsKeyLatched(GraphicEngine.Keys.KEY_1)) {
            this.movementSpeed -= 5;
            this.flyControls.movementSpeed = this.movementSpeed;
        }

        this.flyControls.update(this.updateSpeed);
    } 
}