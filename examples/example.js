var Hylafax = require('../index');
var fs = require('fs');


var hylafax = new Hylafax({host: '127.0.0.1', port: 4559, username: 'username', password: 'password', debug: true});

hylafax.on('ready', function(){
  console.log('READY');


  hylafax.loginAdmin('adminpass', function(err, res){

    console.log('logged in as admin', err, res);

    // hylafax.getStatus(function(){
    //    console.log('got status');
    // })

    hylafax.sendFax(fs.createReadStream('foo.ps'), '0123456789', function(err, res){
      console.log('NO WOO!', err, res);
    })
    //hylafax.help('STOT', function(err, res){
    //  console.log(res);
    //})
  })

  //hylafax.ftp.send('JOB', '4922' ,function(err, res){
  //  console.log(err, res);
  //})
})




hylafax.connect();

//adminpass


process.once('SIGINT', function(){
  hylafax.disconnect();
  process.exit();
})


//EXAMPLE OF SEND THROUGH SENDFAX

/*
sendfax -T1 -n -vv -i test -d 07976559930 /tmp/faxlog

Trying localhost (127.0.0.1) at port 4559...

Connected to localhost.

220 localhost server (HylaFAX (tm) Version 4.3.10) ready.

-> USER root

230 User root logged in.

match against (..., 512)

rule: offset 0 string = "%!" -- failed (comparison)

rule: offset 0 short = 0x4d4d -- failed (comparison)

rule: offset 0 short = 0x4949 -- failed (comparison)

rule: offset 0 short = 0x1da -- failed (comparison)

rule: offset 0 short = 0x1f1e -- failed (comparison)

rule: offset 0 short = 0x1f9d -- failed (comparison)

rule: offset 0 short = 0x506 -- failed (comparison)

rule: offset 0 short = 0x5343 -- failed (comparison)

rule: offset 0 short = 0xf702 -- failed (comparison)

rule: offset 0 string = "GIF" -- failed (comparison)

rule: offset 0 long = 0x59a66a95 -- failed (comparison)

rule: offset 0 string = "%PDF" -- failed (comparison)

rule: offset 0 string = "x T psc" -- failed (comparison)

rule: offset 0 string = "begin" -- failed (comparison)

rule: offset 0 string = "xbtoa" -- failed (comparison)

rule: offset 0 string = "P1" -- failed (comparison)

rule: offset 0 string = "P2" -- failed (comparison)

rule: offset 0 string = "P3" -- failed (comparison)

rule: offset 0 string = "P4" -- failed (comparison)

rule: offset 0 string = "P5" -- failed (comparison)

rule: offset 0 string = "P6" -- failed (comparison)

rule: offset 0 string = "WNGZWZSS" -- failed (comparison)

rule: offset 0 string = "#Inventor V" -- failed (comparison)

rule: offset 0 string = "\x89PNG" -- failed (comparison)

rule: offset 0 short = 0xffd8 -- failed (comparison)

rule: offset 0 short = 0xd8ff -- failed (comparison)

rule: offset 0 string = "#FIG" -- failed (comparison)

rule: offset 0 ascii = -- success (result postscript, rule "%F/textfmt -B -f Courier-Bold -Ml=0.4in -p 11 -s %s >%o <%i")

CONVERT "/usr/sbin/textfmt -B -f Courier-Bold -Ml=0.4in -p 11 -s default >'/tmp//sndfaxFCqaMn' <'/tmp/faxlog'"

Apply DisplayNumber rules to "07976559930"

--> return result "07976559930"

-> TYPE I

200 Type set to Image.

SEND compressed data, 550841 bytes

-> PORT 127,0,0,1,132,217

200 PORT command successful.

-> MODE Z

200 Mode set to ZIP.

-> STOT

150 FILE: /tmp/doc11740.ps (Opening new data connection).

SEND 12325 bytes transmitted (44.7x compression)

226 Transfer complete (FILE: /tmp/doc11740.ps).

-> JNEW

200 New job created: jobid: 11741 groupid: 11741.

-> JPARM FROMUSER "root"

213 FROMUSER set to "root".

-> JPARM LASTTIME 000259

213 LASTTIME set to 000259.

-> JPARM MAXDIALS 1

213 MAXDIALS set to 1.

-> JPARM MAXTRIES 3

213 MAXTRIES set to 3.

-> JPARM SCHEDPRI 127

213 SCHEDPRI set to 127.

-> JPARM DIALSTRING "07976559930"

213 DIALSTRING set to "07976559930".

-> JPARM NOTIFYADDR "root@localhost"

213 NOTIFYADDR set to "root@localhost".

-> JPARM JOBINFO "test"

213 JOBINFO set to "test".

-> JPARM VRES 196

213 VRES set to 196.

-> JPARM PAGEWIDTH 209

213 PAGEWIDTH set to 209.

-> JPARM PAGELENGTH 296

213 PAGELENGTH set to 296.

-> JPARM NOTIFY "none"

213 NOTIFY set to "none".

-> JPARM PAGECHOP "default"

213 PAGECHOP set to "default".

-> JPARM CHOPTHRESHOLD 3

213 CHOPTHRESHOLD set to 3.

-> JPARM DOCUMENT /tmp/doc11740.ps

200 Added document /tmp/doc11740.ps as docq/doc11740.ps.11741.

-> JSUBM

200 Job 11741 submitted.

request id is 11741 (group id 11741) for host localhost (1 file)
*/