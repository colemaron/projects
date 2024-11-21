// structs

struct VertexOutput {
	@builtin(position) position: vec4<f32>,
	@location(0) local_space: vec2<f32>,
	@location(1) mass: f32,
}

// fragment shader

@fragment
fn main(in: VertexOutput) -> @location(0) vec4<f32> {
	let ds: f32 = dot(in.local_space, in.local_space);

	if (ds > 1.0) {
		discard;
	}

	return vec4<f32>(1.0);
}