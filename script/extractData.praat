# extractData.praat
clearinfo
form Parameters
	text directory 
	text basename 
endform

Read from file: directory$ + basename$ + ".wav"

# Variables for objects in Menu
sound$ = "Sound " + basename$
int$ = "Intensity " + basename$
pitch$ = "Pitch " + basename$
formant$ = "Formant " + basename$

To Intensity: 100, 0, "yes"
selectObject: sound$
To Pitch: 0, 75, 600
selectObject: sound$
To Formant (burg): 0, 5, 5500, 0.025, 50
# ......


selectObject: int$
Write to binary file: directory$ + basename$ + ".Intensity"

selectObject: pitch$
Write to binary file: directory$ + basename$ + ".Pitch"

selectObject: formant$
Write to binary file: directory$ + basename$ + ".Formant"

Read from file: directory$ + basename$ + ".Intensity"
Read from file: directory$ + basename$ + ".Pitch"
Read from file: directory$ + basename$ + ".Formant"

# objects in Menu
pitch$ = "Pitch " + basename$
int$ = "Intensity " + basename$
formant$ = "Formant " + basename$

selectObject: pitch$

start = Get start time
end = Get end time
# Write a file contains data of pitch, intensity and formants
writeFileLine: directory$ + basename$ + ".graph", "time", tab$, "pitch", tab$, "intensity", tab$, "formant1", tab$, "formant2", tab$, "formant3", tab$, "formant4"
i = start
while i <= end
	selectObject: pitch$
	resPitch = Get value at time: i,  "Hertz", "Linear"
	selectObject: int$
	resInt = Get value at time: i,  "Cubic"
	selectObject: formant$
	resFormant1 = Get value at time: 1, i, "Hertz", "Linear"
	resFormant2 = Get value at time: 2, i, "Hertz", "Linear"
	resFormant3 = Get value at time: 3, i, "Hertz", "Linear"
	resFormant4 = Get value at time: 4, i, "Hertz", "Linear"
	appendFileLine: directory$ + basename$ + ".graph", fixed$ (i, 3), tab$, fixed$ (resPitch, 2), tab$, fixed$ (resInt, 2), tab$, fixed$ (resFormant1, 2), tab$, fixed$ (resFormant2, 2), tab$, fixed$ (resFormant3, 2), tab$, fixed$ (resFormant4, 2)
	i = i + 0.01
endwhile

# clean Menu
select all
Remove

appendInfoLine: "Pitch and intensity data save in .graph file. File: ", basename$
