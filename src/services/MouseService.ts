export class MouseService {
	leftMouseDown = false;
	pointerX = 0;
	pointerY = 0;

	constructor(canvas: HTMLCanvasElement) {
		canvas.addEventListener("pointerdown", () => {
			this.leftMouseDown = true;
		});

		canvas.addEventListener("pointerup", () => {
			this.leftMouseDown = false;
		});

		canvas.addEventListener("pointercancel", () => {
			this.leftMouseDown = false;
		});

		canvas.addEventListener('pointermove', (event) => {
		    this.pointerX = event.clientX;
		    this.pointerY = event.clientY;
        });
	}
}
