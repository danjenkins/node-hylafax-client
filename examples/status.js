var Hylafax = require('../index');
var fs = require('fs');


//var hylafax = new Hylafax({host: 'barbara.holidayextras.local', port: 4559, username: 'node_faxer', password: 'n0D3HylAfaxUseR'/*, debug: true*/});
var hylafax = new Hylafax({host: '192.168.233.128', port: 4559, username: 'dan', password: 'password', debug: true});

hylafax.on('ready', function(){
  console.log('READY');

  
  //hylafax.loginAdmin('aDmiNn03ehyLafAx', function(err, res){
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
