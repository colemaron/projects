// structs

struct VertexInput {
	@builtin(vertex_index) index: u32,
	@builtin(instance_index) instance: u32,
}

struct VertexOutput {
	@builtin(position) position: vec4<f32>,
	@location(0) local_space: vec2<f32>,
	@location(1) mass: f32,
}

struct Particle {
	position: vec2<f32>,
	velocity: vec2<f32>,
	mass: f32,
}

struct Uniforms {
	ratio: f32,
	scale: f32,
	G: f32,
}

// buffer bindings

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

// constant verticies

var<private> VERTICES: array<vec2<f32>, 3> = array<vec2<f32>, 3>(
	vec2<f32>(-1.7321, -1.0),
	vec2<f32>(1.7321, -1.0),
	vec2<f32>(0.0, 2.0)
);

// vertex shader

@vertex
fn main(vertex: VertexInput) -> VertexOutput {
	var out: VertexOutput;

	// get and set particle vars

	let particle = particles[vertex.instance];

	out.local_space = VERTICES[vertex.index];
	out.mass = particle.mass;

	// create and send position

	let position = out.local_space * particle.mass * particle.mass + particle.position;

	out.position = vec4<f32>(position.x / uniforms.ratio, position.y, 0.0, uniforms.scale);

	return out;
}