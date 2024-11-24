import { Utils } from "./utils.js"

// get GPU

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// constants

const G = 0.000002;
const particleCount = 10000;
// needs to be multiple of 24 so cant be 5

const particleEntries = 6; // posX | posY | velX | velY | mass | UNUSED PLACEHOLDER
const f32Bytes = 4;

// configure canvas

const format = navigator.gpu.getPreferredCanvasFormat()
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("webgpu");

ctx.configure({
	device,
	format,
	alphaMode: "opaque",
})

// create particles

const particleArray = new Float32Array(particleCount * particleEntries);

for (let i = 0; i < particleCount; i++) {
	const index = i * particleEntries;

	// position

	const r = Math.random();
	const theta = 2 * Math.PI * Math.random();

	const x = r * Math.cos(theta);
	const y = r * Math.sin(theta);

	particleArray[index + 0] = x;
	particleArray[index + 1] = y;

	// velocity

	const speed = Math.sqrt(G * r) * 6;

	particleArray[index + 2] = -y * speed / r;
	particleArray[index + 3] = x * speed / r;

	// mass

	particleArray[index + 4] = (Math.random() + 1) / 25;

	// UNUSED PLACEHOLDER

	particleArray[index + 5] = 0;
}

// create particle buffer

const particleBuffer = device.createBuffer({
	size: particleArray.byteLength,
	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
})

device.queue.writeBuffer(particleBuffer, 0, particleArray);

// create uniform buffer

// ratio | scale | G

const uniformBuffer = device.createBuffer({
	size: 3 * f32Bytes,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

// create compute pipeline

const computePipeline = device.createComputePipeline({
	layout: "auto",
	compute: {
		module: await Utils.getShaderModule(device, "compute"),
		entryPoint: "main",
	},
})

// compute bind group

const computeBindGroup = device.createBindGroup({
	layout: computePipeline.getBindGroupLayout(0),
	entries: [
		{ binding: 0, resource: { buffer: particleBuffer } },
		{ binding: 1, resource: { buffer: uniformBuffer } },
	],
})

// create render pipeline

const renderPipeline = device.createRenderPipeline({
	layout: "auto",
	vertex: {
		module: await Utils.getShaderModule(device, "vertex"),
		entryPoint: "main",
	},
	fragment: {
		module: await Utils.getShaderModule(device, "fragment"),
		entryPoint: "main",
		targets: [{ format }],
	},
});

// render bind group

const renderBindGroup = device.createBindGroup({
	layout: renderPipeline.getBindGroupLayout(0),
	entries: [
		{ binding: 0, resource: { buffer: particleBuffer } },
		{ binding: 1, resource: { buffer: uniformBuffer } },
	],
})

// main loop

function main() {
	const commandEncoder = device.createCommandEncoder();

	// compute pass

	const computePass = commandEncoder.beginComputePass();

	computePass.setPipeline(computePipeline);
	computePass.setBindGroup(0, computeBindGroup);
	computePass.dispatchWorkgroups(Math.ceil(particleCount / 64));
	computePass.end();

	// render pass

	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: ctx.getCurrentTexture().createView(),
				clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				loadOp: "clear",
				storeOp: "store",
			},
		],
	})

	renderPass.setPipeline(renderPipeline);
	renderPass.setBindGroup(0, renderBindGroup)
	renderPass.draw(3, particleCount);
	renderPass.end();

	// send commands

	device.queue.submit([commandEncoder.finish()]);

	// loop

	window.requestAnimationFrame(main);
}

window.requestAnimationFrame(main);

// update uniforms

let scale = 1;

function updateUniforms() {
	const ratio = canvas.width / canvas.height;

	const uniformArray = new Float32Array([
		ratio,
		scale,
		G,
	])

	device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
}

// zooming

const zoomSpeed = 1.25;

document.addEventListener("wheel", event => {
	const delta = Math.sign(event.deltaY);

	delta > 0 ? scale *= zoomSpeed : scale /= zoomSpeed;

	updateUniforms();
})

// resize canvas

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	updateUniforms();
}

window.onresize = resize;

resize();