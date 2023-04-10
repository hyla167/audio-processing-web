// Initialize WaveSurfer
var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    scrollParent: true,
    fillParent: false, 
    plugins: [
        WaveSurfer.timeline.create({
            container: "#waveform-timeline"
        }),
        WaveSurfer.regions.create({
          container: "#waveform-timeline",
          regions: [
              {
                  start: 1,
                  end: 3,
                  loop: false,
                  color: 'hsla(400, 100%, 30%, 0.5)'
              }
          ],
          dragSelection: {
              slop: 5
          }
      })
      ],
    splitChannels: true
});
var tooltip; // Display information when hover on parameters graph
var startTime = null, endTime = null, interval = null; // for zoom
var soundSeconds = 0; // length of the audio
var margin, width, height;
var parseTime
var x, y0, y1, y2; // Axis of parameters graph
var xTime, yFormant1, yFormant2, yFormant3, yFormant4;
var formantLine1, formantLine2, formantLine3, formantLine4;
var xAxis, yAxisLeft, yAxisRight, yAxisRight2;
var valueline, valueline2; // Pitch and Intensity line
var svg;
var totalPixels = 1264 - 150; // 1264 is default width of <canvas> on dev-device, 150 is total padding (left + right)
wavesurfer.load('uploads/temp.wav');
wavesurfer.on('ready',(e)=>{
  soundSeconds = wavesurfer.getDuration(); // get the time of audio
  var pxPerSec = totalPixels/soundSeconds;
	wavesurfer.zoom(pxPerSec);
  document.getElementById("slider").setAttribute("min", pxPerSec + '')
  document.getElementById("slider").setAttribute("value", pxPerSec + '')
})

setGraphParams(totalPixels);
initializeGraph();

let firstTime = true;
function playAudio() {
    var musicPlayer = document.getElementById("musicPlayer");
    if (firstTime) {
    musicPlayer.src = 'uploads/temp.wav'
    firstTime = false;
    }
    if (document.getElementById("play-btn").className == 'is-playing')
    {
        wavesurfer.playPause();
        document.getElementById("play-btn").className = "";
        document.getElementById("play-btn").textContent = "Play";
    }
    else {
        wavesurfer.playPause();
        document.getElementById("play-btn").className = "is-playing";
        document.getElementById("play-btn").textContent = "Pause";
    }
}

////// END PLAY BUTTON METHOD //////

////// ZOOM SLIDER METHOD //////
var slider = document.querySelector('#slider');

slider.oninput = function () {
  var zoomLevel = Number(slider.value);
  wavesurfer.zoom(zoomLevel);
  zoom(soundSeconds*zoomLevel);
};

////// END ZOOM SLIDER METHOD //////

////// ZOOM INTERVAL METHOD //////
function getData(form) {
  var formData = new FormData(form);
  console.log(formData);
  // iterate through entries...
  for (var pair of formData.entries()) {
    if (pair[0] == 'zoom-start') startTime = parseFloat(pair[1]);
    else endTime = parseFloat(pair[1]);
  }
  interval = (endTime - startTime).toFixed(2);
  var pxPerSec = totalPixels / interval;
  wavesurfer.zoom(pxPerSec);
  zoom(soundSeconds*pxPerSec);
  document.getElementById('slider').value = pxPerSec;
  var progress = ((startTime + endTime) / 2) / soundSeconds; 
  wavesurfer.seekAndCenter(progress);
}

document.getElementById("set-zoom-time").addEventListener("submit", function (e) {
  e.preventDefault();
  getData(e.target);
});
////// END ZOOM INTERVAL METHOD //////

///// ZOOM INTERVAL USING WAVESURFER REGION /////
wavesurfer.on('region-update-end', function (region) {
  region.drag = false;
  document.getElementById('zoom-start').value = region.start.toFixed(2);
  document.getElementById('zoom-end').value = region.end.toFixed(2);
});

// At most one region can be selected at a time
wavesurfer.on('region-updated', function(region){
      var regions = region.wavesurfer.regions.list;
      var keys = Object.keys(regions);
      if(keys.length > 1){
        regions[keys[0]].remove();
      }
});
///// END ZOOM INTERVAL USING WAVESURFER REGION /////

