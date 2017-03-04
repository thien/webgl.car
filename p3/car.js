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

var matrices = {
	// The model matrix
	'model' : new Matrix4(),

	// The view matrix
	'view' : new Matrix4(),

	// The projection matrix
	'projection' : new Matrix4(),

	// Coordinate transformation matrix for normals
	'g_normal' : new Matrix4()
};

var car = {
	'position' : {
		'x' : 0,
		'y' : 0
	},
	'rotation' : {
		'angle' : 0,
		'step'  : 2
	},
	'wheel' : {
		'angle' : 0,
		'step' : 0,
		'front': {
			'rotation' : 0
		}
	},
	'movestep' : 0.8,
	'anglestep' : 30
};

var plane = {
	'x' : 50,
	'z' : 50
};

var g_xAngle = 0.0; // The rotation x angle (degrees)
var g_yAngle = 0.0; // The rotation y angle (degrees)

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

	// check Status of items to see whether they have initiated.
	checkStatus(u_ModelMatrix, u_ViewMatrix, u_NormalMatrix,u_ProjMatrix, u_LightColor, u_LightDirection,u_isLighting);

	// Set the light color (white)
	gl.uniform3f(u_LightColor, 1, 1, 1);

	// Set the light direction (in the world coordinate)
	var lightDirection = new Vector3([7,7,7.0]);

	// Normalize the light direction
	lightDirection.normalize();
	gl.uniform3fv(u_LightDirection, lightDirection.elements);

	// Set the light direction (in the world coordinate)
	var lightPosition = new Vector3([0,10,0]);
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
	  // matrices.view.setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
	  // angle (x), angle (y), zoom,  _____, _, rotation of camera, inv,


	  // sets of three (x,y,z)
	  // pos cam, pos along dierction you wanna look at, up axis,

	// angled position
	matrices.view.setLookAt(45, 45, 45, 0, -10, 0, 0, 0.04, 0);

  	// matrices.view.setLookAt(20, 2, 10, -10, -15, 0, 0.0, 0.02, 0);

	// matrices.view.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);

	matrices.projection.setPerspective(40, canvas.width / canvas.height, 1, 120);

	// Pass the model, view, and projection matrix to the uniform variable respectively
	gl.uniformMatrix4fv(u_ViewMatrix, false, matrices.view.elements);
	gl.uniformMatrix4fv(u_ProjMatrix, false, matrices.projection.elements);

	// deal with car movements
	document.onkeydown = function(ev) {
		keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
	};

	// draw!
	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
	var rotation_x = (car.position.x * Math.cos(car.rotation.angle)) - (car.position.y * Math.sin(car.rotation.angle));
	var rotation_y = (car.position.x * Math.sin(car.rotation.angle)) + (car.position.y * Math.cos(car.rotation.angle));
	
	switch (ev.keyCode) {
		case 40: 
			// Up arrow key -> the positive rotation of arm1 around the y-axis
			if ((car.position.y + 1) < (plane.z/2)){
				g_xAngle = (g_xAngle + car.anglestep) % 360;
				car.wheel.angle = (car.wheel.angle + (car.anglestep * car.movestep)) % 360;

				car.position.x += car.movestep * rotation_x;
				car.position.y += car.movestep * rotation_y;
			}
			break;
		case 38: 
			// Down arrow key -> the negative rotation of arm1 around the y-axis
			if ((car.position.y + 1) > (-plane.z/2)){
				g_xAngle = (g_xAngle - car.anglestep) % 360;
				car.wheel.angle = (car.wheel.angle - (car.anglestep * car.movestep)) % 360;

				car.position.x -= car.movestep * Math.sin(car.rotation.angle);
				car.position.y -= car.movestep * Math.cos(car.rotation.angle);
			}
			break;
		case 39: 
			// Right arrow key -> the positive rotation of arm1 around the y-axis
			if ((car.position.x + 1) < (plane.x/2)){
				g_yAngle = (g_yAngle + car.anglestep) % 360;
				car.wheel.front.rotation = (car.wheel.front.rotation + (car.anglestep * car.movestep)) % 360;
				// car.position.x += car.movestep;

				car.rotation.angle = (car.rotation.angle - car.rotation.step) % 360;
			}
			break;
		case 37: 
			// Left arrow key -> the negative rotation of arm1 around the y-axis
			if ((car.position.x + 1) > (-plane.x/2)){
				g_yAngle = (g_yAngle - car.anglestep) % 360;
				car.wheel.front.rotation = (car.wheel.front.rotation - (car.anglestep * car.movestep)) % 360;
				// car.position.x -= car.movestep;

				car.rotation.angle = (car.rotation.angle + car.rotation.step) % 360;
			}
			break;
		default:
			return; // Skip drawing at no effective action
	}

	// Draw the scene again..
	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function initialiseCubeVertexBuffer(gl) {
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
	if (!initialiseArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
	if (!initialiseArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
	if (!initialiseArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

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

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// default the plane's position.
	matrices.model.setTranslate(0, 0, 0);

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u_ModelMatrix, false, matrices.model.elements);

	// Will apply lighting
	gl.uniform1i(u_isLighting, true);

	// Set the vertex coordinates and color (for the cube)
	var n = initialiseCubeVertexBuffer(gl);

	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// plane
	pushMatrix(matrices.model);
	matrices.model.translate(0, -0.5, 0); // Translation
	matrices.model.scale(plane.x,0,plane.z); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	// Rotate, and then translate
	matrices.model.setTranslate(car.position.x, 0, car.position.y); // Translation (No translation is supported here)
	// matrices.model.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
	// matrices.model.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
	matrices.model.rotate(car.rotation.angle, 0.0, 1.0, 0.0); 
	matrices.model.translate(0, 0.5, 0); // Translation

	// Model the car base
	pushMatrix(matrices.model);
	matrices.model.translate(0, 0, 0.2); // Translation
	matrices.model.scale(2.2, 1.2, 5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	// Model the car top
	pushMatrix(matrices.model);
	matrices.model.translate(0, 1, 0.5); // Translation
	matrices.model.scale(2.0, 1, 4); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	// Model the car door (left)
	pushMatrix(matrices.model);
	matrices.model.translate(1.1, 0.5, 0); // Translation
	matrices.model.scale(0.1, 1.1, 1); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	// Model the car door (right)
	pushMatrix(matrices.model);
	matrices.model.translate(-1.1, 0.5, 0); // Translation
	matrices.model.scale(0.1, 1.1, 1); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	// Model the car wheel (back left)
	pushMatrix(matrices.model);
	matrices.model.translate(1.2, -0.5, 1.5); // Translation
	matrices.model.scale(0.2, 1, 1); // Scale
	matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	//Model the car wheel (back right)
	pushMatrix(matrices.model);
	matrices.model.translate(-1.2, -0.5, 1.5); // Translation
	matrices.model.scale(0.2, 1, 1); // Scale
	matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	//Model the car wheel (front left)
	pushMatrix(matrices.model);
	matrices.model.translate(-1.2, -0.5, -1.5); // Translation
	matrices.model.scale(0.2, 1, 1); // Scale
	matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
	matrices.model.rotate(car.wheel.front.rotation, 0.0, 0.0, 1.0); 
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

	//Model the car wheel (front right)
	pushMatrix(matrices.model);
	matrices.model.translate(1.2, -0.5, -1.5); // Translation
	matrices.model.scale(0.2, 1, 1); // Scale
	matrices.model.rotate(car.wheel.angle, 1.0, 0.0, 0.0); 
	matrices.model.rotate(car.wheel.front.rotation, 0.0, 1.0, 0.0); 
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	matrices.model = popMatrix();

}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
	pushMatrix(matrices.model);

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u_ModelMatrix, false, matrices.model.elements);

	// Calculate the normal transformation matrix and pass it to u_NormalMatrix
	matrices.g_normal.setInverseOf(matrices.model);
	matrices.g_normal.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, matrices.g_normal.elements);

	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

	matrices.model = popMatrix();
}

function checkStatus( u_LightPosition, u_ModelMatrix, u_ViewMatrix, u_NormalMatrix,u_ProjMatrix, u_LightColor, u_LightDirection,u_isLighting){
	// if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
	//     !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
	//     !u_isLighting ) { 
	//   console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
	//   return;
	// }
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