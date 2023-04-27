const http = require('http');
const fs = require('fs');
const express = require("express");
const app = express();
var path = require('path');
const multer = require("multer");
const util = require('util');
const exec = util.promisify(require('child_process').exec);


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, 'temp' + '.wav')
  }
})

var upload = multer({ storage: storage })

app.use(express.static(__dirname));
app.get('/', async function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post("/toHomepage", async function (req, res) {
  var directory = `${__dirname}/uploads`
  // Delete all temporary files after back to homepage
  fs.readdir(directory, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err;
      });
    }
  });
  // Back to homepage
  res.redirect('/');
})
app.get('/viewdata', function (req, res) {
  res.sendFile(__dirname + '/viewer.html')
})

app.get('/mono', function (req, res) {
  res.sendFile(__dirname + '/mono.html')
})

app.get('/stereo', function (req, res) {
  res.sendFile(__dirname + '/stereo.html')
})

app.get('/filter', function (req, res) {
  res.sendFile(__dirname + '/filter.html')
})

app.get('/download', async function (req, res) {
  const file = `${__dirname}/uploads/temp.wav`;
  res.download(file); // Set disposition and send it.
})

const server = http.createServer((req, res) => {

  var filePath = '.' + req.url;
  if (filePath == './')
      filePath = './index.html';
  var extname = path.extname(filePath);
  var contentType = 'text/html';
  switch (extname) {
      case '.js':
          contentType = 'text/javascript';
          break;
      case '.css':
          contentType = 'text/css';
          break;
      case '.json':
          contentType = 'application/json';
          break;
      case '.png':
          contentType = 'image/png';
          break;      
      case '.jpg':
          contentType = 'image/jpg';
          break;
      case '.wav':
          contentType = 'audio/wav';
          break;
  }
  if (req.url === '/') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/html'
        });
        res.end(data);
      }
    });
  } else if (req.url === '/general.js') {
    fs.readFile('general.js', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading general.js');
      } else {
        res.writeHead(200, {
          'Content-Type': 'application/javascript'
        });
        res.end(data);
      }
    });
  } else if (req.url === '/styles.css') {
    fs.readFile('styles.css', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading styles.css');
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/css'
        });
        res.end(data);
      }
    });
  } 
   else {
    res.writeHead(404);
    res.end('File not found');
  }
});

app.listen(3000, function() {
  console.log('Server started on port 3000');
});

app.post("/view", upload.single("musicFile"), async function (req, res, next) {
  var filename = req.file.filename.slice(0, -4); // "audio.wav" -> "audio"
  exec(`Praat.exe --run script\\extractData.praat ..\\uploads\\ ${filename}`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  // wait until the audio has completely processed
  await new Promise(resolve => setTimeout(resolve, 12000));
  res.redirect('/viewdata');

});

app.post("/toMono", async function (req, res) {
  exec(`Praat.exe --run script\\convertToMono.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 8000));
  exec(`Praat.exe --run script\\extractData.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 8000));
  res.redirect('/mono');
});

app.post("/toStereo", async function (req, res) {
  exec(`Praat.exe --run script\\convertToStereo.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 8000));
  exec(`Praat.exe --run script\\extractData.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 8000));
  res.redirect('/stereo');
});

app.post("/toFilter", async function (req, res) {
  exec(`Praat.exe --run script\\reduceNoise.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 24500));
  exec(`Praat.exe --run script\\extractData.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 5000));
  res.redirect('/filter');
});

app.post("/toMonoFilter", async function (req, res) {
  exec(`Praat.exe --run script\\reduceNoise.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 9000));
  exec(`Praat.exe --run script\\extractData.praat ..\\uploads\\ temp`,
    (e, stdout, stderr)=> {
      if (e instanceof Error) {
          console.error(e);
          throw e;
      }
      console.log('stdout ', stdout);
      console.log('stderr ', stderr);})
  await new Promise(resolve => setTimeout(resolve, 7000));
  res.redirect('/filter');
});