import * as fs from 'fs'
import * as route53 from '@aws-sdk/client-route-53'

const hostedZoneId = 'CHANGEME'
const r53Client = new route53.Route53Client()

const main = async () => {
  // Get details of hosted zone by hosted zone id.
  const { HostedZone: hostedZone } = await r53Client.send(
    new route53.GetHostedZoneCommand({
      Id: hostedZoneId,
    }),
  )

  if (!hostedZone) {
    return
  }

  // Get DNS records.
  const { ResourceRecordSets: resourceRecordSets } = await r53Client.send(
    new route53.ListResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
    }),
  )

  // Filtering DNS records.
  const changeRecords: route53.Change[] = []
  for (const record of resourceRecordSets ?? []) {
    if (!record.Type) {
      continue
    }

    // Ignore record existing in the new hosted zone...!!
    if (record.Name === hostedZone.Name && ['NS', 'SOA'].includes(record.Type)) {
      continue
    }

    const changeRecord: route53.Change = {
      Action: 'CREATE',
      ResourceRecordSet: record,
    }
    changeRecords.push(changeRecord)
  }

  const changeResourceRecordSets: route53.ChangeBatch = {
    Changes: changeRecords,
  }

  // Output in JSON format.
  fs.writeFileSync(`${hostedZoneId}.json`, JSON.stringify(changeResourceRecordSets, null, 2))

  console.log(`count of output records: ${changeRecords.length}`)
}

main()
