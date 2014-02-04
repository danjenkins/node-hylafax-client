var FTPClient = require('ftp');
var events = require('events').EventEmitter;
var util = require('util');
var async = require('async');
var fs = require('fs');
var zlib = require('zlib');

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

  if(params.debug !== undefined) {
    if(typeof params.debug == 'function') {
      self.debug = params.debug;
    } else if (params.debug == false) {
      self.debug = function(debug) {  };
    } else {
      self.debug = function(debug) { console.log(debug) };
    }
  } else {
    self.debug = function(debug) { console.log(debug) };
  }

  //http://www.hylafax.org/man/6.0/hfaxd.1m.html
  //going to use the send functionality in this module and it's callback methodology
  self.ftp = new FTPClient({ host: self.host, port: self.port, debug: self.debug });
  self.ftp.on('connect', function() {
    self.ftp.send('USER', self.username, function(err, res){
      if(self.password != ''){
        self.ftp.send('PASS', self.password, function(error, response){
          self.ftp._state = 'authorized';
          self.emit('ready');
        })
      }else{
        self.emit('ready');
      }
    })
  });
}

HylafaxClient.prototype.connect = function(){
  this.ftp.connect();
}

HylafaxClient.prototype.disconnect = function(){
  this.ftp.end();
}


HylafaxClient.prototype.help = function(command, cb){
  this.ftp.send('HELP', command, function(err, res){
    if(typeof cb == 'function'){
      cb(null, res);
    }
  })
}


HylafaxClient.prototype.loginAdmin = function(pass, cb){
  this.ftp.send('ADMIN', pass, function(err, res){
    if(typeof cb == 'function'){
      cb(null, res);
    }
  })
}

