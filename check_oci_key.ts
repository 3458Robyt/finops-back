import * as crypto from 'crypto';
import * as fs from 'fs';

try {
  const privateKeyPath = 'C:/Users/DAVID/Downloads/dcenteno388@gmail.com-2026-03-14T18_05_27.459Z.pem';
  console.log(`Reading key from: ${privateKeyPath}`);
  
  const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
  
  // Extract public key from private key
  const privateKeyObj = crypto.createPrivateKey({
    key: privateKeyContent,
    format: 'pem'
  });
  
  const publicKeyObj = crypto.createPublicKey(privateKeyObj);
  const publicKeyDer = publicKeyObj.export({ type: 'spki', format: 'der' });
  
  // OCI Fingerprint is MD5 of the DER formatted public key
  const hash = crypto.createHash('md5');
  hash.update(publicKeyDer);
  const md5Digest = hash.digest('hex');
  
  // Format as fingerprint (aa:bb:cc...)
  const fingerprint = md5Digest.match(/.{1,2}/g)?.join(':') || '';
  
  console.log('\n=== OCI Key Diagnostic ===');
  console.log('Computed Fingerprint : ', fingerprint);
  console.log('Expected Fingerprint :  80:9c:81:d7:e9:e0:09:b3:7e:f1:e0:92:79:3a:a3:97');
  
  if (fingerprint === '80:9c:81:d7:e9:e0:09:b3:7e:f1:e0:92:79:3a:a3:97') {
    console.log('\n✅ Fingerprint MATCHES. The private key corresponds to the expected fingerprint.');
    console.log('If OCI is returning 401, the API Key has NOT been successfully added to the user ocid1.user.oc1..aaaaaaaa52jzczswypk3fchgfzxjvuiolbcben2ezozrujazhrvz5a64xhua in the OCI Console.');
  } else {
    console.error('\n❌ Fingerprint MISMATCH. The downloaded private key does NOT match the fingerprint in the configuration.');
    console.error(`Please update your ~/.oci/config file to use fingerprint=${fingerprint}`);
  }
} catch (error: any) {
  console.error('Error reading key:', error.message);
}