////// PARAMETER GRAPH METHOD //////
function setGraphParams(newWidth){
    margin = {top: 20, right: 50, bottom: 20, left: 50},
        width = newWidth /*- margin.left - margin.right*/,
        height = 205 /*- margin.top*/ - margin.bottom;
    
    parseTime = d3.time.format("%S.%L").parse;
    
    x = d3.time.scale().range([0, width]);
    y0 = d3.scale.linear().range([height, 0]);
    y1 = d3.scale.linear().range([height, 0]);
    y2 = d3.scale.linear().range([height, 0]);

    xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(d3.time.seconds, 1)
        .tickFormat(d3.time.format("%M:%S"));
    
    yAxisLeft = d3.svg.axis().scale(y0)
    .orient("left").ticks(2).tickFormat((d) => d + " Hz");

    yAxisRight = d3.svg.axis().scale(y1)
    .orient("right").ticks(1).tickFormat((d) => d + " dB"); 

    yAxisRight2 = d3.svg.axis().scale(y2).orient("right").ticks(1).tickFormat((d) => d + " Hz");

    valueline = d3.svg.line()
        .interpolate("basis")
        .defined(function(d) {return d.pitch != null && d.pitch != undefined && !isNaN(d.pitch);})
        .x(function(d) { return x(d.time); })
        .y(function(d) { return y0(d.pitch); });
    
    valueline2 = d3.svg.line()
        .interpolate("basis")
        .defined(function(d) {return d.intensity != null && d.intensity != undefined && !isNaN(d.intensity);})
        .x(function(d) { return x(d.time); })
        .y(function(d) { 
          if (d.intensity < 0) return y1(0);
          else if (isNaN(d.intensity)) return y1(0);
          else return y1(d.intensity); 
        });
    
    formantLine1 = d3.svg.line()
    .interpolate("basis")
    .defined(function(d) {return d.formant1 != null && d.formant1 != undefined && !isNaN(d.formant1);})
    .x(function(d) { return x(d.time); })
    .y(function(d) { 
      if (d.formant1 < 0) return y2(0);
      else if (isNaN(d.formant1)) return y2(0);
      else return y2(d.formant1); 
    });

    formantLine2 = d3.svg.line()
    .interpolate("basis")
    .defined(function(d) {return d.formant2 != null && d.formant2 != undefined && !isNaN(d.formant2);})
    .x(function(d) { return x(d.time); })
    .y(function(d) { 
      if (d.formant2 < 0) return y2(0);
      else if (isNaN(d.formant2)) return y2(0);
      else return y2(d.formant2); 
    });
    formantLine3 = d3.svg.line()
    .interpolate("basis")
    .defined(function(d) {return d.formant3 != null && d.formant3 != undefined && !isNaN(d.formant3);})
    .x(function(d) { return x(d.time); })
    .y(function(d) { 
      if (d.formant3 < 0) return y2(0);
      else if (isNaN(d.formant3)) return y2(0);
      else return y2(d.formant3); 
    });
    formantLine4 = d3.svg.line()
    .interpolate("basis")
    .defined(function(d) {return d.formant4 != null && d.formant4 != undefined && !isNaN(d.formant4);})
    .x(function(d) { return x(d.time); })
    .y(function(d) { 
      if (d.formant4 < 0) return y2(0);
      else if (isNaN(d.formant4)) return y2(0);
      else return y2(d.formant4); 
    });

    xTime = function(d) {
      if (isNaN(d.time)) return 0;
      else return x(d.time); 
    }
    yFormant1 = function(d) {
      if (isNaN(d.formant1) || isNaN(d.pitch)) return 5000;
      else return y2(d.formant1); 
    }
    yFormant2 = function(d) {
      if (isNaN(d.formant2) || isNaN(d.pitch)) return 5000;
      else return y2(d.formant2); 
    }
    yFormant3 = function(d) {
      if (isNaN(d.formant3) || isNaN(d.pitch)) return 5000;
      else return y2(d.formant3); 
    }
    yFormant4 = function(d) {
      if (isNaN(d.formant4) || isNaN(d.pitch)) return 5000;
      else return y2(d.formant4); 
    }

    svg = d3.select("#chart").append("svg")
        .attr("width", width /*+ margin.left + margin.right*/)
        .attr("height", height /*+ margin.top*/ + margin.bottom)
        .attr("id", "lines")
      .append("g");
}

