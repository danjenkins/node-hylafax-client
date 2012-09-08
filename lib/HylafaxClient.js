/*var COMMANDS = [
    "ABOR","ACCT","ADMIN","ALLO","ANSWER","APPE","CDUP","CHMOD","CHOWN","CWD","DELE","DISABLE","ENABLE","HELP","FILEFMT","FILESORTFMT","FORM","IDLE","JDELE","JINTR","JKILL","JNEW","JOB","JOBFMT","JOBSORTFMT","JPARM","JREST","JSUBM","JSUSP","JWAIT","JGDELE","JGKILL","JGINTR","JGNEW","JGPARM","JGREST","JGRP","JGSUBM","JGSUSP","JGWAIT","LIST","MDTM","MODE","MDMFMT","MDMSORTFMT","NLST","NOOP","PASS","PASV","PORT","PWD","QUIT","RCVFMT","RCVSORTFMT","REIN","REST","RETP","RETR","SHUT","SITE","SIZE","STAT","STOR","STOT","STOU","STRU","SYST","TYPE","TZONE","USER","VRFY"
];*/

var Ftp = require('jsftp');
var events = require('events').EventEmitter;
var util = require('util');
var async = require('async');

module.exports = HylafaxClient;

util.inherits(HylafaxClient, events);

function HylafaxClient(params){
  var self = this;
  var params = params || {};
  self.host = params.host || 'localhost';
  self.hostIp = params.host || '127.0.0.1';
  self.port = params.port || 4559;
  self.username = params.username || '';
  self.password = params.password || '';

  //http://www.hylafax.org/man/6.0/hfaxd.1m.html
  //going to use the send functionality in this module and it's callback methodology

  self.ftp = new Ftp({ 
    host: self.host,
    port: self.port
  });

  //self.ftp = new FTPClient({ host: self.host, port: self.port, debug: function(debug){console.log(debug)} });
  //self.ftp.on('connect', function() {
    console.log('connected!');
     self.ftp.raw.user(self.username, function(err, res){
       if(self.password != ''){
         self.ftp.raw.pass( self.password, function(error, err, res){
           self.ftp.authenticated = true;
           self.emit('ready');
         })
       }else{
         self.emit('ready');
       }
     })
  //});
}

HylafaxClient.prototype.disconnect = function(){
  this.ftp.destroy();
}


HylafaxClient.prototype.help = function(command, cb){
  this.ftp.raw.help(command, function(err, res){
    if(typeof cb == 'function'){
      cb(null, res);
    }
  })
}


HylafaxClient.prototype.loginAdmin = function(pass, cb){
  this.ftp.raw.admin(pass, function(err, res){
    if(typeof cb == 'function'){
      cb(null, res);
    }
  })
}

HylafaxClient.prototype.getStatus = function(cb){
  var self = this;
  self.getRecievedFormat(function(format){
    self.ftp.raw.list('status', function(err, res){
      cb(null, res);
    })
  })
}

HylafaxClient.prototype.getRecievedFormat = function(cb){
  /*
  RcvFmt        The format string to use when returning status information for the -r option.  Formats are specified using printf(3S)-style  con-
  ventions but using the field identifiers listed below.  Each item can include field width, precision, left-justification, 0-fill-
  ing, etc. just as for printf; e.g. %-3b for a 3-character wide, left-justified,  blank-padded  field  containing  the  signalling
  rate.

  Format    Description
  Y         Extended representation of the time when the receive happened
  a         SubAddress received from sender (if any)
  b         Signalling rate used during receive
  d         Data format used during receive
  e         Error description if an error occurred during receive
  f         Document filename (relative to the recvq directory)
  h         Time spent receiving document (HH:MM:SS)
  i         CIDName value for received fax
  j         CIDNumber value for received fax
  l         Page length in mm
  m         Fax-style protection mode string (‘‘-rwxrwx’’)
  n         File size (number of bytes)
  o         File owner
  p         Number of pages in document
  q         UNIX-style protection flags
  r         Resolution of received data
  s         Sender identity (TSI)
  t         Compact representation of the time when the receive happened
  w         Page width in mm
  z         A ‘‘*’’ if receive is going on; otherwise ‘‘ ’’ (space)

  It  is  recommended  that  all items include a field width so that the width of column title strings can be constrained when con-
  structing headers from the format string.
  */
  console.log('getting rcvfmt');
  this.ftp.raw.rcvfmt( function(err, res){
    console.log(res);
    cb(null, res);
  })
}

HylafaxClient.prototype.getRecievedJobs = function(cb){
  this.ftp.raw.list('recvq', function(err, res){
    cb(res);
  })
}

