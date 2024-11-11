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
	div(int) {
		if (int === 0) {int = 0.00001};
		return new Vector2(this._x / int, this._y / int);
	}

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

CanvasRenderingContext2D.prototype.drawCircle = function(pos, radius, color = "white") {
	this.beginPath();
	this.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
	this.fillStyle = color;
	this.fill();
}

CanvasRenderingContext2D.prototype.drawLine = function(from, to, width, color = "white") {
	this.beginPath()
	this.moveTo(from.x, from.y);
	this.lineTo(to.x, to.y);
	this.lineWidth = width;
	this.strokeStyle = color;
	this.stroke();
}

CanvasRenderingContext2D.prototype.drawArrow = function(from, to, width, color = "white") {
	this.drawLine(from, to, width, color);

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
	const size = width * 10;

    this.beginPath();
    this.moveTo(to.x, to.y);

    this.lineTo(
        to.x - size * Math.cos(angle - 0.4),
        to.y - size * Math.sin(angle - 0.4)
    );

    this.lineTo(
        to.x - size * Math.cos(angle + 0.4),
        to.y - size * Math.sin(angle + 0.4)
    );

    this.lineTo(to.x, to.y);
    this.closePath();

    this.fillStyle = color;
    this.fill();
}

const MyMath = {
    random: (min, max) => Math.random() * (max - min) + min,

	round: (n, multiple) => Math.ceil(n / multiple) * multiple,
};

export {Vector2, MyMath};