function initializeGraph(){ 
    d3.tsv("uploads/temp.graph", function(error, data) {
    if (error) throw error;
    
    data.forEach(function(d) {
        d.time = parseTime(d.time);
        // convert string to numerical value
        d.pitch = +d.pitch;
        d.intensity = +d.intensity;
        d.formant1 = +d.formant1;
        d.formant2 = +d.formant2;
        d.formant3 = +d.formant3;
        d.formant4 = +d.formant4;
    });
    
    x.domain(d3.extent(data, function(d) { return d.time; }));
    // y0: pitch axis
    y0.domain([Math.min(d3.min(data, function(d) {return Math.min(d.pitch);}), 75),
       Math.max(d3.max(data, function(d) {return Math.max(d.pitch);}), 500)]); 
    // similar for y1 intensity axis and y2 (formant axis)
    y1.domain([Math.max(Math.min(d3.min(data, function(d) {return Math.min(d.intensity);}), 50), 0), Math.max(d3.max(data, function(d) {return Math.max(d.intensity);}), 100)]);
    y2.domain([Math.min(d3.min(data, function(d) {return Math.min(d.formant1);}), 0), Math.max(d3.max(data, function(d) {return Math.max(d.formant4);}), 5000)]); 
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis); // height: height of the graph
    d3.select("#axis").append("g")
      .attr("class", "y axis a-left fill-color2")
      .call(yAxisLeft);
    d3.select("#axis").append("g")
      .attr("class", "y axis a-right fill-color3")
      .attr("transform", "translate(" + width + " ,0)")
      .call(yAxisRight); // width: width of the graph

    d3.select("#axis").append("g")
      .attr("class", "y axis a-right fill-color4")
      .attr("transform", "translate(" + width + " ,0)")
      .call(yAxisRight2);

    d3.select('g.y.axis.a-right.fill-color3').selectAll('g.tick').select('line').attr("x2", "-6")
    d3.select('g.y.axis.a-right.fill-color3').selectAll('g.tick').select('text').attr("x", "-60")
    d3.select('g.y.axis.a-right.fill-color3').select('g.tick').select('line').attr("x2", "-6")
    d3.select('g.y.axis.a-right.fill-color3').select('g.tick').select('text').attr("x", "-50").attr("y", "-10")
      
    svg.append("path")
      .datum(data)
      .attr("class", "line2 color3 ttip")
      .attr("d", valueline2);
      
    svg.append("path")
      .datum(data)
      .attr("class", "line1 color2 ttip")
      .attr("d", valueline);

    svg.append("path")
      .datum(data)
      .attr("class", "fm1")
      .attr("d", formantLine1)
      .style("display", "none");

    svg.append("path")
      .datum(data)
      .attr("class", "fm2")
      .attr("d", formantLine2)
      .style("display", "none");

    svg.append("path")
      .datum(data)
      .attr("class", "fm3")
      .attr("d", formantLine3)
      .style("display", "none");

    svg.append("path")
      .datum(data)
      .attr("class", "fm4")
      .attr("d", formantLine4)
      .style("display", "none");

    svg.selectAll(".dot1")
    .data(data).enter().append("circle")
    .attr("class", "dot1").attr("r", 2)
    .attr("cx", xTime).attr("cy", yFormant1);

    svg.selectAll(".dot2")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot2")
      .attr("r", 2)
      .attr("cx", xTime)
      .attr("cy", yFormant2); 

    svg.selectAll(".dot3")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot3")
      .attr("r", 2)
      .attr("cx", xTime)
      .attr("cy", yFormant3); 
 
    svg.selectAll(".dot4")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot4")
      .attr("r", 2)
      .attr("cx", xTime)
      .attr("cy", yFormant4);

// Create tooltip
var mouseG
var lineStroke = "2px"
// Create hover tooltip with vertical line
tooltip = d3.select("#chart").append("div")
.attr('id', 'tooltip')
.style('position', 'absolute')
.style("background-color", "#D3D3D3")
.style('padding', "6px")
.style('display', 'none')

mouseG = svg.append("g")
.attr("class", "mouse-over-effects");

mouseG.append("path") // create vertical line to follow mouse
.attr("class", "mouse-line")
.style("stroke", "#A9A9A9")
.style("stroke-width", lineStroke)
.style("opacity", "0");

var lines = document.getElementsByClassName('ttip');

var mousePerLine = mouseG.selectAll('.mouse-per-line')
    .data(d3.range(lines.length)) 
    .enter()
    .append("g")
    .attr("class", "mouse-per-line");

mousePerLine.append("circle")
    .attr("r", 4)
    .style("stroke", "red")
    .style("fill", "none")
    .style("stroke-width", lineStroke)
    .style("opacity", "0");

mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
    .attr('width', 5000) // Based on setGraphParams() 
    .attr('height', 180 - 20) // Based on setGraphParams()
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseout', function () { // on mouse out hide line, circles and text
        d3.select(".mouse-line")
            .style("opacity", "0");
        d3.selectAll(".mouse-per-line circle")
            .style("opacity", "0");
        d3.selectAll(".mouse-per-line text")
            .style("opacity", "0");
        d3.selectAll("#tooltip")
            .style('display', 'none')
    })
    .on('mouseover', function () { // on mouse in show line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "1");
      d3.selectAll("#tooltip")
        .style('display', 'block')
    })

    .on('mousemove', function () { // update tooltip content, line, circles and text when mouse moves
      var mouse = d3.mouse(this)
      d3.selectAll(".mouse-per-line")
        .attr("transform", function (d, i) {
          var beginning = 0,
            end = lines[i].getTotalLength(),
            target = null;
        while (true){
          target = Math.floor((beginning + end) / 2);
          pos = lines[i].getPointAtLength(target);
          if ((target === end || target === beginning) && pos.x !== mouse[0]) {
              break;
          }
          if (pos.x > mouse[0])      end = target;
          else if (pos.x < mouse[0]) beginning = target;
          else break; //position found
        }
        d3.select(".mouse-line")
            .attr("d", function () {
              var d = "M" + mouse[0] + "," + 185;
              d += " " + mouse[0] + "," + 0;
              return d;
            });
        return "translate(" + mouse[0] + "," + pos.y +")";
        });

      updateTooltipContent(mouse, data)
    }) 
    }); 
};

