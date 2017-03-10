var vertex_shader_source =
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'attribute vec4 a_Normal;\n' + // Normal
	'uniform mat4 u_ModelMatrix;\n' +
	'uniform mat4 u_NormalMatrix;\n' +
	'uniform mat4 u_ViewMatrix;\n' +
	'uniform vec3 u_AmbientLight;\n' + // Ambient Light
	'uniform mat4 u_ProjMatrix;\n' +
	'uniform vec3 u_LightColor;\n' + // Light color
	'uniform vec3 u_LightPosition;\n' + // Light Position
	'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
	'varying vec4 v_Color;\n' +
	'uniform bool u_isLighting;\n' +
	'void main() {\n' +
	'  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
	'  if(u_isLighting)\n' +
	'  {\n' +
	// !!! Point Light Object
	// // calculate world coordinate of the vortex
	'     vec4 vertexPosition = u_ModelMatrix * a_Position; \n' +
	'     vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition)); \n' +

	// // //  make length of normal 1.0
	'     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +

	// // // dot product of light direction/ orientation of surface
	'     float nDotL = max(dot(lightDirection, normal), 0.0);\n' +

	// // // Calculate the color due to diffuse reflection
	'     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +

	// // calculate the colour due to ambient reflection
	'     vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
	// // add surface colors due to diffuse and ambient reflection
	'     v_Color = vec4(diffuse + ambient, a_Color.a); \n' +

	'  }\n' +
	'  else\n' +
	'  {\n' +
	'     v_Color = a_Color;\n' +
	'  }\n' +
	'}\n'; // Vertex shader program

var fragment_shader_source =
	'#ifdef GL_ES\n' +
	'precision mediump float;\n' +
	'#endif\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_FragColor = v_Color;\n' +
	'}\n'; // Fragment shader program

var matrices = {
	'model' : new Matrix4(),		// The model matrix
	'view' : new Matrix4(),			// The view matrix
	'projection' : new Matrix4(),	// The projection matrix
	'g_normal' : new Matrix4()		// Coordinate transformation matrix for normals
};

var car = {
	'enabled' : true,
	'position' : {
		'x' : 0,
		'z' : 0
	},
	'speed' : 1,
	'wheel' : {
		'angle' : 0,
		'step' : 0,
	},
	'front': {
		'rotation' : 0,
		'step': 1
	},
	'movestep' : 1,
	'anglestep' : 10
};

var plane = {
	'x' : 50,
	'z' : 50,
	'enabled': true
};

var camera = {
	'view' : {
		'x' : 0, // The rotation x angle (degrees)
		'y' : 0  // The rotation y angle (degrees)
	}
};

var u = { // storage locations of uniform attributes
	ModelMatrix : 0,
	ViewMatrix : 0,
	NormalMatrix : 0,
	ProjMatrix : 0,
	LightColour : 0, 
	LightDirection : 0
};

var settings = {
	bg_color : [0.2,1,0.2,0.7],
	light_color : [1,1,1],
	light_direction : [1,1,1],
	light_position : [0,1,0],
	ambient_light : [0.3, 0.5, 0.7]
};

// Retrieve <canvas> element
var canvas = document.getElementById('webgl');

// Get the rendering context for WebGL
var gl = getWebGLContext(canvas);

