import {Vector2, MyMath} from "./classes.js";

// update canvas size

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let winSize = new Vector2;

function updateCanvasSize() {
	const transform = ctx.getTransform();

	winSize.x = canvas.width = window.innerWidth;
	winSize.y = canvas.height = window.innerHeight;

	ctx.setTransform(transform);
}

updateCanvasSize()

window.addEventListener("resize", updateCanvasSize);
ctx.translate(winSize.x / 2, winSize.y / 2)

// inputs

const timestep = document.getElementById("timestep");

// draw

const textSize = 16;
const padding = 10;

function drawLine(from, to, width = 1, color = "white") {
	ctx.beginPath();
	ctx.lineWidth = width / scale;

	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);

	ctx.strokeStyle = color;
	ctx.stroke();
}

function drawText(text, x, y, color = "white") {
	ctx.font = textSize + "px Poppins";
	ctx.scale(1 / scale, 1 / scale);
	ctx.fillStyle = color;
	ctx.fillText(text, x, y);
	ctx.scale(scale, scale);
}

// particles

const particle_count = 500;
const particle_spread = winSize.min / 2;
const particle_mass_range = new Vector2(5, 10);

const minDistance = 100;

let particles = [];

class particle {
	constructor(pos = new Vector2, vel = new Vector2, mass = 1) {
		this.mass = mass;
		this.pos = pos;
		this.vel = vel;

		particles.push(this);
	}

	draw() {
		const speed = 255 / this.vel.magnitude * 10;

		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, this.mass, 0, Math.PI * 2);
		ctx.fillStyle = `rgb(${speed}, 0, ${255 - speed})`;
		ctx.fill();
	}
}

for (let i = 0; i < particle_count; i++) {
	const r = particle_spread * Math.sqrt(Math.random());
	const theta = 2 * Math.PI * Math.random();

	const pos = new Vector2(r * Math.cos(theta), r * Math.sin(theta));
	const vel = pos.rotate(Math.PI / 2.5).div(20);

	new particle(pos, vel, particle_mass_range.randomComponent);
}

new particle(new Vector2, new Vector2, 50);

// canvas and particle controls

let mouseDown = false;

canvas.addEventListener("mousedown", (event) => {
	mouseDown = true;
})

window.addEventListener("mouseup", (event) => {
	mouseDown = false;
})

window.addEventListener("mousemove", (event) => {
	if (mouseDown) {
		const transform = ctx.getTransform();

		ctx.translate(event.movementX / transform.a, event.movementY / transform.d);
	}
})

// hover value

const hoverValue = document.getElementById("hover-value");

canvas.addEventListener("mousemove", (event) => {
	hoverValue.style.left = event.clientX + "px";
	hoverValue.style.top = event.clientY + "px";

    const rect = canvas.getBoundingClientRect();
    const transform = ctx.getTransform().invertSelf();

    const transformedX = MyMath.roundDigits(transform.a * event.clientX + transform.c * event.clientY + transform.e, 1);
    const transformedY = MyMath.roundDigits(transform.b * event.clientX + transform.d * event.clientY + transform.f, 1);

	hoverValue.textContent = `(${transformedX}, ${transformedY})`;
})

// zooming

const zoomSpeed = 1.1
let scale = 1;

canvas.addEventListener("wheel", (event) => {
    const scroll = Math.sign(event.deltaY);
    const factor = scroll < 1 ? zoomSpeed : 1 / zoomSpeed;

	const transform = ctx.getTransform()

    const mousePos = new Vector2(event.clientX, event.clientY);
    const newScale = scale * factor;

	const mouseCanvas = new Vector2(mousePos.x - transform.e, mousePos.y - transform.f).div(scale);
	const translate = mousePos.sub(mouseCanvas.mul(newScale));

    ctx.setTransform(newScale, 0, 0, newScale, translate.x, translate.y);

    scale = newScale;
});

// main update function

setInterval(() => {
	// clear canvas

	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	// get canvas variables

	const transform = ctx.getTransform();

	const left = -transform.e / scale;
	const right = (winSize.x - transform.e) / scale;

	const top = -transform.f / scale;
	const bottom = (winSize.y - transform.f) / scale;

	// draw minor axis

	const base = 2;
	const logScale = Math.log(1 / scale) / Math.log(base);
	const step = Math.pow(base, Math.round(logScale)) * 200;

	for (let y = MyMath.round(top, step); y < MyMath.round(bottom, step); y += step) {
		drawLine(new Vector2(left, y), new Vector2(right, y), 0.5, "rgb(100, 100, 100)");
		drawText(MyMath.roundExponential(y, 5, 1), padding, y * scale - padding);
	}

	for (let x = MyMath.round(left, step); x < MyMath.round(right, step); x += step) {
		drawLine(new Vector2(x, top), new Vector2(x, bottom), 0.5, "rgb(100, 100, 100)");
		drawText(MyMath.roundExponential(x, 5, 1), x * scale + padding, -padding);
	}

	// draw major axis

	drawLine(new Vector2(left, 0), new Vector2(right, 0), 1);
	drawLine(new Vector2(0, top), new Vector2(0, bottom), 1);

	// update particles

	particles.forEach(pi => {
		// update with gravity
		
		particles.forEach(pj => {
			if (pi === pj) return;

			const direction = pj.pos.sub(pi.pos);
			const distance = Math.max(direction.magnitude, minDistance);
			const magnitude = pi.mass * pj.mass / distance ** 2;

			const force = direction.unit.mul(magnitude * timestep.value);

			pi.vel = pi.vel.add(force.mul(pj.mass))
			pj.vel = pj.vel.add(force.mul(-pi.mass))
		})

		// update position

		pi.pos = pi.pos.add(pi.vel.mul(timestep.value));

		// draw particle

		pi.draw();
	})
}, 0)