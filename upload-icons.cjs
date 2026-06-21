const ftp = require('basic-ftp');
const fs = require('fs');

const PUBLIC = __dirname + '/public';
const REMOTE = '/home/user/web/srv1516944.hstgr.cloud/public_html';

async function upload() {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({ host:'82.25.87.157', user:'u108221933.nmvapp.com', password:'Producers0587@', port:21, secure:false });
    console.log('FTP OK');
    await client.ensureDir(REMOTE);
    console.log('Remote dir OK');
    const files = ['icon-192x192.png','icon-512x512.png','manifest.json','nmv-icon.svg'];
    for (const f of files) {
      const local = PUBLIC + '/' + f;
      if (fs.existsSync(local)) {
        await client.uploadFrom(local, f);   // upload to CWD (already in REMOTE)
        console.log('✓ Uploaded:', f, '(' + Math.round(fs.statSync(local).size/1024) + 'KB)');
      } else {
        console.log('NOT FOUND:', f);
      }
    }
    console.log('Done!');
  } catch(e) {
    console.error('FTP Error:', e.message);
  }
  client.close();
}

upload();
