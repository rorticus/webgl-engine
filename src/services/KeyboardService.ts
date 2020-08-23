export enum KeyboardKey {
	ArrowLeft = "ArrowLeft",
	ArrowRight = "ArrowRight",
	ArrowUp = "ArrowUp",
	ArrowDown = "ArrowDown",
	Space = "Space",
}

export function isKeyboardKey(k: string): k is KeyboardKey {
	if (
		[
			KeyboardKey.ArrowUp,
			KeyboardKey.ArrowDown,
			KeyboardKey.ArrowLeft,
			KeyboardKey.ArrowRight,
			KeyboardKey.Space,
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
	};

	press: { [key in KeyboardKey]: boolean } = {
		ArrowUp: false,
		ArrowDown: false,
		ArrowLeft: false,
		ArrowRight: false,
		Space: false,
	};

	constructor() {
		document.body.addEventListener("keydown", (event) => {
			if (isKeyboardKey(event.code)) {
				this.down[event.code] = true;
			}
		});

		document.body.addEventListener("keyup", (event) => {
			if (isKeyboardKey(event.code)) {
				this.press[event.code] = true;
				this.down[event.code] = false;
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