function zoom(value){ 
  document.getElementsByTagName('svg')[0].setAttribute('width', value + '');
  document.getElementsByTagName('svg')[1].setAttribute('width', value + '');
  width = value;
  x = d3.time.scale().range([0, width]);
  xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(d3.time.seconds, 1)
    .tickFormat(d3.time.format("%M:%S"));
  document.getElementsByTagName('g')[3].setAttribute("transform", "translate(" + Math.min(document.getElementById('lines').clientWidth, document.getElementById("chart").offsetWidth) + " ,0)");

  d3.tsv("uploads/temp.graph", function(error, data) {
    var svg = d3.select("#drawings").transition();
      
    data.forEach(function(d) {
        d.time = parseTime(d.time);
        d.pitch = +d.pitch;
        d.intensity = +d.intensity;

        d.formant1 = +d.formant1;
        d.formant2 = +d.formant2;
        d.formant3 = +d.formant3;
        d.formant4 = +d.formant4;
      });
    
    x.domain(d3.extent(data, function(d) { return d.time; }));
    
    svg.select(".line1")
      .duration(0)
            .attr("d", valueline(data));
    
    svg.select(".line2")
    .duration(0)
          .attr("d", valueline2(data));

    svg.selectAll(".dot1").duration(0).attr("r", 2.5).attr("cx", xTime)
    .attr("cy", yFormant1);
    svg.selectAll(".dot2").duration(0).attr("r", 2.5).attr("cx", xTime)
    .attr("cy", yFormant2);
    svg.selectAll(".dot3").duration(0).attr("r", 2.5).attr("cx", xTime)
    .attr("cy", yFormant3);
    svg.selectAll(".dot4").duration(0).attr("r", 2.5).attr("cx", xTime)
    .attr("cy", yFormant4);
      
    svg.select(".x.axis") // change the x axis
          .duration(0)
          .call(xAxis);
  });
}

