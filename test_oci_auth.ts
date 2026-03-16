import 'dotenv/config';
import * as oci from 'oci-sdk';

async function testAuth() {
  console.log("=== OCI Auth Diagnostic ===");
  try {
    const authProvider = new oci.common.ConfigFileAuthenticationDetailsProvider();
    
    console.log("Successfully loaded config file.");
    console.log("Tenant: ", authProvider.getTenantId());
    console.log("User: ", authProvider.getUser());
    console.log("Fingerprint: ", authProvider.getFingerprint());
    
    console.log("\nAttempting connection to Identity API...");
    const identityClient = new oci.identity.IdentityClient({
      authenticationDetailsProvider: authProvider
    });
    
    // Test a simple read operation
    const request = {
      userId: authProvider.getUser()
    };
    
    const response = await identityClient.getUser(request);
    console.log("✅ Identity API Success!");
    console.log("User name:", response.user.name);
    console.log("User description:", response.user.description);
    
  } catch (err: any) {
    console.error("❌ Diagnostic Failed:", err.message);
    if (err.statusCode) {
      console.error("Status Code:", err.statusCode);
    }
  }
}

testAuth();
