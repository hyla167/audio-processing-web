clearinfo
form Parameters
	text directory 
	text basename 
endform

Read from file: directory$ + basename$ + ".wav"
Convert to mono
Save as WAV file: directory$ + basename$ + ".wav"