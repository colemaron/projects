struct Uniforms {
	g: f32,

	scale: f32,
	size: vec2<f32>,
	offset: vec2<f32>,

	min: f32,
	max: f32,
}

struct Speeds {
	min: f32,
	max: f32,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) particle: vec4<f32>,
	@location(1) speed_ratio: f32,
};

@group(0) @binding(0) var<storage, read_write> particles: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
@group(0) @binding(2) var<storage, read_write> speeds: Speeds;

// compute shader

var<workgroup> local_min: f32;
var<workgroup> local_max: f32;

@compute @workgroup_size(128)
fn cs_main(
	@builtin(global_invocation_id) global_id : vec3<u32>,
) {
	// get ids

	let i: u32 = global_id.x;
	let particle_count: u32 = arrayLength(&particles);

	// set speeds

	if (i == 0u) {
		local_min = 3e38;
		local_max = 0.0;
	}

	// calculate particle velocities

	if (i < particle_count) {
		let p1 = particles[i];

		for (var j: u32 = 0u; j < particle_count; j++) {
			if (i == j) { continue; }

			let v: vec2<f32> = particles[j].xy - particles[i].xy;
			let d: f32 = max(dot(v, v), 0.05);
		
			let m: f32 = uniforms.g / d;

			let force: vec2<f32> = normalize(v) * m;

			particles[i] += vec4<f32>(0.0, 0.0, force);
			particles[j] -= vec4<f32>(0.0, 0.0, force);
		}

		// update particle

		particles[i] += vec4<f32>(particles[i].zw / 1e11, 0.0, 0.0);

		// update speeds

		let speed: f32 = dot(particles[i].zw, particles[i].zw);

		local_min = min(local_min, speed);
		local_max = max(local_max, speed);
	}

	workgroupBarrier();

	if (i == particle_count) {
		speeds.min = local_min;
		speeds.max = local_max;
	}
}

// vertex shader

@vertex
fn vs_main(@location(0) particle: vec4<f32>) -> VertexOutput {
	var out: VertexOutput;

	// get position

	let screen_ratio = uniforms.size.x / uniforms.size.y;
	let position: vec2<f32> = vec2<f32>(particle.x / screen_ratio, particle.y);

	out.position = vec4<f32>(position + uniforms.offset, 0.0, uniforms.scale);

	// send data

	let speed: f32 = dot(particle.zw, particle.zw);
	let speed_ratio = 1 - (speed - uniforms.min) / (uniforms.max - uniforms.min);

	out.speed_ratio = speed_ratio;
	out.particle = particle;

	return out;
}

// fragment shader

@fragment
fn fs_main(@location(0) particle: vec4<f32>, @location(1) speed_ratio: f32) -> @location(0) vec4<f32> {
	return vec4<f32>(1.0, speed_ratio, 0, 0.0);
}