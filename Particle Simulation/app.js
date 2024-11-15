import {Vector2, Clock} from "../classes.js";

// canvas

let winSize = new Vector2;

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d");

function resizeCanvas() {
	winSize.x = canvas.width = window.innerWidth;
	winSize.y = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

resizeCanvas()

// particles

const gravity = 9.8;
const restitution = 0.95;

const particle_count = 100;
const particle_radius = 5;

const particles = [];

class particle {
	constructor(pos = new Vector2, vel = new Vector2) {
		this.pos = pos;
		this.vel = vel;

		particles.push(this);
	}

	draw() {
		ctx.drawCircle(this.pos, particle_radius);
	}
}

for (let i = 0; i < particle_count; i++) {
	const pos = winSize.randomized;

	new particle(pos);
}

// draw

const clock = new Clock();

setInterval(() => {
	const dt = clock.tick();

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	// simulate

	particles.forEach(p1 => {
		p1.vel.y += gravity;

		// collisions

		particles.forEach(p2 => {
			if (p1 === p2) return;

			const away = p1.pos.sub(p2.pos);
			const distance = away.magnitude;

			if (distance.between(0, particle_radius * 2)) {
				const normal = away.unit;
				const relativeVelocity = p1.vel.sub(p2.vel).dot(normal);

				if (relativeVelocity < 0) {
					const impulse = normal.mul(relativeVelocity * restitution);

					p1.vel = p1.vel.sub(impulse);
					p2.vel = p2.vel.add(impulse);

					// overlap

					const overlap = particle_radius * 2 - distance;
					const separation = normal.mul(overlap * 0.5);

					p1.pos = p1.pos.add(separation);
					p2.pos = p2.pos.sub(separation);
				}
			}
		})

		// update

		p1.pos = p1.pos.add(p1.vel.mul(dt));

		// keep in window

		const xyMin = particle_radius;
		const xMax = winSize.x - particle_radius;
		const yMax = winSize.y - particle_radius;

		if (!p1.pos.x.between(xyMin, xMax)) {p1.vel.x *= -restitution;}
		if (!p1.pos.y.between(xyMin, yMax)) {p1.vel.y *= -restitution;}

		p1.pos = p1.pos.clamp(xyMin, xMax, xyMin, yMax);

		p1.draw();
	});
}, 0);