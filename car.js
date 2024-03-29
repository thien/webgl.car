var canvas = document.getElementById('webgl'); // Retrieve <canvas> element
var gl = getWebGLContext(canvas); // Get the rendering context for WebGL
var vertex_shader_source =
	'attribute vec4 a_Color;\n' +
	'attribute vec4 a_Normal;\n' +	 // Normal
	'attribute vec4 a_Position;\n' +
	'uniform vec3 u_LightColor;\n' + // Light color
	'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
	'uniform vec3 u_LightPosition;\n' + // Light Position
	'uniform mat4 u_ModelMatrix;\n' +
	'uniform mat4 u_NormalMatrix;\n' +
	'uniform mat4 u_ProjMatrix;\n' +
	'uniform mat4 u_ViewMatrix;\n' +
	'varying vec4 v_Color;\n' +
	'varying vec3 v_LightPosition;\n' +
	'varying vec3 v_Normal;\n' +
	'varying vec3 v_Position;\n' +
	'uniform bool u_togglePointLighting;\n' +
	'void main() {\n' +
		'gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
		'if(u_togglePointLighting)\n' +
			'{\n' +
				'v_Position = vec3(u_ModelMatrix * a_Position);\n' +
				'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
				'v_Color = a_Color;\n' +
				'v_LightPosition = u_LightPosition;\n' +
		'}\n' +
		'else\n' +
		'{\n' +
			'vec3 normal = normalize(vec3(a_Normal));\n' +
			'float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
			'vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
			'v_Color = vec4(diffuse, a_Color.a);\n' +
		'}\n' +
	'}\n'; // Vertex shader program
var fragment_shader_source =
	'#ifdef GL_ES\n' +
	'precision highp float;\n' +
	'#endif\n' +

	'varying vec3 v_LightPosition;\n' +
	'varying vec4 v_Color;\n' +
	'varying vec3 v_Normal;\n' +
	'varying vec3 v_Position;\n' +
	'uniform vec3 u_LightColor;\n' +
	'uniform bool u_isPoint;\n' +
	'uniform bool u_togglePointLighting;\n' +
	'void main() {\n' +
		'if(u_togglePointLighting)\n' +
		'{\n' +
			'vec3 normal = normalize(v_Normal);\n' +
			'vec3 lightDirection = normalize(v_LightPosition - v_Position);\n' +
			'float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
			'vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
			'gl_FragColor = vec4(diffuse, v_Color.a);\n' +
		'}\n' +
		'else {\n' + 
			'gl_FragColor = v_Color;\n' +
		'}\n' +
	'}\n'; // Fragment shader program
var car = {
	'enabled' : true,
	'velocity' : 0.001,
	'throttle' : 0.05,
	'drag' : 0.04,
	'position' : {
		'x' : 0,
		'z' : 0
	},
	'wheel' : { //deal with wheel rotation (look like it's moving)
		'angle' : 0,
		'step' : 40,
	},
	'lambo' : false, //make door open vertically like a lambo ;)
	'front': {
		'rotation' : 0, //rotation of car 
		'anglestep' : 10 //step on car rotation
	},
};
var plane = {
	'x' : 70,
	'y' : 1,
	'z' : 70,
	'enabled': true,
	'colour' : [0.8,0.5,0.8]
};
var camera = {
	'view' : {
		'x' : 0, // The rotation x angle (degrees)
		'y' : 0  // The rotation y angle (degrees)
	},
	'option_state' : 0,
	'options': [
	{
		'name' : "World View",
		'setLookat': [
		-45,  45, -45, 
		  0,   -plane.x/3,   0, 
		  0,   10,   0
		],
		'setPerspective' : [
			50, 
			canvas.width / canvas.height, 
			1, 
			1500
		],
	},
	{ //follow the car
		'name' : "Car View",
		'setLookat' : [
		car.position.x, 25, 50, car.position.x, 0, car.position.z, 0, 1, -10],
		'setPerspective' : [
			40, 
			canvas.width / canvas.height, 
			1, 
			120
		],
	},
	{ //follow the car
		'name' : "Birds Eye",
		'setLookat' : [
		car.position.x, 60, car.position.z, 10, 10, 10, 0, 1, 0],
		'setPerspective' : [
			40, 
			canvas.width / canvas.height, 
			1, 
			120
		],
	}

	],
};
var settings = {
	toggle_lighting: true,
	cameraview : camera.options[camera.option_state],
	bg_color : [0.2,0.9,0.5],
	light_color : [1,1,1],
	light_direction : [1,2,0],
	light_position : [0,20,0],
	ambient_light : [1,1,1],
};
var stores = {
	u : { // storage locations of uniform attributes
		ModelMatrix : 0,
		ViewMatrix : 0,
		NormalMatrix : 0,
		ProjMatrix : 0,
		LightColour : 0, 
		LightDirection : 0,
		isToggleLighting : 0
	},
	matrices : {
		'model' : new Matrix4(),		// The model matrix
		'view' : new Matrix4(),			// The view matrix
		'projection' : new Matrix4(),	// The projection matrix
		'g_normal' : new Matrix4()		// Coordinate transformation matrix for normals
	}
}
var keypresses = {};
var g_matrixstack = [];// Array for storing a matrix
var draw_ready = false;