function initialise() {
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;}

	// Initialize shaders
	if (!initShaders(gl, vertex_shader_source, fragment_shader_source)) {
		console.log('Failed to intialize shaders.');
		return;}

	// deal with clear colour and depth buffers
	initialiseColors();

	// deal with storage locations of the uniform attributes
	initUniformAttributes();

	// check Status of items to see whether they have initiated.
	checkStatus(u.ModelMatrix, u.ViewMatrix, u.NormalMatrix,u.ProjMatrix, u.LightColor, u.LightDirection,u.isLighting);

	// Set the light color (white)
	gl.uniform3f(u.LightColor, settings.light_color[0], settings.light_color[1], settings.light_color[2]);

	// Set the light direction (in the world coordinate)
	var lightDirection = new Vector3(settings.light_direction);

	// Normalize the light direction
	lightDirection.normalize();
	gl.uniform3fv(u.LightDirection, lightDirection.elements);

	// Set the light direction (in the world coordinate)
	var lightPosition = new Vector3(settings.light_position);
	gl.uniform3fv(u.LightPosition, lightPosition.elements);

	// set up ambient light
	// Set the light direction (in the world coordinate)
	var AmbientLight = new Vector3(settings.ambient_light);

	// Normalize the light direction
	AmbientLight.normalize();
	gl.uniform3fv(u.AmbientLight, AmbientLight.elements);

	// Calculate the view matrix and the projection matrix

	  // calculate the view matrix and projection matrix
	  // matrices.view.setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
	  // angle (x), angle (y), zoom,  _____, _, rotation of camera, inv,


	  // sets of three (x,y,z)
	  // pos cam, pos along dierction you wanna look at, up axis,

	// angled position
	matrices.view.setLookAt(
		-45, 45, -45, 
		0,  -10, 0, 
		0, 	1, 	 0
	);

  	// matrices.view.setLookAt(20, 2, 10, -10, -15, 0, 0.0, 0.02, 0);

	// matrices.view.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);

	matrices.projection.setPerspective(40, canvas.width / canvas.height, 1, 120);

	// Pass the model, view, and projection matrix to the uniform variable respectively
	gl.uniformMatrix4fv(u.ViewMatrix, false, matrices.view.elements);
	gl.uniformMatrix4fv(u.ProjMatrix, false, matrices.projection.elements);

	// draw the first screen.
	draw(gl, u);

	// loop the drawing
	// gameLoop();
}

setInterval(function() {
	while (keys.length > 0){
		keyaction(keys.shift());
	}
	draw(gl, u);
}, 1);

var keys = [];

// deal with car movements
document.onkeydown = function(e){
	keys.push(e.keyCode);
};


var goodkeys = {
	'down' : 83,
	'right': 68,
	'up' : 87,
	'left' : 65
};

function keyaction(keycode) {

	if (keycode == goodkeys.up){
		car.speed = car.speed  + 1;
	}
	if (keycode == goodkeys.down){
		car.speed = car.speed  - 1;
	}
	if (keycode == goodkeys.right){
		car.front.rotation = (car.front.rotation + car.anglestep % 360);
	} 
	if (keycode == goodkeys.left){
		car.front.rotation = (car.front.rotation - car.anglestep % 360);
	}
	// change position of car
	car.position.x = car.position.x + Math.cos(deg2rad(car.front.rotation));
	car.position.z = car.position.z + Math.sin(deg2rad(car.front.rotation));
}

function initialiseColouredCubeVertexBuffer(gl, colours) {

	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3

	var cube = {
		'vertices': new Float32Array([ // Coordinates
			0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
			0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
			0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
			-0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
			-0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
			0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5 // v4-v7-v6-v5 back
		]),
		'colors': new Float32Array(72),
		'normals': new Float32Array([ // Normal
			0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
			1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
			0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
			-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
			0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
			0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
		]),
		'indices': new Uint8Array([
			0, 1, 2, 0, 2, 3, // front
			4, 5, 6, 4, 6, 7, // right
			8, 9, 10, 8, 10, 11, // up
			12, 13, 14, 12, 14, 15, // left
			16, 17, 18, 16, 18, 19, // down
			20, 21, 22, 20, 22, 23 // back
		])
	};

	// add colours to the vertex.
	for (i = 0; i < cube.colors.length; i = i + 3){
		cube.colors[i] = colours[0];
		cube.colors[i+1] = colours[1];
		cube.colors[i+2] = colours[2];
	}

	// Write the vertex property to buffers (coordinates, colors and normals)
	if (!initialiseArrayBuffer(gl, 'a_Position', cube.vertices, 3, gl.FLOAT)){
		return -1;
	}
	if (!initialiseArrayBuffer(gl, 'a_Color', cube.colors, 3, gl.FLOAT)) {
		return -1;
	}
	if (!initialiseArrayBuffer(gl, 'a_Normal', cube.normals, 3, gl.FLOAT)) {
		return -1;
	}

	// Write the indices to the buffer object
	var indexBuffer = gl.createBuffer();

	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

	return cube.indices.length;
}

