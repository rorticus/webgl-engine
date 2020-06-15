import { AnimationState } from "./AnimationState";
import { GameComponentContext } from "../interfaces";
import { GameObject } from "../GameObject";

export class AnimationStateMachine {
	states: Record<string, AnimationState> = {};
	state?: string = undefined;
	stateTransitions: Record<string, string> = {};

	constructor() {}

	registerState(
		name: string,
		state: AnimationState,
		from: string[] = [],
		to: string[] = []
	) {
		this.states[name] = state;

		from.forEach((fromState) => (this.stateTransitions[fromState] = name));
		to.forEach((toState) => (this.stateTransitions[name] = toState));
	}

	update(context: GameComponentContext, gameObject: GameObject) {
		if (this.state !== undefined) {
		    const currentState = this.states[this.state];

		    if(currentState) {
		        currentState.update(context, gameObject);

		        if(currentState.isFinished) {
		            this.state = null;
                }
            }
		}
	}
}
