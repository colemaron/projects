var<private> VERTICES: array<vec2<f32>, 3> = array<vec2<f32>, 3>(
	vec2<f32>(-1.0, -1.0),
	vec2<f32>(3.0, -1.0),
	vec2<f32>(-1.0, 3.0)
);

@vertex
fn main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
	return vec4<f32>(VERTICES[index], 0.0, 1.0);
}