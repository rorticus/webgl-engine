import {GameObject} from "../GameObject";

export interface GameComponent {
    readonly priority: number;

    update(gameObject: GameObject, deltaInSeconds: number): void;
}
