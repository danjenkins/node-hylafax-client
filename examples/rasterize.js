var page = require('webpage').create(), address, output, size;
var fs = require('fs');

page.viewportSize = { width: 600, height: 600 };

page.content = fs.read('template.html');

page.render('example.pdf');

phantom.exit();