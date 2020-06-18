import { GameObject } from "../GameObject";

export abstract class AnimationChannel<T extends any = any> {
	keyframes: number[] = [];
	values: T[] = [];
	gameObject: GameObject;

	constructor(gameObject: GameObject, keyframes: number[], values: T[]) {
		this.gameObject = gameObject;
		this.keyframes = keyframes;
		this.values = values;
	}

	getBounds(time: number): [T, T, number] {
		for (let i = 1; i < this.keyframes.length; i++) {
			if (time < this.keyframes[i] && time > this.keyframes[i - 1]) {
				return [
					this.values[i - 1],
					this.values[i],
					(time - this.keyframes[i - 1]) /
						(this.keyframes[i] - this.keyframes[i - 1]),
				];
			}
		}

		return [this.values[0], this.values[1], 0];
	}

	getDuration() {
		return this.keyframes[this.keyframes.length - 1];
	}

	abstract getValue(time: number): T;
	abstract apply(value: T): void;
}
