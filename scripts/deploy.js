import Client from 'ssh2-sftp-client';
import { readdirSync } from 'fs';

const config = {
  host: '145.79.212.201',
  port: 65002,
  username: 'u276796116',
  password: 'Qubnix123@',
};

const root = '/home/u276796116/domains/vishwakarmabathouse.in/public_html';

const client = new Client();

try {
  await client.connect(config);
  console.log('Connected to SFTP');

  // 1. Upload index.html
  await client.put('dist/index.html', `${root}/index.html`);
  console.log('Uploaded: index.html');

  // 1b. Upload api/upload/image.php
  await client.put('api/upload/image.php', `${root}/api/upload/image.php`);
  console.log('Uploaded: api/upload/image.php');

  // 2. Scan local dist/assets to find JS and CSS
  const localAssets = readdirSync('dist/assets');
  const jsFiles = localAssets.filter(f => f.endsWith('.js'));
  const cssFiles = localAssets.filter(f => f.endsWith('.css'));
  
  const toUpload = [...jsFiles, ...cssFiles];
  console.log('Local assets to upload:', toUpload);

  for (const file of toUpload) {
    await client.put(`dist/assets/${file}`, `${root}/assets/${file}`);
    console.log(`Uploaded: ${file}`);
  }

  // 3. Clean up remote assets that are old JS/CSS files
  try {
    const remoteAssets = await client.list(`${root}/assets`);
    for (const item of remoteAssets) {
      if (item.type !== 'd' && (item.name.endsWith('.js') || item.name.endsWith('.css'))) {
        if (!toUpload.includes(item.name)) {
          console.log(`Deleting old remote bundle: ${item.name}`);
          await client.delete(`${root}/assets/${item.name}`);
        }
      }
    }
  } catch (err) {
    console.warn('Could not clean up remote assets:', err.message);
  }

  console.log('Deploy complete!');
} catch (err) {
  console.error('Deploy failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