function initUniformAttributes(){
	stores.u.ModelMatrix = 		gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	stores.u.ViewMatrix =		gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	stores.u.NormalMatrix = 	gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	stores.u.ProjMatrix = 		gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	stores.u.LightColor = 		gl.getUniformLocation(gl.program, 'u_LightColor');
	stores.u.LightDirection = 	gl.getUniformLocation(gl.program, 'u_LightDirection');
	// !point light implementation
	stores.u.LightPosition = 	gl.getUniformLocation(gl.program, 'u_LightPosition');
	stores.u.AmbientLight = 	gl.getUniformLocation(gl.program, 'u_AmbientLight');
	// Trigger using lighting or not
	stores.u.isToggleLighting = gl.getUniformLocation(gl.program, 'u_togglePointLighting'); 
}

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

	// Set the light position (in the world coordinate)
	gl.uniform3fv(stores.u.LightPosition, new Vector3(settings.light_position).elements);

	// set up ambient light
	var AmbientLight = new Vector3(settings.ambient_light).normalize();
	gl.uniform3fv(stores.u.AmbientLight, AmbientLight.elements);

	// Set the light color [Directional Lighting]
	var LightColor = new Vector3(settings.light_color);
	gl.uniform3fv(stores.u.LightColor, LightColor.elements);

	// set up light direction (in world coord) [Directional Lighting]
	gl.uniform3fv(stores.u.LightDirection, new Vector3(settings.light_direction).normalize().elements);

	// apply lighting
	gl.uniform1i(stores.u.isLighting, true);

	// simulate ready keypress
	setTimeout(function() {keypresses[32] = true;}, 1);
	setTimeout(function() {keypresses[32] = false;}, 150);

	// draw following screens
	setInterval(function() {
		frame(gl, stores.u);
	}, 17); //60fps
}

var goodkeys = {
	// keys are wasd
	'down' : 83, 
	'right': 68,
	'up' : 87,
	'left' : 65,
	'space' : 32,
	'toggle' : 84,
	'camera' : 69,
};

document.onkeydown = function(ev){
	keypresses[ev.keyCode] = true;
	switch(ev.keyCode) {
		case goodkeys.space:
			// toggle door
			car.lambo = !car.lambo;
			break;
		case goodkeys.camera:
			if (camera.option_state +1 < camera.options.length){
				camera.option_state += 1;
			} else {
				camera.option_state = 0;
			}
			settings.cameraview = camera.options[camera.option_state];
			console.log("camera state:",camera.option_state)
			break;
		case goodkeys.toggle:
			settings.toggle_lighting = !settings.toggle_lighting;
			break;
	}
};

document.onkeyup = function(ev){
	// remove it from the list
	keypresses[ev.keyCode] = false;
};

