export enum KeyboardKey {
	ArrowLeft = "ArrowLeft",
	ArrowRight = "ArrowRight",
	ArrowUp = "ArrowUp",
	ArrowDown = "ArrowDown",
	Space = "Space",
	A = "KeyA",
	W = "KeyW",
	S = "KeyS",
	D = "KeyD",
}

export function isKeyboardKey(k: string): k is KeyboardKey {
	if (
		[
			KeyboardKey.ArrowUp,
			KeyboardKey.ArrowDown,
			KeyboardKey.ArrowLeft,
			KeyboardKey.ArrowRight,
			KeyboardKey.Space,
			KeyboardKey.A,
			KeyboardKey.W,
			KeyboardKey.S,
			KeyboardKey.D,
		].indexOf(k as KeyboardKey) !== -1
	) {
		return true;
	}

	return false;
}

export class KeyboardService {
	down: { [key in KeyboardKey]: boolean } = {
		ArrowUp: false,
		ArrowDown: false,
		ArrowLeft: false,
		ArrowRight: false,
		Space: false,
		KeyW: false,
		KeyA: false,
		KeyS: false,
		KeyD: false,
	};

	press: { [key in KeyboardKey]: boolean } = {
		ArrowUp: false,
		ArrowDown: false,
		ArrowLeft: false,
		ArrowRight: false,
		Space: false,
		KeyW: false,
		KeyA: false,
		KeyS: false,
		KeyD: false,
	};

	constructor() {
		document.body.addEventListener("keydown", (event) => {
			if (isKeyboardKey(event.code)) {
				this.down[event.code] = true;

				event.preventDefault();
				event.stopPropagation();
			}
		});

		document.body.addEventListener("keyup", (event) => {
			if (isKeyboardKey(event.code)) {
				this.press[event.code] = true;
				this.down[event.code] = false;

				event.preventDefault();
				event.stopPropagation();
			}
		});
	}

	clearPressState() {
		Object.keys(this.press).forEach((key) => {
			this.press[key as KeyboardKey] = false;
		});
	}

	pressed(k: KeyboardKey) {
		return this.press[k];
	}
}
