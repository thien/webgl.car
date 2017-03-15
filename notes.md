A) _Describe the difference between **attribute**, **uniform**, and **varying** in shader programming._

Attribute: Read only, Global Variables that can change per vertex. They're passed from OpenGL application to the vertex shaders. It can only be used in vertex shaders.

Uniform: Read only, Global variables that can change per the primatives that are passed from OpenGL to shaders. It can be used in both vertex and fragment shaders.

Varying: Read only in fragment shader, it's used for interpolated data between vertex shaders and fragment shaders. You can modify it in the vertex shader.

B) _Suppose you want to use a single array in the main() function of a WebGL programme, storing both the (x,y,z) coordinates and the (r,g,b) colour information for every vertex of a polygon model. Show a programming statement for constructing such an array. Assume the polygon model contains 6 vertices._

	//
	// Inside main()
	//

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

	// Indices of the vertices
	var indices = new Uint8Array([
		0, 1, 2, 0, 2, 3, // front
		4, 5, 6, 4, 6, 7, // right
		8, 9, 10, 8, 10, 11, // up
		12, 13, 14, 12, 14, 15, // left
		16, 17, 18, 16, 18, 19, // down
		20, 21, 22, 20, 22, 23 // back
	]);

	// Write the vertex property to buffers (coordinates, colors)
	if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
	if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;

	// Write the indices to the buffer object
	var indexBuffer = gl.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	----------------------------------------------------------

	//
	// Vertex Shader
	//

	attribute vec4 a_Position;
	attribute vec4 a_Color;
	void main() {
		gl_Position = a_Position;
		v_Color = a_Color;
	};



_Also write down the programming statements for constructing the corresponding vertex buffer objects and assigning the array data to become the position and colour attributes of the vertex shader._

C) _Draw the scene graph of the 3D car model as described in question 2. [6 marks]_



D) **(Reference: WebGL Prog. Guide Chapter 4, Table 4.1)**
_Suppose drawBox(m) is a function to draw a transformed box according to the transformation matrix m. That is, if m is a rotation matrix, the function will draw a rotated box._

i) _Explain the meaning of the following code segment and state the result obtained:_

	m.setRotate(angle, 0.0, 1.0, 0.0);
	m.translate(1.0, 3.0, -5.0);
	drawBox(m);

It would first change the angle of the object by the angle in the y axis.
It would then translate the matrix relative to its parent object in the direction of `1.0, 3.0, -5.0`. It will then draw the box by:

- Passing the model matrix to the uniform variable
- Calculate the normal transformation matrix and pass it to normalmatrix
- Draw the rotated and translated cube by rendering it using triangles

ii) _Explain whether you will get the same result if `m.setRotate()` has been replaced by `m.rotate()`._

You won't get the same result. `m.setRotate()` differs to `m.rotate()` primarily because of the fact that `m.setRotate()` sets the matrix for rotation, whereas `m.rotate()` multiplies the matrix for rotation from the right. 