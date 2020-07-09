import { AnimationState } from "./AnimationState";
import { GameComponentContext } from "../interfaces";
import { GameObject } from "../GameObject";

export interface AnimationStateTransition {
	to: string;
	duration: number;
	condition(
		context: GameComponentContext,
		gameObject: GameObject,
		playDuration: number,
		totalDuration: number
	): boolean;
}

export class AnimationStateMachine {
	states: Record<string, AnimationState> = {};
	initialState?: string;
	stateTransitions: Record<string, AnimationStateTransition[]> = {};

	private state?: string = undefined;
	private nextState?: string = undefined;
	private transitionDuration: number = 0;
	private transitionTime: number = 0;

	constructor() {}

	getState(name: string): AnimationState | undefined {
		return this.states[name];
	}

	registerState(name: string, state: AnimationState) {
		this.states[name] = state;
	}

	addTransition(
		from: string,
		to: string,
		condition: AnimationStateTransition["condition"],
		duration: number = 0
	) {
		if (!this.stateTransitions[from]) {
			this.stateTransitions[from] = [];
		}

		this.stateTransitions[from].push({
			to,
			duration,
			condition,
		});
	}

	update(context: GameComponentContext, gameObject: GameObject) {
		if (this.state !== undefined) {
			const currentState = this.states[this.state];

			if (currentState) {
				if (this.nextState !== undefined) {
					this.transitionTime += context.deltaInSeconds;
					if (this.transitionTime > this.transitionDuration) {
						this.state = this.nextState;
						this.nextState = undefined;
					} else {
						const t = Math.min(
							this.transitionTime / this.transitionDuration,
							1
						);

						currentState.update(context);

						this.states[this.nextState].update(context, t);
					}
				} else {
					currentState.update(context);

					const transitions = this.stateTransitions[this.state];

					if (transitions) {
						for (let i = 0; i < transitions.length; i++) {
							if (
								transitions[i].condition(
									context,
									gameObject,
									currentState.time,
									currentState.duration
								)
							) {
								this.transitionTo(transitions[i].to, transitions[i].duration);
								break;
							}
						}
					}
				}
			}
		} else if (this.nextState) {
			this.state = this.nextState;
			this.nextState = undefined;
			this.states[this.state].reset();
		} else {
			this.initialState && this.transitionTo(this.initialState, 0);
		}
	}

	transitionTo(state: string, duration: number) {
		this.nextState = state;
		this.states[state].reset();
		this.transitionDuration = duration;
		this.transitionTime = 0;
	}
}
