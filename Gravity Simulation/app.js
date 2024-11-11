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

const particleCount = document.getElementById("particles");
const timestep = document.getElementById("timestep");
const mass = document.getElementById("mass");

// draw

const textSize = 12;
const padding = 5;

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

let particles = [];

class particle {
	constructor(pos = new Vector2, vel = new Vector2, mass = 1) {
		this.mass = mass;
		this.pos = pos;
		this.vel = vel;

		particles.push(this);

		particleCount.textContent = parseInt(particleCount.textContent) + 1;
	}
}

// translated mouse coords

function getMouseCoords(event) {
	const transform = ctx.getTransform().invertSelf();

	return new Vector2(
		transform.a * event.clientX + transform.c * event.clientY + transform.e,
		transform.b * event.clientX + transform.d * event.clientY + transform.f
	)
}

// canvas and particle controls

let mousePos = new Vector2;
let mouseDown = false;

canvas.addEventListener("mousedown", (event) => {
	mouseDown = true;
})

window.addEventListener("mouseup", (event) => {
	mouseDown = false;
})

window.addEventListener("mousemove", (event) => {
	mousePos = getMouseCoords(event);

	if (mouseDown) {
		const transform = ctx.getTransform();

		ctx.translate(event.movementX / transform.a, event.movementY / transform.d);
	}
})

let dragStart = new Vector2;
let dragging = false;

window.addEventListener("keydown", (event) => {
	if (event.key === "e" && !dragging) {
		dragging = true;
		dragStart = mousePos;
	}
})

window.addEventListener("keyup", (event) => {
	if (event.key === "e") {
		new particle(mousePos, dragStart.sub(mousePos).div(timestep.value * 100), mass.value);
		
		dragging = false;
	}
})

// hover value

const hoverValue = document.getElementById("hover-value");

canvas.addEventListener("mousemove", (event) => {
	hoverValue.style.left = event.clientX + "px";
	hoverValue.style.top = event.clientY + "px";

    const transformed = getMouseCoords(event);

	hoverValue.textContent = "(" + transformed.x.toPrecision(3) + ", " + transformed.y.toPrecision(3) + ")";
})

// zooming

const zoomSpeed = 1.1;
let scale = 1;

canvas.addEventListener("wheel", (event) => {
	const multiplier = event.shiftKey ? 2 : 1;

    const scroll = Math.sign(event.deltaY);
    const factor = scroll < 1 ? zoomSpeed * multiplier : 1 / zoomSpeed / multiplier;

	const transform = ctx.getTransform()

    const mousePos = new Vector2(event.clientX, event.clientY);
    const newScale = scale * factor;

	const mouseCanvas = new Vector2(mousePos.x - transform.e, mousePos.y - transform.f).div(scale * multiplier);
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
	let step = Math.pow(base, Math.round(logScale)) * 200;

	for (let y = MyMath.round(top, step); y < MyMath.round(bottom, step); y += step) {
		drawLine(new Vector2(left, y), new Vector2(right, y), 1, "rgba(255, 255, 255, 0.25)");
		drawText(y === 0 ? 0 : y.toPrecision(3), padding, y * scale - padding);
	}

	for (let x = MyMath.round(left, step); x < MyMath.round(right, step); x += step) {
		drawLine(new Vector2(x, top), new Vector2(x, bottom), 1, "rgba(255, 255, 255, 0.25)");
		drawText(x === 0 ? 0 : x.toPrecision(3), x * scale + padding, -padding);
	}

	// draw sub minor axis

	step /= 5

	console.log("hi: " + Date.now());

	for (let y = MyMath.round(top, step); y < MyMath.round(bottom, step); y += step) {
		drawLine(new Vector2(left, y), new Vector2(right, y), 1, "rgba(255, 255, 255, 0.1)");
	}

	for (let x = MyMath.round(left, step); x < MyMath.round(right, step); x += step) {
		drawLine(new Vector2(x, top), new Vector2(x, bottom), 1, "rgba(255, 255, 255, 0.1)");
	}

	// draw major axis

	drawLine(new Vector2(left, 0), new Vector2(right, 0), 1);
	drawLine(new Vector2(0, top), new Vector2(0, bottom), 1);

	// update particles

	let positions = [];

	particles.forEach(pi => {
		positions.push(pi.pos);

		// update with gravity
		
		particles.forEach(pj => {
			if (pi === pj) return;

			const direction = pj.pos.sub(pi.pos);
			const distance = Math.max(direction.magnitude, pi.mass + pj.mass);
			const magnitude = pi.mass * pj.mass / distance ** 2;

			const force = direction.unit.mul(magnitude * timestep.value);

			pi.vel = pi.vel.add(force.mul(pj.mass))
			pj.vel = pj.vel.add(force.mul(-pi.mass))
		})

		// update position

		pi.pos = pi.pos.add(pi.vel.mul(timestep.value));

		// draw particle

		ctx.drawCircle(pi.pos, pi.mass);
		ctx.drawArrow(pi.pos, pi.pos.add(pi.vel.mul(100)), 1 / scale, "red");
	})
}, 0)