function frame(gl, u) {
	var check = false;

	if (!draw_ready){
		draw_ready = true;
		check = true;
	}

	for (var keycode in keypresses) {
		if (keypresses[keycode]) {
			keydown(keycode);
			check = true
		}
	}
	if (car.velocity > 0) {
		car.velocity -= car.drag;
		if (car.velocity < 0.002){
			car.velocity = 0;
		}
	} else if (car.velocity < 0) {
		car.velocity += car.drag;
	}
	
	// deal with wheel rotation
	car.wheel.angle += car.velocity*car.wheel.step;

	// change position of car
	car.position.x += car.velocity * Math.cos(deg2rad(car.front.rotation));
	car.position.z += car.velocity * Math.sin(deg2rad(car.front.rotation));

	if (Math.abs(car.position.x) >= Math.abs(plane.x/2) || Math.abs(car.position.z) >= Math.abs(plane.z/2)){
		// bounce back from the wall.
		car.front.rotation = (car.front.rotation - 180) % 360;
	}

	if (car.velocity > 0 || check){
		// using a check to make sure we don't waste processor time
		draw(gl, u);
	}
}

function keydown(keycode) {
	switch (parseInt(keycode)) {
		case goodkeys.down:
			car.velocity -= car.throttle;
			break;
		case goodkeys.up:
			car.velocity += car.throttle;
			break;
		case goodkeys.right:
			car.front.rotation = (car.front.rotation + car.front.anglestep % 360);
		  break;
		case goodkeys.left:
			car.front.rotation = (car.front.rotation - car.front.anglestep % 360);
			break;
		 // Skip drawing
		default: return;
	}
}

