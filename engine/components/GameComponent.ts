export interface GameComponent {
    readonly priority: number;

    update(deltaInSeconds: number): void;
}
