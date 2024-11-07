// canvas

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");

// drawing

const draw = {
	circle: function(vec, r) {
		ctx.beginPath();
		ctx.arc(vec.x, vec.y, r, 0, 2 * Math.PI);
		ctx.fillStyle = "white";
		ctx.fill();
	}
}

// update canvas size

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

resizeCanvas()

// vectors

function clamp(n, nMin, nMax) {
	return Math.min(Math.max(n, nMin), nMax)
}

function between(n, lower, upper) {
	return n > lower && n < upper;
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

	clamp(max) {
		// if magnitude exceeds max, return clamped, else return same
		return this.magnitude() > max ? this.normalize().mul(max) : this;
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

const targetFramerate = 60;

const gravity = new Vector2(0, 9.8);
const restitution = 0.9;

const particle_count = 1000;
const particle_radius = 10;

class particle {
	constructor() {
		const theta = 2 * Math.PI * Math.random();
		const r = Math.min(canvas.width / 2, canvas.height / 2) * Math.sqrt(Math.random());

		const windowOffset = new Vector2(canvas.width / 2, canvas.height / 2)

		this.pos = new Vector2(r * Math.cos(theta), r * Math.sin(theta)).add(windowOffset);
		this.vel = new Vector2();
	}
}

particles = Array.from({length: particle_count}, () => new particle);

// draw

const dt = 1 / targetFramerate;

setInterval(() => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	particles.forEach(particle => {
		let pos = particle.pos;
		let vel = particle.vel;

		vel = vel.add(gravity);

		// bounce off others

		particles.forEach(other => {
			if (other === particle) return;

			const away = pos.sub(other.pos);
			const distance = away.magnitude();

			if (between(distance, 0, particle_radius * 2)) {
				const normal = away.normalize();

				const relVel = vel.sub(other.vel);
				const relVelNorm = relVel.dot(normal);

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

		// keep in window

		const xyMin = particle_radius;
		const xMax = canvas.width - particle_radius;
		const yMax = canvas.height - particle_radius;

		if (pos.x < xyMin || pos.x > xMax) {
			vel = new Vector2(vel.x * -1, vel.y);
		}

		if (pos.y < xyMin || pos.y > yMax) {
			vel = new Vector2(vel.x, vel.y * -1);
		}

		// update

		pos = pos.clampComponents(xyMin, xMax, xyMin, yMax);
		pos = pos.add(vel.mult(dt));

		// reasign variables

		particle.pos = pos;
		particle.vel = vel;

		draw.circle(particle.pos, particle_radius);
	});
}, dt * 1000);