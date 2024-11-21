import { Utils } from "./utils.js"

// get GPU

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// constants

const G = 1;
const particleCount = 100;
const particleEntries = 6; // posX | posY | velX | velY | mass | UNUSED PLACEHOLDER
// needs to be multiple of 24 so cant be 5

const f32Bytes = 4;

// initialize

Utils.setShaderPath("../shaders");

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

	particleArray[index + 0] = (Math.random() - 0.5) * 2;
	particleArray[index + 1] = (Math.random() - 0.5) * 2;

	// velocity

	particleArray[index + 2] = 0;
	particleArray[index + 3] = 0;

	// mass

	particleArray[index + 4] = (2 * Math.random() + 1) / 100;

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

// ratio | G

const uniformBuffer = device.createBuffer({
	size: 2 * f32Bytes,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

// create compute pipeline

const computeModule = await Utils.getShaderCode("compute");

const computePipeline = device.createComputePipeline({
	layout: "auto",
	compute: {
		module: device.createShaderModule({ code: computeModule }),
		entryPoint: "main",
	}
})

// compute bind group

const computeBindGroup = device.createBindGroup({
	layout: computePipeline.getBindGroupLayout(0),
	entries: [
		{
			binding: 0,
			resource: {
				buffer: particleBuffer,
			}
		},
		{
			binding: 1,
			resource: {
				buffer: uniformBuffer,
			}
		},
	]
})

// create render pipeline

const vertexModule = await Utils.getShaderCode("vertex");
const fragmentModule = await Utils.getShaderCode("fragment");

const renderPipeline = device.createRenderPipeline({
	layout: "auto",
	vertex: {
		module: device.createShaderModule({ code: vertexModule }),
		entryPoint: "main",
	},
	fragment: {
		module: device.createShaderModule({ code: fragmentModule }),
		entryPoint: "main",
		targets: [{ format }],
	},
});

// render bind group

const renderBindGroup = device.createBindGroup({
	layout: renderPipeline.getBindGroupLayout(0),
	entries: [
		{
			binding: 0,
			resource: {
				buffer: particleBuffer,
			}
		},
		{
			binding: 1,
			resource: {
				buffer: uniformBuffer,
			}
		},
	]
})

// main loop

function main() {
	const commandEncoder = device.createCommandEncoder();

	// compute pass

	const computePass = commandEncoder.beginComputePass();

	computePass.setPipeline(computePipeline);
	computePass.setBindGroup(0, computeBindGroup);
	computePass.dispatch(Math.ceil(particleCount / 64));
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

function updateUniforms() {
	const uniformArray = new Float32Array([
		canvas.width / canvas.height, // ratio
	])

	device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
}

// resize canvas

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	updateUniforms();
}

window.onresize = resize;

resize();