import { GameComponentContext } from "../interfaces";
import { GameObject } from "../GameObject";
import { quat, vec3 } from "gl-matrix";
import {AnimationChannel} from "./AnimationChannel";

export class AnimationState {
	time: number = 0;
	channels: AnimationChannel[];

	update(context: GameComponentContext, gameObject: GameObject) {
		this.time += context.deltaInSeconds;
	}

	getTransformationsForTime(time: number) {
	}
}
