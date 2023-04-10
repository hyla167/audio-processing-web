clearinfo
form Parameters
	text directory 
	text basename 
endform

Read from file: directory$ + basename$ + ".wav"
Reduce noise: 0, 0, 0.025, 80, 10000, 40, -20, "spectral-subtraction"
Save as WAV file: directory$ + basename$ + ".wav"