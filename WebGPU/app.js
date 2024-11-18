const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// set up canvas

const format = navigator.gpu.getPreferredCanvasFormat()
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("webgpu");

ctx.configure({
	device,
	format,
	alphaMode: "opaque",
})

// constants

const zoomSpeed = 1.1;

const particleCount = 10000;
const particleComponents = 4;
const g = 100;

const f32Bytes = 4;

// create particles

const particleArray = new Float32Array(particleCount * particleComponents);

for (let i = 0; i < particleCount; i++) {
	const index = i * particleComponents;

	// get position

	const r = Math.random();
	const theta = 2 * Math.PI * Math.random();

	const x = r * Math.cos(theta);
	const y = r * Math.sin(theta);

	// get velocity

	const speed = Math.sqrt(g / r) * 3.7e7;

	// apply values

	particleArray[index + 0] = x;
	particleArray[index + 1] = y;

	particleArray[index + 2] = -y * speed;
	particleArray[index + 3] = x * speed;
}

// create particle buffer

const particleBuffer = device.createBuffer({
	size: particleArray.byteLength,
	usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
})

device.queue.writeBuffer(particleBuffer, 0, particleArray);

// create speeds buffer

// min | max

const speedArguments = 2;

const speedsBuffer = device.createBuffer({
	size: speedArguments * f32Bytes,
	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
})

// create uniform buffer

// g | scale | size x | size y | offset x | offset y | min | max

const uniformArguments = 6 + speedArguments;

const uniformBuffer = device.createBuffer({
	size: uniformArguments * f32Bytes,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

// canvas variables

let scale = 1;

let offsetX = 0;
let offsetY = 0;

// update uniforms

function updateUniforms() {
	const uniformData = new Float32Array([g, scale, canvas.width, canvas.height, offsetX, offsetY]);
	
	device.queue.writeBuffer(uniformBuffer, 0, uniformData);
}

// zoom input

document.addEventListener("wheel", (event) => {
	if (Math.sign(event.deltaY) > 0) {
		scale *= zoomSpeed;
	} else {
		scale /= zoomSpeed;
	}

	updateUniforms();

	event.preventDefault();
}, { passive: false });

// resize update

function resizeCanvas () {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	updateUniforms();
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

// update panning

let lastX = 0;
let lastY = 0;

document.addEventListener("mousemove", (event) => {
	const dx = event.clientX - lastX;
	const dy = event.clientY - lastY;

	lastX = event.clientX;
	lastY = event.clientY;

	if (event.buttons & 1) {
		offsetX += dx / canvas.width * 2 * scale;
		offsetY -= dy / canvas.height * 2 * scale;
	}

	updateUniforms();
})

// create render pipeline

const code = await fetch(`../shader.wgsl`).then(result => result.text());
const shader = device.createShaderModule({ code });

const renderBindGroupLayout = device.createBindGroupLayout({
	entries: [
		{
			binding: 0,
			visibility: GPUShaderStage.VERTEX,
			buffer: { type: "read-only-storage" },
		},
		{
			binding: 1,
			visibility: GPUShaderStage.VERTEX,
			buffer: { type: "uniform" },
		},
	],
});

const renderPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [renderBindGroupLayout],
});

const renderPipeline = device.createRenderPipeline({
	layout: renderPipelineLayout,
	vertex: {
		module: shader,
		entryPoint: "vs_main",
		buffers: [
			{
				arrayStride: particleComponents * 4, // 4 bytes per f32 component
				attributes: [
					{
						format: "float32x4",
						offset: 0,
						shaderLocation: 0,
					}
				]
			}
		]
	},
	fragment: {
		module: shader,
		entryPoint: "fs_main",
		targets: [{ format }],
	},
	primitive: {
		topology: "point-list",
	},
})

const renderBindGroup = device.createBindGroup({
	layout: renderBindGroupLayout,
	entries: [
		{
			binding: 0,
			resource: {
				buffer: particleBuffer,
			},
		},
		{
			binding: 1,
			resource: {
				buffer: uniformBuffer,
			},
		}
	]
});

// create compute pipeline

const computePipeline = device.createComputePipeline({
	layout: "auto",
	compute: {
		module: shader,
		entryPoint: "cs_main",
	}
})

const computeBindGroup = device.createBindGroup({
	layout: computePipeline.getBindGroupLayout(0),
	entries: [
		{
			binding: 0,
			resource: {
				buffer: particleBuffer,
			},
		},
		{
			binding: 1,
			resource: {
				buffer: uniformBuffer,
			}
		},
		{
			binding: 2,
			resource: {
				buffer: speedsBuffer,
			}
		}
	]
})

// main loop

function main() {
	const commandEncoder = device.createCommandEncoder();

	const computePass = commandEncoder.beginComputePass();
	computePass.setPipeline(computePipeline);
	computePass.setBindGroup(0, computeBindGroup);
	computePass.dispatchWorkgroups(Math.ceil(particleCount / 64));
	computePass.end();

	const dataOffset = (uniformArguments - speedArguments) * f32Bytes;
	const dataSize = speedArguments * f32Bytes

	commandEncoder.copyBufferToBuffer(speedsBuffer, 0, uniformBuffer, dataOffset, dataSize);

	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: ctx.getCurrentTexture().createView(),
				clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				loadOp: "clear",
				storeOp: "store",
			},
		],
	});

	renderPass.setPipeline(renderPipeline);
	renderPass.setBindGroup(0, renderBindGroup);
	renderPass.setVertexBuffer(0, particleBuffer);
	renderPass.draw(particleArray.length / particleComponents);
	renderPass.end();

	device.queue.submit([commandEncoder.finish()]);

	window.requestAnimationFrame(main);
}

window.requestAnimationFrame(main);