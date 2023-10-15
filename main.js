
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = true;
var controller;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.
var sphereRotation = [0,0,0];
var spherePosition = [0,-3.25,0];
var largeRockPosition = [0, -3.25, 0];
var smallRockPosition = [-1.2, -3.6, 0]

var cubeRotation = [0,0,0];
var cubePosition = [0,-5,0];

var cylinderRotation = [0,0,0];
var cylinderPosition = [1.1,0,0];

var coneRotation = [0,0,0];
var conePosition = [3,0,0];

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    setColor(materialDiffuse);

	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
        //console.log(animFlag);

		controller = new CameraController(canvas);
		controller.onchange = function(xRot,yRot) {
			RX = xRot;
			RY = yRot;
			window.requestAnimFrame(render); };
    };

    render(0);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

/**
 * Draw a sphere with a specific position, scale, and color.
 *
 * @param {number} posX - The x-coordinate of the sphere's position.
 * @param {number} posY - The y-coordinate of the sphere's position.
 * @param {number} posZ - The z-coordinate of the sphere's position.
 * @param {number} scale - The scaling factor for the sphere.
 */
function drawRock(posX, posY, posZ, scale) {
	gPush();
	gTranslate(posX, posY, posZ);
	gScale(scale, scale, 1);
	gPush();
	{
	  setColor(vec4(0.5, 0.5, 0.5, 1.0));
	  drawSphere();
	}
	gPop();
	gPop();
  }

/**
 * Draw a ground rectangle at the bottom of the screen.
 *
 * @param {number} width - The width of the ground rectangle.
 */
function drawGround(width) {
	gPush();
	gTranslate(cubePosition[0], cubePosition[1], cubePosition[2]);
	gScale(width, 1, 1);
	gPush();
	{
	  setColor(vec4(0.0, 0.0, 0.0, 1.0));
	  drawCube();
	}
	gPop();
	gPop();
  }

/**
 * Draw a seaweed frond with 10 leaves in the given position
 *
 * @param {number} posX - The x-coordinate of the seaweed leaf's position.
 * @param {number} posY - The y-coordinate of the seaweed leaf's position.
 * @param {number} posZ - The z-coordinate of the seaweed leaf's position.
 */
function drawSeaweedFrond(posX, posY, posZ) {
	gPush();
	gTranslate(posX, posY, posZ);
	gPush();
	{
	  // Set the color to green
	  setColor(vec4(0, 1, 0, 1));
      gScale(0.15, 0.30, 0.3);
	  drawSphere();
	  gPop();
	  for (let i = 0; i < 9; i++) {
		gPush();
		gTranslate(0, 0.6, 0);
		gRotate(15*Math.cos(0.0010*TIME + i), 0, 0, 1);
		gPush();
		gScale(0.15, 0.30, 0.3);
		drawSphere();
		gPop();
	  }
	  for (let i = 0; i < 9; i++) {
		gPop();
	  }
	}
	gPop();
  }

/**
 * Draw all three seaweed fronds.
 * One frond for the left, center, and right of the large rock in scene.
 */
function drawSeaweeds() {
	drawSeaweedFrond(largeRockPosition[0] + 0.65, largeRockPosition[1] + .5, largeRockPosition[2] - 1)
	drawSeaweedFrond(largeRockPosition[0], largeRockPosition[1] + 1, largeRockPosition[2] - 1)
	drawSeaweedFrond(largeRockPosition[0] - 0.65, largeRockPosition[1] + 0.5, spherePosition[2] - 1)
}

/**
 * Draw a pair of cones with specified parameters.
 *
 * @param {number} posX - The x-coordinate of the cone's position.
 * @param {number} posY - The y-coordinate of the cone's position.
 * @param {number} posZ - The z-coordinate of the cone's position.
 * @param {number} rotationSpeed - The rotation speed for the first cone (degrees per second).
 */
