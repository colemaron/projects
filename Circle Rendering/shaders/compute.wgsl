// structs

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

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

// compute shader

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
	let i = global_id.x;
	let particle_count = arrayLength(&particles);

	if (i >= particle_count) { return; }

	var p1 = particles[i];

	for (var j: u32 = 0; j < particle_count; j++) {
		if (i == j) { continue; }

		var p2 = particles[j];

		let direction = p2.position - p1.position;
		let ds = dot(direction, direction);

		if (ds > 0.1) {
			let force = (uniforms.G * p1.mass * p2.mass) / ds;
			let acceleration = normalize(direction) * force;

			p1.velocity += acceleration;
			p2.velocity -= acceleration;
		}
	}

	p1.position += p1.velocity;

	particles[i] = p1;
}