wavesurfer.on('scroll', function (scrollEvent) {
  var scroll = scrollEvent.target.scrollLeft;
  document.getElementsByTagName('svg')[1].style.left = -scroll + 'px'
});

  function updateTooltipContent(mouse, data) {
    var line1 = document.getElementsByClassName('line2 color3');
    var line2 = document.getElementsByClassName('line1 color2');
    var fm1 = document.getElementsByClassName('fm1');
    var fm2 = document.getElementsByClassName('fm2');
    var fm3 = document.getElementsByClassName('fm3');
    var fm4 = document.getElementsByClassName('fm4');
    var beginning1 = 0, beginning2 = 0, beginning3 = 0, beginning4 = 0, beginning5 = 0, beginning6 = 0
        end1 = line1[0].getTotalLength(), end2 = line2[0].getTotalLength();
        end3 = fm1[0].getTotalLength(), end4 = fm2[0].getTotalLength(),
        end5 = fm3[0].getTotalLength(), end6 = fm4[0].getTotalLength();
        target1 = null, target2 = null, target3 = null, target4 = null, target5 = null, target6 = null;
    while (true){
        target1 = Math.floor((beginning1 + end1) / 2);
          pos1 = line1[0].getPointAtLength(target1);
          if ((target1 === end1 || target1 === beginning1) && pos1.x !== mouse[0]) {
              break;
          }
          if (pos1.x > mouse[0])      end1 = target1;
          else if (pos1.x < mouse[0]) beginning1 = target1;
          else break; //position found
        }
    while (true){
        target2 = Math.floor((beginning2 + end2) / 2);
        pos2 = line2[0].getPointAtLength(target2);
        if ((target2 === end2 || target2 === beginning2) && pos2.x !== mouse[0]) {
          break;
        }
      if (pos2.x > mouse[0])      end2 = target2;
      else if (pos2.x < mouse[0]) beginning2 = target2;
      else break; //position found
    }
    while (true){
      target2 = Math.floor((beginning2 + end2) / 2);
      pos2 = line2[0].getPointAtLength(target2);
      if ((target2 === end2 || target2 === beginning2) && pos2.x !== mouse[0]) {
        break;
      }
      if (pos2.x > mouse[0])      end2 = target2;
      else if (pos2.x < mouse[0]) beginning2 = target2;
      else break; //position found
      }
    while (true){
      target3 = Math.floor((beginning3 + end3) / 2);
      pos3 = fm1[0].getPointAtLength(target3);
      if ((target3 === end3 || target3 === beginning3) && pos3.x !== mouse[0]) {
        break;
      }
      if (pos3.x > mouse[0])      end3 = target3;
      else if (pos3.x < mouse[0]) beginning3 = target3;
      else break; //position found
    }
    while (true){
      target4 = Math.floor((beginning4 + end4) / 2);
      pos4 = fm2[0].getPointAtLength(target4);
      if ((target4 === end4 || target4 === beginning4) && pos4.x !== mouse[0]) {
        break;
      }
      if (pos4.x > mouse[0])      end4 = target4;
      else if (pos4.x < mouse[0]) beginning4 = target4;
      else break; //position found
    }
    while (true){
      target5 = Math.floor((beginning5 + end5) / 2);
      pos5 = fm3[0].getPointAtLength(target5);
      if ((target5 === end5 || target5 === beginning5) && pos5.x !== mouse[0]) {
        break;
      }
      if (pos5.x > mouse[0])      end5 = target5;
      else if (pos5.x < mouse[0]) beginning5 = target5;
      else break; //position found
    }
    while (true){
      target6 = Math.floor((beginning6 + end6) / 2);
      pos6 = fm4[0].getPointAtLength(target6);
      if ((target6 === end6 || target6 === beginning6) && pos6.x !== mouse[0]) {
        break;
      }
      if (pos6.x > mouse[0])      end6 = target6;
      else if (pos6.x < mouse[0]) beginning6 = target6;
      else break; //position found
    }
    var milisecond = x.invert(mouse[0]).getMilliseconds();
    if (('' + milisecond).length < 3) {milisecond = '0' + milisecond;}

    tooltip.html("Time: " + x.invert(mouse[0]).getSeconds() + "." + milisecond
    + "s<br><span style='font-size: 10px; color: blue'>Pitch: " 
    + y0.invert(pos2.y).toFixed(2) 
    + "Hz</span><br><span style='font-size: 10px; color: #009216'>Intensity: "
    + y1.invert(pos1.y).toFixed(2) + "dB</span>"
    + "<br><span style='font-size: 10px; color: red'>Formant 1: " 
    + y2.invert(fm1[0].getPointAtLength(mouse[0]).y).toFixed(2)
    + "Hz<br>Formant 2: " + y2.invert(fm2[0].getPointAtLength(mouse[0]).y).toFixed(2)
    + "Hz<br>Formant 3: " + y2.invert(fm3[0].getPointAtLength(mouse[0]).y).toFixed(2)
    + "Hz<br>Formant 4: " + y2.invert(fm4[0].getPointAtLength(mouse[0]).y).toFixed(2) + "Hz</span>"
    ) 
    .style('display', 'block')
    .style('z-index', '2')
    .style('left', d3.event.pageX - 82 + 20 + 'px')
    .style('top', d3.event.pageY - document.getElementById('waveform').clientHeight - 320 + 'px')
    .style('font-size', '11.5px')
  }

function reset() {
  var defaultPxPerSec = 100;
  document.getElementById('zoom-start').value = "";
  document.getElementById('zoom-end').value = "";
  document.getElementById('slider').value = defaultPxPerSec;
  soundSeconds = wavesurfer.getDuration(); 
  var pxPerSec = totalPixels/soundSeconds;
	wavesurfer.zoom(pxPerSec);
  zoom(soundSeconds*pxPerSec);
}

  