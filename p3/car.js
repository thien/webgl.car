// Vertex shader program
var VSHADER_SOURCE =
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
	'}\n';

// Fragment shader program
var FSHADER_SOURCE =
	'#ifdef GL_ES\n' +
	'precision mediump float;\n' +
	'#endif\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_FragColor = v_Color;\n' +
	'}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4(); // The view matrix
var projMatrix = new Matrix4(); // The projection matrix
var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals

var g_xAngle = 0.0; // The rotation x angle (degrees)
var g_yAngle = 0.0; // The rotation y angle (degrees)

var car_position_x = 0;
var car_position_y = 0;

var plane_size_x = 50;
var plane_size_z = 50;

var MOVE_STEP = 1;
var ANGLE_STEP = 70.0;     // The increments of rotation angle (degrees)

var g_frontWheelTurnAngle = 0.0;
var g_WheelSpinAngle = 0.0;

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// Set clear color and enable hidden surface removal
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Get the storage locations of uniform attributes
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
	var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

	// !point light implementation
	var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
	var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

	// Trigger using lighting or not
	var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

	// if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
	//     !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
	//     !u_isLighting ) { 
	//   console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
	//   return;
	// }

	if (!u_LightPosition) {
		console.log("Failed to Get storage location of u_LightPosition");
		// return;
	}
	if (!u_ModelMatrix) {
		console.log("model matrix msising");
		// return;
	}
	if (!u_ViewMatrix) {
		console.log("view matrix msising");
		// return;
	}
	if (!u_NormalMatrix) {
		console.log("normal matrix msising");
		// return;
	}
	if (!u_ProjMatrix) {
		console.log("proj matrix msising");
		// return;
	}
	if (!u_ProjMatrix) {
		console.log("proj matrix msising");
		// return;
	}
	if (!u_LightColor) {
		console.log("lighr col missing");
		// return;
	}
	if (!u_LightDirection) {
		// console.log(u_LightDirection)
		console.log("light dir missing?");
		// return;
	}
	if (!u_isLighting) {
		console.log("is lighting missing");
		// return;
	}

	// Set the light color (white)
	gl.uniform3f(u_LightColor, 1, 1, 1);

	// Set the light direction (in the world coordinate)
	var lightDirection = new Vector3([7,7,7.0]);

	// Normalize the light direction
	lightDirection.normalize();
	gl.uniform3fv(u_LightDirection, lightDirection.elements);

	// Set the light direction (in the world coordinate)
	var lightPosition = new Vector3([1, 3, 4]);
	// Normalize the light direction
	gl.uniform3fv(u_LightPosition, lightPosition.elements);

	// set up ambient light
	// Set the light direction (in the world coordinate)
	var AmbientLight = new Vector3([0.3, 0.5, 0.7]);

	// Normalize the light direction
	AmbientLight.normalize();
	gl.uniform3fv(u_AmbientLight, AmbientLight.elements);

	// Calculate the view matrix and the projection matrix

	  // calculate the view matrix and projection matrix
	  // viewMatrix.setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
	  // angle (x), angle (y), zoom,  _____, _, rotation of camera, inv,


	  // sets of three (x,y,z)
	  // pos cam, pos along dierction you wanna look at, up axis,

	  // var car_position_x = 0;
// var car_position_y = 0;

	viewMatrix.setLookAt(45, 45, 45, car_position_x, -15, car_position_y, 0, 0.04, 0);

  	// viewMatrix.setLookAt(20, 2, 10, -10, -15, 0, 0.0, 0.02, 0);

	// viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);

	projMatrix.setPerspective(40, canvas.width / canvas.height, 1, 100);

	// Pass the model, view, and projection matrix to the uniform variable respectively
	gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
	gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

	document.onkeydown = function(ev) {
		keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
	};

	// draw!
	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}


function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
	switch (ev.keyCode) {
		case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
			if ((car_position_y + 1) < (plane_size_z/2)){
				g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
				g_WheelSpinAngle = (g_WheelSpinAngle + (ANGLE_STEP * MOVE_STEP)) % 360;
				car_position_y += MOVE_STEP;
			}
			break;
		case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
			if ((car_position_y + 1) > (-plane_size_z/2)){
				g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
				g_WheelSpinAngle = (g_WheelSpinAngle - (ANGLE_STEP * MOVE_STEP)) % 360;
				car_position_y -= MOVE_STEP;
			}
			break;
		case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
			if ((car_position_x + 1) < (plane_size_x/2)){
				g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
				g_frontWheelTurnAngle = (g_frontWheelTurnAngle + (ANGLE_STEP * MOVE_STEP)) % 360;
				car_position_x += MOVE_STEP;
			}
			break;
		case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
			if ((car_position_x + 1) > (-plane_size_x/2)){
				g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
				g_frontWheelTurnAngle = (g_frontWheelTurnAngle - (ANGLE_STEP * MOVE_STEP)) % 360;
				car_position_x -= MOVE_STEP;
			}
			break;
		default:
			return; // Skip drawing at no effective action
	}

	// Draw the scene again..
	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}