HylafaxClient.prototype.getStatus = function(cb){
  var self = this;
  self.getRecievedFormat(function(err, format){
    this.list('status', cb);
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

  this.ftp.send('RCVFMT', function(err, res){
    cb(null, res);
  })
}

HylafaxClient.prototype.getRecievedJobs = function(cb){
  var self = this;
  this.getRecievedFormat(function(err, data){
    var format = data.split("|");
    self._list('recvq', function(err, data){
      if(err) return cb(err);
      self._processJobs(data, format, 'recieved', cb);     
    });
  })
}

HylafaxClient.prototype.getArchivedJobs = function(cb){
  var self = this;
  this.getJobFormat(function(err, data){
    var format = data.split("|");
    self._list('archive', function(err, data){
      if(err) return cb(err);
      self._processJobs(data, format, 'archived', cb);     
    });
  })
}

HylafaxClient.prototype._transformJobFormat = function(format){
  var trans = '';
  switch(format){
    case 'A':
      trans = 'dest_sub_address';
      break;
    case 'B':
      trans = 'dest_password';
      break;
    case 'C':
      trans = 'dest_company_name';
      break;
    case 'D':
      trans = 'dials_vs_max_dials';
      break;
    case 'E':
      trans = 'desired_signalling_rate';
      break;
    case 'F':
      trans = 'client_tagline_format';
      break;
    case 'G':
      trans = 'desired_min_scanline_time';
      break;
    case 'H':
      trans = 'desired_data_format';
      break;
    case 'I':
      trans = 'client_priority';
      break;
    case 'J':
      trans = 'client_job_tag';
      break;
    case 'K':
      trans = 'desired_ecm';
      break;
    case 'L':
      trans = 'dest_geo_location';
      break;
    case 'M':
      trans = 'noti_email';
      break;
    case 'N':
      trans = 'desired_private_tagline';
      break;
    case 'O':
      trans = 'continuation_cover_page';
      break;
    case 'P':
      trans = 'pages_transmitted_vs_tota';
      break;
    case 'Q':
      trans = 'client_min_acceptable_signalling';
      break;
    case 'R':
      trans = 'dest_receiver';
      break;
    case 'S':
      trans = 'sender_identity';
      break;
    case 'T':
      trans = 'tries_vs_max_tries';
      break;
    case 'U':
      trans = 'page_chopping_threshold_inches';
      break;
    case 'V':
      trans = 'job_done';
      break;
    case 'W':
      trans = 'comms_identifier';
      break;
    case 'X':
      trans = 'job_type';
      break;
    case 'Y':
      trans = 'scheduled_date_time';
      break;
    case 'Z':
      trans = 'scheduled_unixtime';
      break;
    case 'a':
      trans = 'job_state';
      break;
    case 'b':
      trans = 'consec_failed_reties';
      break;
    case 'c':
      trans = 'client_machine_name';
      break;
    case 'd':
      trans = 'total_dials';
      break;
    case 'e':
      trans = 'public_dialstring';
      break;
    case 'f':
      trans = 'consec_failed_dials';
      break;
    case 'g':
      trans = 'group';
      break;
    case 'h':
      trans = 'page_chop_handling';
      break;
    case 'i':
      trans = 'current_priority';
      break;
    case 'j':
      trans = 'job_id';
      break;
    case 'k':
      trans = 'job_kill_time';
      break;
    case 'l':
      trans = 'page_length';
      break;
    case 'm':
      trans = 'modem';
      break;
    case 'n':
      trans = 'noti_email_handling';
      break;
    case 'o':
      trans = 'owner';
      break;
    case 'p':
      trans = 'pages_transmitted';
      break;
    case 'q':
      trans = 'job_retry_time';
      break;
    case 'r':
      trans = 'doc_resolution';
      break;
    case 's':
      trans = 'job_status_from_failure';
      break;
    case 't':
      trans = 'total_tries';
      break;
    case 'u':
      trans = 'max_tries';
      break;
    case 'v':
      trans = 'client_dialstring';
      break;
    case 'w':
      trans = 'page_width';
      break;
    case 'x':
      trans = 'max_dials';
      break;
    case 'y':
      trans = 'total_pages_to_send';
      break;
    case 'z':
      trans = 'time_to_send_job';
      break;
    default:
      trans = 'undefined';
      break;
  }
  return trans;
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
  */


  this.ftp.send('JOBFMT', function(err, response){
    cb(err, response);
  })
}

HylafaxClient.prototype._transformJobResponse = function(letter, value){
    switch(letter){
      case 'K':
        switch(value){
          case 'D':
            value = 'disabled';
            break;
          case '':
            value = 'enabled';
            break;
          case 'H':
            value = 'T.30 Annex C half duplex';
            break;
          case 'F':
            value = 'T.30 Annex C full duplex';
            break;
        }
        break;
      case 'N':
        /*
  The  N  format produces: ‘‘ ’’ (space) if the system-wide tagline format is to be used or ‘‘P’’ if a private tagline format is to
  be used.
        */
        break;
      case 'O':
  /*
  The O format produces: ‘‘N’’ if no continuation cover page is to be used or ‘‘ ’’ (space) if the system default 
  handling for continuation cover pages is to be used.
  */
        break;
      case 'X':
        switch(value){
          case 'F':
            value = 'fax';
            break;
          case 'P':
            value = 'pager';
            break;
        }
        break;
      case 'a':
        switch(value){
          case '?':
            value = 'undefined state';
            break;
          case 'T':
            value = 'suspended';
            break;
          case 'P':
            value = 'pending';
            break;
          case 'S':
            value = 'sleeping';
            break;
          case 'B':
            value = 'blocked';
            break;
          case 'W':
            value = 'waiting';
            break;
          case 'R':
            value = 'running';
            break;
          case 'D':
            value = 'done';
            break;
          case 'F':
            value = 'failed';
            break;
        }
        break;
      case 'h':
  /*
    The  h  format  produces: ‘‘D’’ if page chopping is disabled, ‘‘ ’’ (space) for the system default page chop handling, ‘‘A’’ when
  all pages are to be chopped, or ‘‘L’’ if only the last page is to be chopped.
  */
        break;
      case 'n':
        /*
  The n format produces: ‘‘ ’’ (space) when no notification messages are to be delivered, ‘‘D’’ when notification  is  to  be  sent
  when  the  job  is done, ‘‘Q’’ when notification is to be sent each time the job is requeued, or ‘‘A’’ when notification is to be
  sent for either the job completing or being requeued.
        */
        break;

    }
  return value;
}

HylafaxClient.prototype.setJobFormat = function(format, cb){
  this.ftp.send('JOBFMT', '"' + format + '"', function(response){
    cb(response);
  })
}

HylafaxClient.prototype.getCompletedJobs = function(cb){
  var self = this;
  this.getJobFormat(function(err, data){
    var format = data.split("|");
    self._list('doneq', function(err, data){
      if(err) return cb(err);
      self._processJobs(data, format, 'completed', cb);     
    });
  })
}

HylafaxClient.prototype._processJobs = function(data, format, status, cb){
  var self = this;
  var jobs = {};
  data.forEach(function(job){
    job = job.split('|');
    var result = {};
    for(i = 0; i < format.length; i++){
      var letter = /[A-Za-z]/.exec(format[i])[0];
      //if theres a dot then use whats after the dot
      var value = job[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');//trim
      result[self._transformJobFormat(letter)] = self._transformJobResponse(letter, value);
    }
    result.job_status = status;
    jobs[result.job_id] = result;
  })
  return cb(null, jobs);
}

HylafaxClient.prototype.getDocs = function(cb){
  this.list('docq', cb);
}

HylafaxClient.prototype.getExtraServerInfo = function(cb){
  this.ftp.send('RETR', 'status/any.info', function(response){
    cb(response);
  })
}

HylafaxClient.prototype.setTimezoneToLocal = function(cb){
  //can be GMT or LOCAL
  this.ftp.send('TZONE', 'LOCAL', function(response){
    cb(response);
  })
}

HylafaxClient.prototype._list = function(type, cb){
  this.ftp.list(type, function(err, res){
    cb(err, res);      
  })
}

HylafaxClient.prototype.checkJob = function(job, cb){
  //check archived jobs first
  var self = this;
  self.getArchivedJobs(function(err, jobs){
    if(err) return cb(err);
    if(jobs[job]){
      cb(null, jobs[job]);
    }else{
      //if we still haven't got the job go to completed jobs
      self.getCompletedJobs(function(err, jobs){
        if(err) return cb(err);
        if(jobs[job]){
          cb(null, jobs[job]);
        }else{
          //if we still haven't got the job go to active jobs
          self.getActiveJobs(function(err, jobs){
            if(err) return cb(err);
            if(jobs[job]){
              cb(null, jobs[job]);
            }else{
              //we still don't have the job so error out
              cb(new Error('Job not found in Hylafax'));
            }
          })
        }
      })
    }
  });
}

HylafaxClient.prototype.getActiveJobs = function(cb){
  var self = this;
  this.getJobFormat(function(err, data){
    var format = data.split("|");
    self._list('sendq', function(err, data){
      if(err) return cb(err);
      self._processJobs(data, format, 'active', cb);     
    });
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

  this.ftp.send('FILEFMT', function(response){
    cb(response);
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

  this.ftp.send('MDMFMT', function(response){
    cb(response);
  })
}

HylafaxClient.prototype.sendType = function(type,cb){
  this.ftp.send('TYPE', type ,function(err, response){
    cb(err, response);
  })
}

HylafaxClient.prototype.sendMode = function(mode,cb){
  this.ftp.send('MODE', mode ,function(err, response){
    cb(err, response);
  })
}

HylafaxClient.prototype.sendFax = function(options, stream, callback){

  if(!stream){
    callback(new Error('No file stream'));
  }

  if(!options){
    callback(new Error('No options object'));
  }

  if(!options.number){
    callback(new Error('No number to fax'));
  }

  options.user = options.user || 'NodeJS Hylafax Client';
  options.dial_attempts = options.dial_attempts || 3;
  options.tries = options.tries || 3;
  options.notification_address = options.notification_address || 'root@localhost';
  options.information = options.information || 'Hylafax Client Information';
  options.last_time = options.last_time || '000259';
  options.scheduled_priority = options.scheduled_priority || '127';
  options.vres = options.vres || '196';
  options.page_width = options.page_width || '209';
  options.page_length = options.page_length || '296';
  options.notify = options.notify || 'none';
  options.page_chop = options.page_chop || 'default';
  options.chop_threshold = options.chop_threshold || '';

  var self = this;
  var file;
  //figure out what data we have, is it a string? is it an image in a buffer?
  var zip = false;
  
  var actions = [];
  actions.push(function(cb){
    self.sendType('I', function(err, response){
      cb(err, response);
    })
  });

  /*actions.push(function(cb){
    self.sendMode('Z', function(err, response){
      zip = true;
      cb(err, response);
    })
  });*/

  actions.push(function(cb){    
    self.ftp.temp_put(stream, function(err, res){
      if(err) return cb(err);
      file = /\(FILE:\s([\/A-Za-z0-9.]+)\)/.exec(res);
      if(!file){
        return cb(new Error('No temporary file uploaded: ' +  res));
      }
      cb(err, res);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JNEW', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'FROMUSER "' + options.user + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'LASTTIME "' + options.last_time + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'MAXDIALS "' + options.dial_attempts + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'MAXTRIES "' + options.tries + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'SCHEDPRI "' + options.scheduled_priority + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'DIALSTRING "' + options.number + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'NOTIFYADDR "' + options.notification_address + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'JOBINFO "' + options.information + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'VRES "' + options.vres + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'PAGEWIDTH "' + options.page_width + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'PAGELENGTH "' + options.page_length + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'NOTIFY "' + options.notify + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'PAGECHOP "' + options.page_chop + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'CHOPTHRESHOLD "' + options.chop_threshold + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JPARM', 'DOCUMENT "' + file[1] + '"', function(err, response){    
      cb(err, response);
    })
  })

  actions.push(function(cb){
    self.ftp.send('JSUBM', function(err, response){    
      var jobid = /\d+/.exec(response)/1;
      cb(err, jobid);
    })
  })

  async.series(actions, function(err, results){
    if(err) return callback(err);
    callback(null, results[results.length - 1]);
  })
}
