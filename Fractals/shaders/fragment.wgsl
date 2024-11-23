@fragment
fn main(@builtin(frag_coord) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
	return vec4<f32>(fragCoord.x, fragCoord.y, 0.0, 1.0);
}