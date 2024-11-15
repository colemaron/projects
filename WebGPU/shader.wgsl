@vertex
fn vertMain(@location(0) pos: vec3<f32>) -> @builtin(position) vec4<f32> {
	return vec4<f32>(pos, 1.0);
}

@fragment
fn fragMain() -> @location(0) vec4<f32> {
	return vec4<f32>(1.0, 0.3, 0.0, 1.0);
}