import * as oci from 'oci-sdk';

async function testUsageApi() {
  console.log("=== OCI Usage API Diagnostic ===");
  try {
    const authProvider = new oci.common.ConfigFileAuthenticationDetailsProvider();
    const tenantId = authProvider.getTenantId();
    console.log("Tenant ID:", tenantId);

    const usageClient = new oci.usageapi.UsageapiClient({
      authenticationDetailsProvider: authProvider
    });

    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - 2); // 2 days ago to ensure data might exist
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    endDate.setUTCHours(0, 0, 0, 0);

    console.log(`Querying from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const request: oci.usageapi.requests.RequestSummarizedUsagesRequest = {
      requestSummarizedUsagesDetails: {
        tenantId: tenantId,
        timeUsageStarted: startDate,
        timeUsageEnded: endDate,
        granularity: oci.usageapi.models.RequestSummarizedUsagesDetails.Granularity.Daily,
        queryType: oci.usageapi.models.RequestSummarizedUsagesDetails.QueryType.Cost,
        groupBy: ['service']
      }
    };

    console.log("Sending request to OCI...");
    const response = await usageClient.requestSummarizedUsages(request);
    console.log("✅ Usage API Success!");
    console.log("Returned Items:", response.usageAggregation.items?.length || 0);
    
  } catch (err: any) {
    console.error("\n❌ Usage API Failed");
    console.error("Status Code:", err.statusCode);
    console.error("OCI Error Code:", err.serviceCode ?? err.code ?? "Unknown");
    console.error("Message:", err.message);
    console.error("Opc-Request-Id:", err.opcRequestId ?? "N/A");
    
    if (err.statusCode === 404 || err.statusCode === 401) {
      console.log("\n💡 TIPS:");
      console.log("1. Si la cuenta es nueva y no tiene facturación todavía, OCI puede devolver 404.");
      console.log("2. Verifica que el policy 'Let users analyze costs' esté asociado al grupo donde está tu usuario (ej. Administrators).");
      console.log("3. La política exacta debería ser: Allow group <TuGrupo> to read usage-reports in tenancy");
    }
  }
}

testUsageApi();