function initialiseCubeVertexBuffer(gl, colours) {

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

function manipulateColourBuffer(gl, colour){
	var col = new Float32Array(72);
	for (i = 0; i < col.length; i = i + 3){
		col[i] = colour[0];
		col[i+1] = colour[1];
		col[i+2] = colour[2];
	}

	if (!initialiseArrayBuffer(gl, 'a_Color', col, 3, gl.FLOAT)) {
		return -1;
	}
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

function pushMatrix(m) {
	// Store the specified matrix to the array
	var m2 = new Matrix4(m);
	g_matrixstack.push(m2);
}

function popMatrix() {
	// Retrieve the matrix from the array
	return g_matrixstack.pop();
}

function draw(gl, u) {

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// Pass the model matrix to the uniform variable

	// Set the vertex coordinates and color (for the cube)
	stores.matrices.model.setTranslate(0, 0, 0);
	gl.uniformMatrix4fv(stores.u.ModelMatrix, false, stores.matrices.model.elements);

	// initiate cube vertex
	var n = initialiseCubeVertexBuffer(gl, [1,1,1]);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	if (plane.enabled){

		pushMatrix(stores.matrices.model);
		manipulateColourBuffer(gl, plane.colour);
		stores.matrices.model.translate(0.0, -0.5-plane.y, 0.0); // Translation
		stores.matrices.model.scale(plane.x,plane.y,plane.z); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();
	}

	if (car.enabled){
		// deal with default rotation

		stores.matrices.model.setTranslate(car.position.x, 0, car.position.z); // Translation (No translation is supported here)
		stores.matrices.model.rotate(car.front.rotation, 0.0, -1.0, 0.0); 
		stores.matrices.model.translate(0, 0.5, 0); // Translation
		stores.matrices.model.rotate(90, 0.0, 1.0, 0.0); 

		// set car base colour
		manipulateColourBuffer(gl, [1,0,0]);

		// Model the car base
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(0, 0, 0.2); // Translation
		stores.matrices.model.scale(2.2, 1.2, 7); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();

		// set car top colour
		manipulateColourBuffer(gl, [1,1,0]);

		// Model the car top
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(0, 1, -0.5); // Translation
		stores.matrices.model.scale(2.0, 1, 4); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();

		// set left door colour
		manipulateColourBuffer(gl, [0.5,0.8,0.4]);

		// Model the car door (left)
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(1.1, 0.5, 0); // Translation

		if (car.lambo){
			stores.matrices.model.translate(0.5, 0.5,0);
			stores.matrices.model.rotate(90, 0, 0, 1); 
		}

		stores.matrices.model.scale(0.1, 1.1, 1); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();

		// set right door colour
		manipulateColourBuffer(gl, [0.55,0.25,0.25]);

		// Model the car door (right)
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(-1.1, 0.5, 0); // Translation
		if (car.lambo){
			stores.matrices.model.translate(-0.5, 0.5,0);
			stores.matrices.model.rotate(90, 0, 0, 1); 
		}
		stores.matrices.model.scale(0.1, 1.1, 1); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();

		// set bfw colour
		manipulateColourBuffer(gl, [0.3,0.25,0.7]);

		//Model the car wheel (back left)
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(-1.2, -0.5, -1.5); // Translation
		stores.matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		stores.matrices.model.scale(0.2, 1, 1); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();

		// set rfw colour
		manipulateColourBuffer(gl, [0.2,0.5,0.7]);

		//Model the car wheel (back right)
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(1.2, -0.5, -1.5); // Translation
		stores.matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		stores.matrices.model.scale(0.2, 1, 1); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();

		// set car base colour
		manipulateColourBuffer(gl, [0.6,0.2,0.55]);

		// Model the car wheel (front left)
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(1.2, -0.5, 1.5); // Translation
		stores.matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		stores.matrices.model.scale(0.2, 1, 1); // Scale
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();

		// set car base colour
		manipulateColourBuffer(gl, [1,1,1]);

		//Model the car wheel (front right)
		pushMatrix(stores.matrices.model);
		stores.matrices.model.translate(-1.2, -0.5, 1.5); // Translation
		stores.matrices.model.scale(0.2, 1, 1); // Scale
		stores.matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
		drawbox(gl, stores.u.ModelMatrix, stores.u.NormalMatrix, n);
		stores.matrices.model = popMatrix();
	}

	// toggle lighting
	gl.uniform1i(stores.u.isToggleLighting, settings.toggle_lighting);

	if (camera.option_state === 2){
		settings.cameraview.setLookat = [car.position.x, 60, car.position.z, car.position.x,0,car.position.z,1,0, 0];
	} else if (camera.option_state === 1){
		settings.cameraview.setLookat = [car.position.x, 25, 20, car.position.x, 0, car.position.z, 0, 1, -10],
		settings.cameraview.setPerspective= [40, canvas.width / canvas.height, 1, 120];
	}
	// manage camera
	var sl = settings.cameraview.setLookat;
	stores.matrices.view.setLookAt(sl[0],sl[1],sl[2],sl[3],sl[4],sl[5],sl[6],sl[7],sl[8]);

	var sp = settings.cameraview.setPerspective;
	stores.matrices.projection.setPerspective(sp[0], sp[1], sp[2], sp[3]);

	// Pass the model, view, and projection matrix to the uniform variable respectively
	gl.uniformMatrix4fv(stores.u.ViewMatrix, false, stores.matrices.view.elements);
	gl.uniformMatrix4fv(stores.u.ProjMatrix, false, stores.matrices.projection.elements);

	document.getElementById("camera_view").innerHTML = settings.cameraview.name;

}

function drawbox(gl, modelmatrix, normalmatrix, n) {
	pushMatrix(stores.matrices.model);

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(modelmatrix, false, stores.matrices.model.elements);

	// Calculate the normal transformation matrix and pass it to normalmatrix
	stores.matrices.g_normal.setInverseOf(stores.matrices.model);
	stores.matrices.g_normal.transpose();
	gl.uniformMatrix4fv(normalmatrix, false, stores.matrices.g_normal.elements);

	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

	stores.matrices.model = popMatrix();
}

function deg2rad(angle){
	// convert degree to radian
	return angle * Math.PI / 180;
}

function initialiseColors(){
	// Set clear color and enable hidden surface removal
	gl.clearColor(settings.bg_color[0],settings.bg_color[1],settings.bg_color[2],settings.bg_color[3]);
	gl.enable(gl.DEPTH_TEST);

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function checkStatus( lightpos, modelmatrix, viewmat, normal,proj, lightcol, lightdir,light){
	if (!lightpos) {
		console.log("Failed to Get storage location of light position");
	} else {
		// console.log("lightpos", lightpos);
	}
	if (!modelmatrix) {
		console.log("model matrix msising");
	} else {
		// console.log("modelmatrix", modelmatrix);
	}
	if (!viewmat) {
		console.log("view matrix msising");
	} else {
		// console.log("viewmatrix", viewmat)
	}
	if (!normal) {
		console.log("normal matrix msising");
	}
	if (!proj) {
		console.log("proj matrix msising");
	}
	if (!lightcol) {
		console.log("light colour missing");
		console.log(lightcol)
	}
	if (!lightdir) {
		console.log("light direction missing?");
	}
	if (!light) {
		console.log("light boolean missing");
		console.log(light);
	}
}