function initialiseArrayBuffer(gl, attribute, data, num, type) {
	// Create a buffer object
	var buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return false;
	}
	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	// Assign the buffer object to the attribute variable
	var a_attribute = gl.getAttribLocation(gl.program, attribute);
	if (a_attribute < 0) {
		console.log('Failed to get the storage location of ' + attribute);
		return false;
	}
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_attribute);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return true;
}

// Array for storing a matrix
var g_matrixStack = [];

function pushMatrix(m) {
	// Store the specified matrix to the array
	var m2 = new Matrix4(m);
	g_matrixStack.push(m2);
}

function popMatrix() {
	// Retrieve the matrix from the array
	return g_matrixStack.pop();
}

function draw(gl, u) {

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u.ModelMatrix, false, matrices.model.elements);
	// apply lighting
	gl.uniform1i(u.isLighting, true);

	// Set the vertex coordinates and color (for the cube)
	matrices.model.setTranslate(0, 0, 0);
	var n = initialiseColouredCubeVertexBuffer(gl, [0.1,0.1,0.1]);

	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	if (plane.enabled){
		pushMatrix(matrices.model);
		matrices.model.translate(0, -0.5, 0); // Translation
		matrices.model.scale(plane.x,0,plane.z); // Scale
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();
	}

	if (car.enabled){
		// deal with default rotation

		matrices.model.setTranslate(car.position.x, 0, car.position.z); // Translation (No translation is supported here)
		// matrices.model.rotate(camera.view.y, 0, 1, 0); // Rotate along y axis
		// matrices.model.rotate(camera.view.x, 1, 0, 0); // Rotate along x axis
		matrices.model.rotate(car.front.rotation, 0.0, -1.0, 0.0); 
		matrices.model.translate(0, 0.5, 0); // Translation
		matrices.model.rotate(90, 0.0, 1.0, 0.0); 

		// set car base colour
		n = initialiseColouredCubeVertexBuffer(gl, [0.25,0.25,0.25]);

		// Model the car base
		pushMatrix(matrices.model);
		matrices.model.translate(0, 0, 0.2); // Translation
		matrices.model.scale(2.2, 1.2, 5); // Scale
		car.forward_vector = [matrices.g_normal.elements[12], -matrices.g_normal.elements[14]];
		// console.log("forward vector", car.forward_vector);
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();

		// set car top colour
		n = initialiseColouredCubeVertexBuffer(gl, [0.6,0.6,0.6]);

		// Model the car top
		pushMatrix(matrices.model);
		matrices.model.translate(0, 1, -0.5); // Translation
		matrices.model.scale(2.0, 1, 4); // Scale
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();

		// set door base colour
		n = initialiseColouredCubeVertexBuffer(gl, [0.5,0.8,0.4]);

		// Model the car door (left)
		pushMatrix(matrices.model);
		matrices.model.translate(1.1, 0.5, 0); // Translation
		matrices.model.scale(0.1, 1.1, 1); // Scale
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();

		// set car base colour
		n = initialiseColouredCubeVertexBuffer(gl, [0.55,0.25,0.25]);

		// Model the car door (right)
		pushMatrix(matrices.model);
		matrices.model.translate(-1.1, 0.5, 0); // Translation
		matrices.model.scale(0.1, 1.1, 1); // Scale
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();


		// set car base colour
		n = initialiseColouredCubeVertexBuffer(gl, [0.3,0.25,0.7]);

		//Model the car wheel (back left)
		pushMatrix(matrices.model);
		matrices.model.translate(-1.2, -0.5, -1.5); // Translation
		// matrices.model.rotate(car.front.rotation, 0.0, 1.0, 0.0); 
		matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		matrices.model.scale(0.2, 1, 1); // Scale
		var bf_normal = [matrices.g_normal.elements[0], matrices.g_normal.elements[2]];
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();

		//Model the car wheel (back right)
		pushMatrix(matrices.model);
		matrices.model.translate(1.2, -0.5, -1.5); // Translation
		matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		matrices.model.scale(0.2, 1, 1); // Scale
		var br_normal = [matrices.g_normal.elements[0], matrices.g_normal.elements[2]];
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();

		// set car base colour
		n = initialiseColouredCubeVertexBuffer(gl, [0.6,0.2,0.55]);

		// Model the car wheel (front left)
		pushMatrix(matrices.model);
		matrices.model.translate(1.2, -0.5, 1.5); // Translation
		matrices.model.rotate(car.front.rotation, 0.0, 1.0, 0.0); 
		matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		matrices.model.scale(0.2, 1, 1); // Scale
		var fl_normal = [matrices.g_normal.elements[0], matrices.g_normal.elements[2]];
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();

		//Model the car wheel (front right)
		pushMatrix(matrices.model);
		matrices.model.translate(-1.2, -0.5, 1.5); // Translation
		matrices.model.scale(0.2, 1, 1); // Scale
		matrices.model.rotate(car.front.rotation, 0.0, 1.0, 0.0); 
		matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		var fr_normal = [matrices.g_normal.elements[0], matrices.g_normal.elements[2]];
		drawbox(gl, u.ModelMatrix, u.NormalMatrix, n);
		matrices.model = popMatrix();
	}
}

