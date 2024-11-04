// vectors

class Vector2 {
	constructor(x, y) {
		this.x = x;
		this.y = y || x;
	}

	// vector2 operations

	magnitude() {
		return Math.sqrt(this.x ** 2 + this.y ** 2)
	}

	normalize() {
		return this.div(this.magnitude());
	}

	clamp(max) {
		// if magnitude exceeds max, return clamped, else return same
		return this.magnitude() > max ? this.normalize().mul(max) : this;
	}

	// operations

	add(vec) {
		return new Vector2(this.x + vec.x, this.y + vec.y);
	}

	sub(vec) {
		return new Vector2(this.x - vec.x, this.y - vec.y);
	}

	mul(int) {
		return new Vector2(this.x * int, this.y * int);
	}

	div(int) {
		if (int === 0) throw new Error("Division by zero");

		return new Vector2(this.x / int, this.y / int);
	}
}

// canvas

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");