HylafaxClient.prototype.getArchivedJobs = function(cb){
  this.ftp.raw.list('archive', function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.getJobFormat = function(cb){
  
  /*
  JobFmt        The  format  string  to  use  when  returning  job  status  information  for  the -s and -d options.  Formats are specified using
  printf(3S)-style conventions but using the field identifiers listed below.  Each item can include field width,  precision,  left-
  justification,  0-filling, etc. just as for printf; e.g. %-3j for a 3-character wide, left-justified, blank-padded field contain-
  ing the job state.

  Format    Description
  A         Destination SubAddress
  B         Destination Password
  C         Destination company name
  D         Total # dials/maximum # dials
  E         Desired signalling rate
  F         Client-specific tagline format string
  G         Desired min-scanline time
  H         Desired data format
  I         Client-specified scheduling priority
  J         Client-specified job tag string
  K         Desired use of ECM (one-character symbol)
  L         Destination geographic location
  M         Notification e-mail address
  N         Desired use of private tagline (one-character symbol)
  O         Whether to use continuation cover page (one-character symbol)
  P         # pages transmitted/total # pages to transmit
  Q         Client-specified minimum acceptable signalling rate
  R         Destination person (receiver)
  S         Sender’s identity
  T         Total # tries/maximum # tries
  U         Page chopping threshold (inches)
  V         Job done operation
  W         Communication identifier
  X         Job type (one-character symbol)
  Y         Scheduled date and time
  Z         Scheduled time in seconds since the UNIX epoch
  a         Job state (one-character symbol)
  b         # consecutive failed tries
  c         Client machine name
  d         Total # dials
  e         Public (external) format of dialstring
  f         # consecutive failed dials
  g         Group identifier
  h         Page chop handling (one-character symbol)
  i         Current scheduling priority
  j         Job identifier
  k         Job kill time
  l         Page length in mm
  m         Assigned modem
  n         E-mail notification handling (one-character symbol)
  o         Job owner
  p         # pages transmitted
  q         Job retry time (MM::SS)
  r         Document resolution in lines/inch
  s         Job status information from last failure
  t         Total # tries attempted
  u         Maximum # tries
  v         Client-specified dialstring
  w         Page width in mm
  x         Maximum # dials
  y         Total # pages to transmit
  z         Time to send job

  The K format produces: ‘‘D’’ if ECM is to be disabled, ‘‘ ’’ (space) if ECM use is enabled, ‘‘H’’ if T.30 Annex C half duplex  is
  enabled, or ‘‘F’’ if T.30 Annex C full duplex is enabled.

  The  N  format produces: ‘‘ ’’ (space) if the system-wide tagline format is to be used or ‘‘P’’ if a private tagline format is to
  be used.

  The O format produces: ‘‘N’’ if no continuation cover page is to be used or ‘‘ ’’ (space) if the system default handling for con-
  tinuation cover pages is to be used.
  z         Time to send job

  The K format produces: ‘‘D’’ if ECM is to be disabled, ‘‘ ’’ (space) if ECM use is enabled, ‘‘H’’ if T.30 Annex 
  C half duplex  is
  enabled, or ‘‘F’’ if T.30 Annex C full duplex is enabled.

  The  N  format produces: ‘‘ ’’ (space) if the system-wide tagline format is to be used or ‘‘P’’ if a private tag
  line format is to
  be used.

  The O format produces: ‘‘N’’ if no continuation cover page is to be used or ‘‘ ’’ (space) if the system default 
  handling for con-
  tinuation cover pages is to be used.

  The X format produces: ‘‘F’’ for a facsimile job or ‘‘P’’ for a pager job.

  The  a format produces: ‘‘?’’ for a job in an undefined state, ‘‘T’’ for a suspended job (not being scheduled), ‘‘P’’ for a pend-
  ing job (waiting for its time to send to arrive), ‘‘S’’ for a sleeping job (waiting for a  scheduled  timeout  such  as  a  delay
  between  attempts  to  send), ‘‘B’’ for a job blocked by concurrent activity to the same destination, ‘‘W’’ for a job waiting for
  resources such as a free modem, ‘‘R’’ for a job that is actively running, and ‘‘D’’ for a job that is done  and  was  a  success.
  ‘‘F’’ for a job that failed to complete.

  The  h  format  produces: ‘‘D’’ if page chopping is disabled, ‘‘ ’’ (space) for the system default page chop handling, ‘‘A’’ when
  all pages are to be chopped, or ‘‘L’’ if only the last page is to be chopped.

  The n format produces: ‘‘ ’’ (space) when no notification messages are to be delivered, ‘‘D’’ when notification  is  to  be  sent
  when  the  job  is done, ‘‘Q’’ when notification is to be sent each time the job is requeued, or ‘‘A’’ when notification is to be
  sent for either the job completing or being requeued.

  It is recommended that all items include a field width so that the width of column title strings can  be  constrained  when  con-
  structing headers from the format string.
  */


  this.ftp.raw.jobfmt(function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.getCompletedJobs = function(cb){
  this.ftp.raw.list('doneq', function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.getDocs = function(cb){
  this.ftp.raw.list('docq', function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.getExtraServerInfo = function(cb){
  this.ftp.raw.retr('status/any.info', function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.setTimezoneToLocal = function(cb){
  //can be GMT or LOCAL
  this.ftp.raw.tzone('LOCAL', function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.getActiveJobs = function(cb){
  this.ftp.raw.list('sendq', function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.getFileFormat = function(cb){
  
  /*
  The format string to use when returning file status information with the -f option.  Formats are specified using printf(3S)-style conventions but using the field identifiers listed below.
  Each item can include field width, precision, left-justification, 0-filling, etc. just as for printf; e.g. %-8p for an 8-character wide, left-justified, blank-padded field containing the file protection flags.

  Format    Description
  a         Last access time
  c         Creation time
  d         Device number (octal)
  f         Filename
  g         Group identifier (decimal)
  i         Inode number (decimal)
  l         Link count (decimal)
  m         Last modification time
  o         Owner (based on file GID)
  p         Fax-style protection flags (no group bits)
  q         UNIX-style protection flags
  r         Root device number (octal)
  s         File size in bytes (decimal)
  u         User identifier (decimal)
  */

  this.ftp.raw.filefmt(function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.getModemFormat = function(cb){
  
  /*
  ModemFmt      The  format  string to use when returning modem status information.  Formats are specified using printf(3S)-style conventions but
  using the field identifiers listed below.  Each item can include field width, precision, left-justification, 0-filling, etc. just
  as  for  printf; e.g. %-8h for an 8-character wide, left-justified, blank-padded field containing the name of the host the server
  is running on.

  Format    Description
  h         Server hostname
  l         Local identifier string
  m         Canonical modem name
  n         FAX phone number
  r         Maximum pages that can be received in a single call
  s         Status information string
  t         Server and session tracing levels (xxxxx:yyyyy)
  v         Modem speaker volume as one-character symbol
  z         A ‘‘*’’ if a faxgetty(8C) process is running; otherwise ‘‘ ’’ (space)
  */

  this.ftp.raw.mdmfmt(function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.sendPort = function(port_a, port_b, cb){

  var port_host = this.hostIp.split('.');
  port_host.push(port_a, port_b);

  this.ftp.raw.port(port_host.join(',') ,function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.sendType = function(type, cb){
  this.ftp.raw.type('I' ,function(err, res){
    cb(err, res);
  })
}

HylafaxClient.prototype.sendMode = function(mode, cb){
  this.ftp.raw.mode('Z' ,function(err, res){
    cb(err, res);
  })
}


HylafaxClient.prototype.sendFax = function(data, number, callback){

  var self = this;

  //figure out what data we have, is it a string? is it an image in a buffer?
  var actions = [];
  actions.push(function(cb){
    self.sendType('I', function(err, res){
      console.log(err, res);
      cb(null, true);
    })
  });

  //actions.push(function(cb){
  //  self.sendPort(137, 217, function(err, res){
  //    cb(null, true);
  //  })
  //});

  actions.push(function(cb){
    self.sendMode('Z', function(err, res){
      cb(null, true);
    })
  });

  actions.push(function(cb){
    var buffer = new Buffer('text text text');

    var cmdQueue = self.ftp.cmdQueue;
    self.ftp.getPassiveSocket(function(err, socket) {
      self.ftp.raw.stot(function(err, res){
        console.log(2344, err, res);
        setTimeout(function() {
          if (socket && socket.writable) {
            socket.end(buffer);
            callback();
          }else {
            console.log("ftp error: couldn't retrieve pasv connection for command 'stot'");
          }
        }, 100);
      })
    });
  })

  async.series(actions, function(err, results){
    console.log('Finished?');
    callback();
  })

  /*sendfax -T1 -n -vv -i test -d 07976559930 /tmp/faxlog 

->>>>>convert to image

->>>>>> make phone number nice format

--> return result "07976559930"

-> TYPE I

200 Type set to Image.

SEND compressed data, 550841 bytes

-> PORT 127,0,0,1,132,217

200 PORT command successful.

-> MODE Z

200 Mode set to ZIP.

----------------------------------------------

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

request id is 11741 (group id 11741) for host localhost (1 file)*/
}








 