function drawbox(gl, modelmatrix, normalmatrix, n) {
	pushMatrix(matrices.model);

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(modelmatrix, false, matrices.model.elements);

	// Calculate the normal transformation matrix and pass it to normalmatrix
	matrices.g_normal.setInverseOf(matrices.model);
	matrices.g_normal.transpose();
	gl.uniformMatrix4fv(normalmatrix, false, matrices.g_normal.elements);

	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

	matrices.model = popMatrix();
}


// 
// 
//  Assistive Functions
// 
// 

function deg2rad(angle){
	// convert degree to radian
	return angle * Math.PI / 180;
}

function initUniformAttributes(){
	u.ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	u.ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	u.NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	u.ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	u.LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
	u.LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

	// !point light implementation
	u.LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
	u.AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

	// Trigger using lighting or not
	u.isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');
}

function initialiseColors(){
	// Set clear color and enable hidden surface removal
	gl.clearColor(settings.bg_color[0],settings.bg_color[1],settings.bg_color[2],settings.bg_color[3]);
	gl.enable(gl.DEPTH_TEST);

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function checkStatus( u_LightPosition, u_ModelMatrix, u_ViewMatrix, u_NormalMatrix,u_ProjMatrix, u_LightColor, u_LightDirection,u_isLighting){
	if (!u_LightPosition) {
		console.log("Failed to Get storage location of u_LightPosition");
	}
	if (!u_ModelMatrix) {
		console.log("model matrix msising");
	}
	if (!u_ViewMatrix) {
		console.log("view matrix msising");
	}
	if (!u_NormalMatrix) {
		console.log("normal matrix msising");
	}
	if (!u_ProjMatrix) {
		console.log("proj matrix msising");
	}
	if (!u_ProjMatrix) {
		console.log("proj matrix msising");
	}
	if (!u_LightColor) {
		console.log("lighr col missing");
	}
	if (!u_LightDirection) {
		console.log("light dir missing?");
	}
	if (!u_isLighting) {
		console.log("is lighting missing");
	}
}