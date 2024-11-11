// canvas

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d", {willReadFrequently: true});

// drawing

const draw = {
	circle: function(vec, r, outline = false, color = "white") {
		ctx.beginPath();
		ctx.arc(vec.x, vec.y, r, 0, 2 * Math.PI);
		ctx.lineWidth = 4;
	
		if (outline) {
			ctx.strokeStyle = color;
			ctx.stroke();
		} else {
			ctx.fillStyle = color;
			ctx.fill();
		}
	}
}

// update canvas size

function resizeCanvas() {
	const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	ctx.putImageData(image, 0, 0);
}

window.addEventListener('resize', resizeCanvas);

resizeCanvas()

// vectors

function clamp(n, nMin, nMax) {
	return Math.min(Math.max(n, nMin), nMax)
}

class Vector2 {
	constructor(x = 0, y = x) {
		this.x = x;
		this.y = y;
	}

	// vector2 operations

	magnitude() {
		return Math.sqrt(this.x ** 2 + this.y ** 2)
	}

	normalize() {
		return this.div(this.magnitude());
	}

	dot(vec) {
		return this.x * vec.x + this.y * vec.y;
	}

	clampComponents(xMin, xMax, yMin, yMax) {
		return new Vector2(clamp(this.x, xMin, xMax), clamp(this.y, yMin, yMax))
	}

	// operations

	add(vec) {
		return new Vector2(this.x + vec.x, this.y + vec.y);
	}

	sub(vec) {
		return new Vector2(this.x - vec.x, this.y - vec.y);
	}

	mult(int) {
		return new Vector2(this.x * int, this.y * int);
	}

	div(int) {
		if (int === 0) throw new Error("Division by zero");

		return new Vector2(this.x / int, this.y / int);
	}
}

// particles

const gravity = new Vector2(0, 9.8);
const restitution = 0.75;

const particle_count = 1000;
const particle_radius = 7;

grab_radius = 200;

class particle {
	constructor() {
		const theta = 2 * Math.PI * Math.random();
		const r = Math.min(canvas.width / 2, canvas.height / 2) * Math.sqrt(Math.random());

		const windowOffset = new Vector2(canvas.width / 2, canvas.height / 2)
		const final = new Vector2(r * Math.cos(theta), r * Math.sin(theta))

		this.pos = final.add(windowOffset);
		this.vel = new Vector2();
	}
}

const particles = Array.from({length: particle_count}, () => new particle());

// grab

let mousePos = new Vector2();
let mouseDown = false;
let ctrlDown = false;

window.onmousemove = (event) => {
	mousePos = new Vector2(event.x, event.y);
}

window.addEventListener("mousedown", (event) => {
	mousePos = new Vector2(event.x, event.y)
	mouseDown = true;
})

window.addEventListener("mouseup", () => {
	mouseDown = false;
})

window.onkeydown = (event) => {
	ctrlDown = event.ctrlKey;
}

window.onkeyup = (event) => {
	ctrlDown = event.ctrlKey;
}

// draw

let last_update = Date.now();

window.requestAnimationFrame(update)

function update() {
	// get dt

	const now = Date.now();
	const dt = (now - last_update) / 1000;
	last_update = now;

	// clear canvas

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	// simulate

	particles.forEach(particle => {
		let pos = particle.pos;
		let vel = particle.vel;

		vel = vel.add(gravity);

		// grab

		if (mouseDown) {
			const toward = mousePos.sub(pos);
			const distance = toward.magnitude();

			if (distance < grab_radius) {
				if (ctrlDown) {
					vel = vel.sub(toward);
				} else {
					vel = vel.add(toward);
				}
			}
		}

		// bounce off others

		particles.forEach(other => {
			if (other === particle) return;

			const away = pos.sub(other.pos);
			const distance = away.magnitude();

			// simulate

			if (distance > 0 && distance < particle_radius * 2) {
				const normal = away.normalize();
				const relVelNorm = vel.sub(other.vel).dot(normal);

				if (relVelNorm < 0) {
					const impulse = normal.mult(relVelNorm * restitution);

					vel = vel.sub(impulse);
					other.vel = other.vel.add(impulse);

					// fix overlap
					
					const overlap = particle_radius * 2 - distance;
					const correction = normal.mult(overlap / 2);

					pos = pos.add(correction);
					other.pos = other.pos.sub(correction);
				}
			}
		})

		// update

		pos = pos.add(vel.mult(dt));

		// keep in window

		const xyMin = particle_radius;
		const xMax = canvas.width - particle_radius;
		const yMax = canvas.height - particle_radius;

		pos = pos.clampComponents(xyMin, xMax, xyMin, yMax);

		if (pos.x <= xyMin || pos.x >= xMax) {
			vel = new Vector2(vel.x * -restitution, vel.y);
		}

		if (pos.y <= xyMin || pos.y >= yMax) {
			vel = new Vector2(vel.x, vel.y * -restitution);
		}

		// reasign variables

		particle.pos = pos;
		particle.vel = vel;

		draw.circle(particle.pos, particle_radius);
	});

	// grab - per frame

	if (mouseDown) {
		if (ctrlDown) {
			draw.circle(mousePos, grab_radius, true, "rgb(255, 0, 0)");
		} else {
			draw.circle(mousePos, grab_radius, true, "rgb(0, 255, 0)");
		}
	}

	window.requestAnimationFrame(update)
}