import { Utils } from "./utils.js"

// get GPU

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

// initialize

Utils.setShaderPath("./shaders");

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
	primitive: {
		topology: "triangle-list",
	},
})

// render

function update() {
	const commandEncoder = device.createCommandEncoder();

	// create render pass

	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: ctx.getCurrentTexture().createView(),
				clearValue: { r: 0, g: 0, b: 0, a: 0 },
				loadOp: "clear",
				storeOp: "store",
			}
		]
	})

	renderPass.setPipeline(renderPipeline);
	renderPass.draw(3, 1, 0, 0);
	renderPass.end();

	// send instructions

	device.queue.submit([commandEncoder.finish()]);

	// loop

	window.requestAnimationFrame(update);
}

window.requestAnimationFrame(update);

// resize canvas

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();