const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// constants

const particleCount = 2;
const particleEntries = 6; // idk why this works at 6 but not 5 like how it should be ???????????????
// posX | posY | velX | velY | mass 

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

	particleArray[index + 0] = (Math.random() - 0.5) * 2;
	particleArray[index + 1] = (Math.random() - 0.5) * 2;

	// velocity

	particleArray[index + 2] = 0;
	particleArray[index + 3] = 0;

	// mass

	particleArray[index + 4] = (2 * Math.random() + 1) / 100;
}

// create particle buffer

const particleBuffer = device.createBuffer({
	size: particleArray.byteLength,
	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
})

device.queue.writeBuffer(particleBuffer, 0, particleArray);

// create render pipeline

const code = await fetch(`../shader.wgsl`).then(result => result.text());
const shader = device.createShaderModule({ code });

const renderPipeline = device.createRenderPipeline({
	layout: "auto",
	vertex: {
		module: shader,
		entryPoint: "vs_main",
	},
	fragment: {
		module: shader,
		entryPoint: "fs_main",
		targets: [{ format }],
	},
});

const particleBindGroup = device.createBindGroup({
	layout: renderPipeline.getBindGroupLayout(0),
	entries: [
		{
			binding: 0,
			resource: {
				buffer: particleBuffer,
			}
		}
	]
})

const commandEncoder = device.createCommandEncoder();

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
renderPass.setBindGroup(0, particleBindGroup)
renderPass.draw(3, particleCount);
renderPass.end();

device.queue.submit([commandEncoder.finish()]);