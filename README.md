# Audio Processing Web
This web application uses wavesurfer.js (https://wavesurfer-js.org/) and Praat (https://www.fon.hum.uva.nl/praat/) to visualize audio waveform and analyse its pitch, intensity, and formants. You can also process the audio by converting it from stereo to mono or reducing its noise, then download the processed audio.

![alt text](https://github.com/hyla167/audio-processing-web/blob/master/demo.png)

# Supported functionalities
* Play and pause the audio
* Zoom: To zoom the audio you can either use the slider below the graph, or choose the start and end time, or select the desired part by dragging on the waveform, then click 'Zoom'
* Convert the audio to mono if it currently is stereo and vice versa.
* Reduce the noise of the audio
* Download the processed audio
* Reset the audio to the initial state (i.e complete zoom out the audio)
* View detailed information: hover over the graph to see details about time and value of pitch, formants, intensity value at the mouse pointer
* This application can be used without internet connection

# How to use
1. Clone the repository `git clone https://github.com/hyla167/audio-processing-web` and then switch to the main folder `cd audio-processing-web`
2. Run the application: `node server.js`