function drawFish(posX, posY, posZ, rotationSpeed) {
    gPush();
	gScale(0.75, 0.75, 0.75);
	gPush();
	(function drawFishBody() {
		gTranslate(posX, posY, posZ);
		gPush();
		{
			// Draw fish body
			setColor(vec4(1, 0.5, 0, 1));
			coneRotation[1] = coneRotation[1] + rotationSpeed*dt; // Update rotation
			gRotate(coneRotation[1], 0, 1, 0);
			gScale(0.75, 0.75, 2.5);
			drawCone();
		}
		gPop();
	})();
	(function drawFishHead() {
		gPush();
		gRotate(coneRotation[1] + 180, 0, 1, 0); // Rotate by 180 degrees
        gTranslate(0, 0, 1.62);
        setColor(vec4(1, 0.5, 0, 1));
        gScale(0.75, 0.75, 0.75);
        drawCone();
	})();
	(function drawFishEyes() {
		function drawEye(x, y, z) {
			// Draw whites of the eye
			gPush();
			setColor(vec4(1, 1, 1, 1));
			gTranslate(x, y, z);
			gScale(0.25, 0.25, 0.25);
			drawSphere();
			// Draw small black pupil
			setColor(vec4(0, 0, 0, 1));
			gTranslate(0, 0, 0.75);
			gScale(0.5, 0.5, 0.5);
			drawSphere();
			gPop();
		}
		gPush();
		// Left eye
		drawEye(0.5, 0.5, -0.15);
		// Right eye
		drawEye(-0.5, 0.5, -0.15);
		gPop();
	})();
	(function drawFishTail() {
		// dorsal fin
		gPush();
		gTranslate(0, 0.75, -3.85);
		gRotate(180, 0, 0.5, 0.25);
		setColor(vec4(1, 0.5, 0, 1));
		gScale(0.2, 0.4, 2);
		drawCone();
		gPop();
		// ventral fin
		gPush();
		gTranslate(0, -0.5, -3.75);
		gRotate(180, 0, 1, -0.5);
		setColor(vec4(1, 0.5, 0, 1));
		gScale(0.2, 0.4, 1.3);
		drawCone();
		gPop();
	})();
	gPop();
    gPop();
}

function render(timestamp) {
	TIME = timestamp;
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0,0,10);
    MS = []; // Initialize modeling matrix stack

	// initialize the modeling matrix to identity
    modelMatrix = mat4();

    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);

    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);


    // set all the matrices
    setAllMatrices();

	if( animFlag )
    {
		// dt is the change in time or delta time from the last frame to this one
		// in animation typically we have some property or degree of freedom we want to evolve over time
		// For example imagine x is the position of a thing.
		// To get the new position of a thing we do something called integration
		// the simpelst form of this looks like:
		// x_new = x + v*dt
		// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
		// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
		dt = (timestamp - prevTime) / 1000.0;
		prevTime = timestamp;
	}

	// Draw large center rock + smaller offset rock
	drawRock(largeRockPosition[0], largeRockPosition[1], largeRockPosition[2], 0.75);
	drawRock(smallRockPosition[0], smallRockPosition[1], smallRockPosition[2], 0.4);
	drawGround(6);
	drawSeaweeds();
	drawFish(conePosition[0], conePosition[1], conePosition[2], 30);

	// // Cylinder example
	// gPush();
	// 	gTranslate(cylinderPosition[0],cylinderPosition[1],cylinderPosition[2]);
	// 	gPush();
	// 	{
	// 		setColor(vec4(0.0,0.0,1.0,1.0));
	// 		cylinderRotation[1] = cylinderRotation[1] + 60*dt;
	// 		gRotate(cylinderRotation[1],0,1,0);
	// 		drawCylinder();
	// 	}
	// 	gPop();
	// gPop();

	// Cone example
	// gPush();
	// 	gTranslate(conePosition[0],conePosition[1],conePosition[2]);
	// 	gPush();
	// 	{
	// 		setColor(vec4(1, 0.5, 0, 1));
	// 		coneRotation[1] = coneRotation[1] + 90*dt;
	// 		gRotate(coneRotation[1],0,1,0);
	// 		gScale(0.75, 0.75, 2.5);
	// 		drawCone();
	// 		gPop();
	// 	}
	// 	gPush();
	// 	{
	// 		gRotate(coneRotation[1] + 180, 0, 1, 0); // Rotate by 180 degrees
	// 		gTranslate(0, 0, 1.62)
	// 		setColor(vec4(1, 0.5, 0, 1));
	// 		// gRotate(coneRotation[1],0,1,0);
	// 		gScale(0.75, 0.75, 0.75);
	// 		drawCone();
	// 		gPop();
	// 	}
	// gPop();

    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;

	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
	};

	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};

	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
