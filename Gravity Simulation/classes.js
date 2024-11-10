class Vector2 {
	constructor(x = 0, y = x) {
		this._x = x;
		this._y = y;
	}

	// components

	set x(value) {this._x = value;}
	set y(value) {this._y = value;}
	
	get x() {return this._x;}
	get y() {return this._y;}

	// operations

	add(vec) {return new Vector2(this._x + vec._x, this._y + vec._y);}
	sub(vec) {return new Vector2(this._x - vec._x, this._y - vec._y);}

	mul(int) {return new Vector2(this._x * int, this._y * int);}
	div(int) {return new Vector2(this._x / int, this._y / int);}

	// attritutes

	get magnitude() {
		return Math.sqrt(this._x ** 2 + this._y ** 2);
	}

	get unit() {
		return this.div(this.magnitude);
	}

	get randomComponent() {
		return Math.random() * (this.max - this.min) + this.min;
	}

	get min() {return Math.min(this._x, this._y);}
	get max() {return Math.max(this._x, this._y);}

	// methods

	dot(vec) {
		return this._x * vec._x + this._y * vec._y;
	}

	rotate(rad) {
		return new Vector2(
			this._x * Math.cos(rad) - this._y * Math.sin(rad),
			this._x * Math.sin(rad) + this._y * Math.cos(rad)
		)
	}
}

class Clock {
	constructor() {
		this.last_called = window.performance.now() / 1000;
		this.elapsed = 0;
		this.dt = 0;
	}

	tick() {
		const now = window.performance.now() / 1000;

		this.dt = (now - this.last_called);
		this.last_called = now;
		this.elapsed = now;

		return this.dt;
	}
}

const MyMath = {
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },

	roundDigits: function(n, digits) {
		const power = 10 ** digits;

		return Math.round(n * power) / power
	},

	round: function(n, multiple) {
		return Math.ceil(n / multiple) * multiple;
	},

	roundExponential: function(n, threshold, digits) {
		const length = n.toString().length

		if (length > threshold) {
			return n.toExponential(digits);
		} else {
			return MyMath.roundDigits(n, digits);
		}
	}
};

export {Vector2, Clock, MyMath};