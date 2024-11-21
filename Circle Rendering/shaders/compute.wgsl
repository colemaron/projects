// structs

struct Particle {
	position: vec2<f32>,
	velocity: vec2<f32>,
	mass: f32,
}

struct Uniforms {
	ratio: f32,
	G: f32,
}

// binding buffer INS

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

// compute shader

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
	let idx = global_id.x;
	

}