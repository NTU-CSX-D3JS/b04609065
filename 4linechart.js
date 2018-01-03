function get_limits(data, column){
	var value_max = d3.max(data, function(d){ return parseInt(d[column]); });
	var value_min = d3.min(data, function(d){ return parseInt(d[column]); });
	var values = [value_min, value_max];
	return values;
}

function select_data(raw_data, Y_data, Y_names){
	for (var i = 0; i < Y_names.length; i++){
		var obj = d3.nest()
			.key(function(d){ return d[Y_names[i]]; })
			.entries(raw_data);
		Y_data.push(obj);
	}
	return Y_data;
}

function get_Y_limits(Y_data, Y_names){
	var Y_names_max = [];
	var Y_names_min = [];
	for (var i = 0; i < Y_names.length; i++){
		var value_max = d3.max(Y_data[i], function(d){ return parseInt(d[1]); });
		var value_min = d3.min(Y_data[i], function(d){ return parseInt(d[1]); });
		Y_names_max.push(value_max);
		Y_names_min.push(value_min);
	}
	var Y_max = d3.max(Y_names_max);
	var Y_min = d3.min(Y_names_min);
	var result = [Y_min, Y_max];
	return result;
}



function noted(message){
	console.log(message);
}

function draw_linechart(url, X_name, Y_names, Y_labels, title){
d3.csv(url, function(error, data){
	console.log("raw_data = ", data);	
	if(error){
	    console.log(error);
	}
	
	var X_data = d3.stack().keys([X_name])(data);
	console.log("X_data = ", X_data);
	
	
	var Y_data = d3.stack().keys(Y_names)(data);
	console.log("Y_data = ", Y_data);
	Y_data.forEach( (val) =>{
		val.forEach( (val2) => {
			val2[1] = val2[1] - val2[0];
			val2[0] = 0;
		})
	});
	console.log("Y_data = ", Y_data);


	
	// color: blue, red, yellow, green	
	var colorset = ["#29b6f6", "#E34247", "#FEB32E", "#3bcec0", "#ff99ff", "#cccccc"];	
	var Ymax, Ymin;
	
	//var colorset = d3.scaleOrdinal(d3.schemeCategory10);
	//var colorset = d3.scale.category10();

// ** SVG canvas parameters
	var width = 1200;
	var height = 500;
	var padding = { top: 50, right: 400, bottom: 50, left: 100};
	var canvas_width = width - padding.left - padding.right;
	var canvas_height = height - padding.top - padding.bottom;
	
// ** find limits of X & Y axis
	Y_limits = get_Y_limits(Y_data, Y_names);
	X_limits = get_limits(data, X_name);
	var Xmax = X_limits[1];
	var Xmin = X_limits[0];
	var Ymax = Y_limits[1]*1.05;
	var Ymin = Y_limits[0];
	
	console.log("limits = ", Xmax, Xmin, Ymax, Ymin);
// *** Scale setting
	var xScale = d3.scaleLinear().domain([Xmin, Xmax]).range([0, canvas_width]);
	var yScale = d3.scaleLinear().domain([Ymin, Ymax]).range([canvas_height, 0]);	

// *** D3.js line generator
	noted("Check generator");	
	// Note: interpolate syntax is different between v3 & v4
        // http://bl.ocks.org/emmasaunders/7c2719dc7502	
	var line_generator = d3.line()
		  .x(function(d, i){
			  return xScale(X_data[0][i][1]); })
		  .y(function(d){ 
			  return yScale(d[1]); })
		  .curve(d3.curveMonotoneX);	


// *** Append SVG canvas

	var svg = d3.select('body').append('svg')
	    .attr('width', width)
	    .attr('height', height);


// *** Append Lines

	var lineset = svg.selectAll("path")
		.data(Y_data)
		.enter()
		.append("path")
		.attr("transform", "translate(" + padding.left + "," + padding.top + ")");
	
	var lineAttributes = lineset
		  .attr("class", "line")
	    	  .attr("stroke", function(d, i){ return colorset[i]; })
		  .attr("d", function(d){ return line_generator(d); });
	
// *** Axis style
	
	var yAxis = d3.axisLeft(yScale);
	var xAxis = d3.axisBottom(xScale);
	var XaxisAppend = svg.append("g")
	    .attr("class", "axis")
	    .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom) + ")")
	    .call(xAxis.tickFormat(d3.format("d")));
	var YaxisAppend = svg.append("g")
	    .attr("class", "axis")
	    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
	    .call(yAxis.tickFormat(d3.format("d")));
			
// *** Mouse event objects
	
	var focusDot = svg.append("g")
		.attr("class", "focusDot")
		.style("display", null);
		
	
	focusDot.selectAll("circle")
		.data(Y_data)
		.enter().append("circle")
			.attr("stroke-width", 3)
			.attr("fill", "#2C2C39")
			.attr("r",7)
			.attr("stroke", function(d,i){ return colorset[i];});

	var focusLine = svg.append("g")
	    .attr("class", "focusLine")
	    .style("display", "none");

	var ver_line = focusLine.append("line")
	    .style("stroke-dasharray", ("3,3"))
	    .attr("stroke-width", 1)
	    .attr("stroke", "white");
	
	focusLine.append("rect")
	    .attr("width", 60)
	    .attr("height", 30)
	    .attr("fill", "white")
	    .attr("rx", 5)
	    .attr("ry", 5)
	    .attr("opacity", 0.7);	    

	focusLine.append("text")
	    .attr("dx", 17)
	    .attr("dy", 22)
	    .attr("text-anchor", "start")
	    .attr("fill", "black")
	    .attr("font-size", "20px")
	    .attr("font-weight", 200);    

	var tracker = svg.append("rect")
	    .attr("class", "overlay")
	    .attr("x", padding.left)
	    .attr("y", padding.top)
	    .attr("fill", "white")
	    .attr("width", canvas_width + 20)
	    .attr("height", canvas_height)
	    .on("mouseover", function(){
		focusDot.style("display", null);
		focusLine.style("display", null);
		statText.style("display", null);
	    })
	    .on("mouseout", function(){
		focusDot.style("display", null);
		focusLine.style("display", "none");
		statText.style("diaplay", null);
	    })
	    .on("mousemove", mousemove);

	function mousemove(){
	    var mouseX = d3.mouse(this)[0] - padding.left;
	    var mouseY = d3.mouse(this)[1] - padding.top;
	    
	    var x0 = parseInt( xScale.invert( mouseX ) );
	    var y0 = parseInt( yScale.invert( mouseY ) );	    

	    var bisect = d3.bisector( function(d){ return d[X_name]; }).left;
	    var index = bisect(data, x0); 
	    var x1 = X_data[0][index][1];
	    var y1 = Y_data[0][index][1];
	    //console.log(index, x1, y1);
	    var focusX = xScale(x1) + padding.left;
		
    	    statText.selectAll("text")
		    .text( function(d,i){ return d[index][1];});
		

	    focusDot.selectAll("circle")
			.attr("cx", focusX)
			.attr("cy", function(d,i){ return (yScale(d[index][1]) + padding.top); })
			;
	    
	    focusLine.select("line")
		.attr("x1", focusX)
		.attr("y1", padding.top + 10)
		.attr("x2", focusX)
		.attr("y2", height - padding.bottom);
	    
	    focusLine.select("rect")
		.attr("x", mouseX - 20)
		.attr("y", mouseY);

	    focusLine.select("text")
		.attr("x", mouseX - 30)
		.attr("y", mouseY)
		.text(x1);

	}

// *** Legend objects
	
	var label_x_position = canvas_width + 1.5*padding.left;
	var label_y_position = 2.5*padding.top;
	var label_y_interval = padding.top;
	var label_r_circle = 7;

	var colorLebel = svg.append("g")
	    .attr("class", "colorLabel")
	    .style("display", null);
	
	colorLebel.selectAll("circle")
		.data(Y_data)
		.enter().append("circle")
			.attr("r",label_r_circle)
			.attr("fill", function(d,i){ return colorset[i];} )
			.attr("cx", label_x_position)
			.attr("cy", function(d,i){ return label_y_position + i*label_y_interval;});

	colorLebel.selectAll("text")
		.data(Y_labels)
		.enter().append("text")
			.style("text-anchor", "start")
			.style("alignment-baseline", "middle")
			.attr("fill", "white")
			.attr("font-weight", "100")
			.attr("x", label_x_position + 3*label_r_circle)
			//.attr("y", 10)
			.attr("y", function(d,i){ return label_y_position+i*label_y_interval;})
			.text(function(d){ return d;});
	
	var statText = svg.append("g")
		.attr("class", "statText")
		.style("display", "none");

 	statText.selectAll("text")
	    .data(Y_data)
	    .enter().append("text")	    
	    	.attr("fill", "white")
	    	//.attr("fill", function(d,i){ return colorset[i];})
	    	.style("text-anchor", "start")
		.style("alignment-baseline", "middle")
		.attr("x", label_x_position + 1.5*padding.left)
		.attr("y", function(d,i){ return label_y_position + i*label_y_interval;})
	    	.attr("font-size", "14px")
	    	.attr("font-weight", 100);
 
// *** Title of the chart	
	svg.append("text").attr("x", (width / 2)).attr("y", padding.top)
	    .attr("text-anchor", "middle").style("font-size", "1.5em")
	    .attr("fill", "white")
	    .style("font-weight", 100)
	    .text(title);

})
}