function initCubeVertexBuffer(gl) {
	// Create a cube
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3
	var vertices = new Float32Array([ // Coordinates
		0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
		0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
		0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
		-0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
		-0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
		0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5 // v4-v7-v6-v5 back
	]);


	var colors = new Float32Array([ // Colors
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v1-v2-v3 front
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v3-v4-v5 right
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v5-v6-v1 up
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v1-v6-v7-v2 left
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v7-v4-v3-v2 down
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　 // v4-v7-v6-v5 back
	]);


	var normals = new Float32Array([ // Normal
		0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
		1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
		0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
		-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
		0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
		0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
	]);


	// Indices of the vertices
	var indices = new Uint8Array([
		0, 1, 2, 0, 2, 3, // front
		4, 5, 6, 4, 6, 7, // right
		8, 9, 10, 8, 10, 11, // up
		12, 13, 14, 12, 14, 15, // left
		16, 17, 18, 16, 18, 19, // down
		20, 21, 22, 20, 22, 23 // back
	]);


	// Write the vertex property to buffers (coordinates, colors and normals)
	if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
	if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
	if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

	// Write the indices to the buffer object
	var indexBuffer = gl.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
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

function initAxesVertexBuffers(gl) {

	var verticesColors = new Float32Array([
		// Vertex coordinates and color (for axes)
		-20.0, 0.0, 0.0, 1.0, 1.0, 1.0, // (x,y,z), (r,g,b) 
		20.0, 0.0, 0.0, 1.0, 1.0, 1.0,
		0.0, 20.0, 0.0, 1.0, 1.0, 1.0,
		0.0, -20.0, 0.0, 1.0, 1.0, 1.0,
		0.0, 0.0, -20.0, 1.0, 1.0, 1.0,
		0.0, 0.0, 20.0, 1.0, 1.0, 1.0
	]);
	var n = 6;

	// Create a buffer object
	var vertexColorBuffer = gl.createBuffer();
	if (!vertexColorBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

	var FSIZE = verticesColors.BYTES_PER_ELEMENT;
	//Get the storage location of a_Position, assign and enable buffer
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
	gl.enableVertexAttribArray(a_Position); // Enable the assignment of the buffer object

	// Get the storage location of a_Position, assign buffer and enable
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return -1;
	}
	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
	gl.enableVertexAttribArray(a_Color); // Enable the assignment of the buffer object

	// Unbind the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
	var m2 = new Matrix4(m);
	g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
	return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.uniform1i(u_isLighting, false); // Will not apply lighting

	// Set the vertex coordinates and color (for the x, y axes)

	var n = initAxesVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// Calculate the view matrix and the projection matrix
	modelMatrix.setTranslate(0, 0, 0); // No Translation
	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

	// Draw x and y axes
	// gl.drawArrays(gl.LINES, 0, n);

	gl.uniform1i(u_isLighting, true); // Will apply lighting

	// Set the vertex coordinates and color (for the cube)
	var n = initCubeVertexBuffer(gl);

	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

		// plane
	pushMatrix(modelMatrix);
	modelMatrix.translate(0, -0.5, 0); // Translation
	modelMatrix.scale(plane_size_x,0,plane_size_z); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Rotate, and then translate
	modelMatrix.setTranslate(car_position_x, 0, car_position_y); // Translation (No translation is supported here)
	// modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
	// modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
	modelMatrix.translate(0, 0.5, 0); // Translation
	// Model the car door (left)
	pushMatrix(modelMatrix);
	modelMatrix.translate(1.1, 0.5, 0); // Translation
	modelMatrix.scale(0.1, 1.1, 1); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the car door (right)
	pushMatrix(modelMatrix);
	modelMatrix.translate(-1.1, 0.5, 0); // Translation
	modelMatrix.scale(0.1, 1.1, 1); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// var g_frontWheelTurnAngle = 0.0;
// var g_WheelSpinAngle = 0.0;

	// Model the car wheel (front left)
	pushMatrix(modelMatrix);
	modelMatrix.translate(1.2, -0.5, 1.5); // Translation
	modelMatrix.scale(0.2, 1, 1); // Scale
	modelMatrix.rotate(g_WheelSpinAngle, 1.0, 0.0, 0.0); 

	// for rotation
	modelMatrix.rotate(g_frontWheelTurnAngle, 0.0, 0.0, 1.0); 
	// for rotation

	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	//Model the car wheel (front right)
	pushMatrix(modelMatrix);
	modelMatrix.translate(-1.2, -0.5, 1.5); // Translation
	modelMatrix.scale(0.2, 1, 1); // Scale
	modelMatrix.rotate(g_WheelSpinAngle, 1.0, 0.0, 0.0); 

	// for rotation
	modelMatrix.rotate(g_frontWheelTurnAngle, 0.0, 0.0, 1.0); 
	// for rotation

	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	//Model the car wheel (back left)
	pushMatrix(modelMatrix);
	modelMatrix.translate(-1.2, -0.5, -1.5); // Translation
	modelMatrix.scale(0.2, 1, 1); // Scale
	modelMatrix.rotate(g_WheelSpinAngle, 1.0, 0.0, 0.0); 
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	//Model the car wheel (back right)
	pushMatrix(modelMatrix);
	modelMatrix.translate(1.2, -0.5, -1.5); // Translation
	modelMatrix.scale(0.2, 1, 1); // Scale
	modelMatrix.rotate(g_WheelSpinAngle, 1.0, 0.0, 0.0); 
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the car top
	pushMatrix(modelMatrix);
	modelMatrix.translate(0, 1, 0.5); // Translation
	modelMatrix.scale(2.0, 1, 4); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the car base
	pushMatrix(modelMatrix);
	modelMatrix.translate(0, 0, 0.2); // Translation
	modelMatrix.scale(2.2, 1.2, 5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
	pushMatrix(modelMatrix);

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

	// Calculate the normal transformation matrix and pass it to u_NormalMatrix
	g_normalMatrix.setInverseOf(modelMatrix);
	g_normalMatrix.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

	modelMatrix = popMatrix();
}