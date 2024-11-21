let shaderPath = "";

const Utils = {
	setShaderPath: function(path) {
		shaderPath = path;
	},

	getShaderCode: async function(name) {
		return await fetch(`${shaderPath}/${name}.wgsl`).then(result => result.text());
	},
}

export { Utils };