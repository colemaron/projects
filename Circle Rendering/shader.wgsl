struct Particle {
	position: vec2<f32>,
	velocity: vec2<f32>,
	mass: f32,
};

@group(0) @binding(0) var<storage, read> particles: array<Particle>;

// Vertex Input and Output
struct VertexInput {
	@builtin(vertex_index) index: u32,
	@builtin(instance_index) instance: u32,
};

struct VertexOutput {
	@builtin(position) position: vec4<f32>,
	@location(0) local_space: vec2<f32>,
	@location(1) mass: f32,
};

var<private> VERTICES: array<vec2<f32>, 3> = array<vec2<f32>, 3>(
	vec2<f32>(-1.7321, -1.0),
	vec2<f32>(1.7321, -1.0),
	vec2<f32>(0.0, 2.0)
);

@vertex
fn vs_main(vertex: VertexInput) -> VertexOutput {
	var out: VertexOutput;

	let particle = particles[vertex.instance];

	out.local_space = VERTICES[vertex.index];
	out.mass = particle.mass;

	out.position = vec4<f32>(out.local_space * particle.mass + particle.position, 0.0, 1.0);

	return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
	if dot(in.local_space, in.local_space) > 1.0 {
		discard;
	}

	return vec4<f32>(1.0);
}
