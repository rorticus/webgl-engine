import {GameObject} from "./GameObject";

export class Engine {
    private _canvas: HTMLCanvasElement;
    private _gameObjects: GameObject[];
    private _paused: boolean;
    private _lastFrameTime: number;
    private _gdt: number;
    private _step: number;

    set fps(value: number) {
        this._step = 1 / value;
    }

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;

        this._gameObjects = [];
        this._paused = true;
        this._lastFrameTime = 0;
        this._gdt = 0;
        this.fps = 30;

        const frame = () => {
            const now = Date.now();
            const dt = Math.min(1, (now - this._lastFrameTime) / 1000);
            this._gdt += dt;

            while(this._gdt > this._step) {
                this._gdt -= this._step;
                this.update(this._step);
            }

            this.render();

            this._lastFrameTime = now;

            requestAnimationFrame(frame);
        };

        frame();
    }

    start() {
        this._paused = false;

        this._lastFrameTime = 0;
        this._gdt = 0;
    }

    pause() {
        this._paused = true;
    }

    update(deltaInSeconds: number) {
        if(this._paused) {
            return;
        }
    }

    addGameObject(go: GameObject) {
        this._gameObjects.push(go);
    }

    removeGameObject(go: GameObject) {
        const index = this._gameObjects.indexOf(go);

        if(index >= 0) {
            this._gameObjects.splice(index, 1);
        }
    }

    render() {
    }
}