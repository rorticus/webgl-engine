import { GameComponentContext } from "../interfaces";
import { AnimationChannel } from "./AnimationChannel";

export class AnimationState {
	time: number = 0;
	channels: AnimationChannel[] = [];

	update(context: GameComponentContext) {
		this.time += context.deltaInSeconds;

		this.channels.forEach((channel) => {
			const value = channel.getValue(this.time);
			channel.apply(value);
		});
	}
}
