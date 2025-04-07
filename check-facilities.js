const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function main() {
  try {
    // Count facility activity records
    const facilityActivityCount = await prisma.facilityActivity.count();
    console.log(`Total facility-activity relationships: ${facilityActivityCount}`);

    // Check the specific ID we were using in the API call
    const testId = "11017393-d606-4a95-95bf-170e245fcc36";
    console.log(`Checking facility with ID: ${testId}`);
    
    const facilityById = await prisma.facility.findUnique({
      where: { id: testId }
    });
    
    if (facilityById) {
      console.log(`Found facility by ID: ${facilityById.name} (${facilityById.id})`);
    } else {
      console.log(`No facility found with ID: ${testId}`);
    }
    
    // Get all Main Swimming Pool facilities to see if we have multiple
    const facilities = await prisma.facility.findMany({
      where: { name: "Main Swimming Pool" }
    });
    
    console.log(`Found ${facilities.length} facilities named "Main Swimming Pool":`);
    facilities.forEach(f => {
      console.log(`- ${f.name} (${f.id})`);
      
      // Check if this matches our test ID
      if (f.id === testId) {
        console.log("  This ID matches our test ID!");
      }
    });
    
    // Check activities for the first Main Swimming Pool facility
    if (facilities.length > 0) {
      const facility = facilities[0];
      
      // Check activities for this facility
      const facilityActivities = await prisma.facilityActivity.findMany({
        where: { facilityId: facility.id },
        include: { activity: true }
      });
      
      console.log(`Found ${facilityActivities.length} activities for facility ${facility.id}:`);
      facilityActivities.forEach(fa => {
        console.log(`- ${fa.activity.name}`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 