const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice()

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("webgpu");

ctx.configure({
	device,
	format: "bgra8unorm"
})

// resize canvas

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

// create triangle vertex data

const vertexData = new Float32Array([
	0, 1, 1,
	-1, -1, 1,
	1, -1, 1,
]);

// create vertex buffer to send to shader

const vertexBuffer = device.createBuffer({
	size: vertexData.byteLength,
	usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});

device.queue.writeBuffer(vertexBuffer, 0, vertexData);

// get external shader

const response = await fetch("shader.wgsl");
const code = await response.text();

const shaderModule = device.createShaderModule({code});

// create render pipeline
// define how data flows

const pipeline = device.createRenderPipeline({
	layout: "auto",

	vertex: {
		module: shaderModule,
		entryPoint: "vertMain",

		buffers: [{
			arrayStride: 12,
			attributes: [{
				shaderLocation: 0, 
				offset: 0, 
				format: "float32x2"
			}]
		}]
	},

	fragment: {
		module: shaderModule,
		entryPoint: "fragMain",
		targets: [{ format: "bgra8unorm" }]
	}
});

// define what to do for render pass

const commandEncoder = device.createCommandEncoder();

const passEncoder = commandEncoder.beginRenderPass({
	colorAttachments: [{
		view: ctx.getCurrentTexture().createView(),
		loadOp: "clear",
		clearValue: [0.0, 0.0, 0.0, 1.0],
		storeOp: "store"
	}]
});

// initialize pass and draw

passEncoder.setPipeline(pipeline);
passEncoder.setVertexBuffer(0, vertexBuffer);
passEncoder.draw(3);
passEncoder.end();

// send final data to GPU

const commandBuffer = commandEncoder.finish();
device.queue.submit([commandBuffer]);