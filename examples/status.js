var Hylafax = require('../index');
var fs = require('fs');

var hylafax = new Hylafax({host: '127.0.0.1', port: 4559, username: 'username', password: 'password', debug: true});

hylafax.on('ready', function(){
  console.log('READY');


  hylafax.loginAdmin('adminpass', function(err, res){

    console.log('logged in as admin', err, res);

    hylafax.setJobFormat('%-4j|%3i|%1a|%6.6o|%-12.12e|%5P|%5D|%7z|%25.25s', function(err, data){
      hylafax.getCompletedJobs(function(err, data){
        console.log('got status', err, data);
      })
    });

  })
})




hylafax.connect();

//adminpass


process.once('SIGINT', function(){
  hylafax.disconnect();
  process.exit();
})
