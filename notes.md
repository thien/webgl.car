# Graphics Summative
## Cmkv68


A) _Describe the difference between **attribute**, **uniform**, and **varying** in shader programming._

Attribute: Read only, Global Variables that can change per vertex. They're passed from OpenGL application to the vertex shaders. It can only be used in vertex shaders.

Uniform: Read only, Global variables that can change per the primatives that are passed from OpenGL to shaders. It can be used in both vertex and fragment shaders.

Varying: Read only in fragment shader, it's used for interpolated data between vertex shaders and fragment shaders. You can modify it in the vertex shader.

B) _Suppose you want to use a single array in the main() function of a WebGL programme, storing both the (x,y,z) coordinates and the (r,g,b) colour information for every vertex of a polygon model. Show a programming statement for constructing such an array. Assume the polygon model contains 6 vertices._

_Also write down the programming statements for constructing the corresponding vertex buffer objects and assigning the array data to become the position and colour attributes of the vertex shader._

	//
	// Inside main()
	//

	 var verticesColors = new Float32Array([
    0.75,  1.0,  -4.0,  0.4,  1.0,  0.4,
    0.25, -1.0,  -4.0,  0.4,  1.0,  0.4,
    1.25, -1.0,  -4.0,  1.0,  0.4,  0.4, 
    1.25, -1.0, -2.0,   1.0,  1.0,  0.4,
    -1.25, -1.0, -3.0,  1.0,  1.0,  0.4,
    -0.25, -1.0,  4.0,  1.0,  0.4,  0.4, 
	]);
	var n = 6;

	// Create a buffer object
	var vertexColorbuffer = gl.createBuffer();  

	// Write the vertex coordinates and color to the buffer object

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

	var FSIZE = verticesColors.BYTES_PER_ELEMENT;

	// Assign the buffer object to a_Position and enable the assignment

	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
	gl.enableVertexAttribArray(a_Position);

	// Assign the buffer object to a_Color and enable the assignment
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if(a_Color < 0) {
	console.log('Failed to get the storage location of a_Color');
	return -1;
	}

	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
	gl.enableVertexAttribArray(a_Color);

	return n;


C) _Draw the scene graph of the 3D car model as described in question 2. [6 marks]_

![model.png](model.png)

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

You won't get the same result. `m.setRotate()` differs to `m.rotate()` primarily because of the fact that `m.setRotate()` sets a matrix, and rotates it, whereas `m.rotate()` rotates a current matrix for rotation.