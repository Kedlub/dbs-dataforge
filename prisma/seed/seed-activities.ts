import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';
import { Activity } from '../../src/lib/types';

const prisma = new PrismaClient();

// Create a helper type for seeding that includes facilityTypes for mapping
interface ActivitySeedData extends Activity {
	facilityTypes: string[];
}

/**
 * Seed the Activity table and FacilityActivity relations
 */
async function seedActivities() {
	console.log('🏃‍♂️ Seeding activities...');

	try {
		// Delete existing activities and facility-activity relations
		await prisma.facilityActivity.deleteMany({});
		console.log('Deleted existing facility-activity relations');

		const activityCount = await prisma.activity.count();
		if (activityCount > 0) {
			await prisma.activity.deleteMany({});
			console.log('Deleted existing activities');
		} else {
			console.log('No existing activities to delete');
		}

		// Get all facilities for later association
		const facilities = await prisma.facility.findMany();
		if (facilities.length === 0) {
			console.log('No facilities found to associate activities with');
			return [];
		}

		// Prepare activities data using the helper type
		const activitiesData: ActivitySeedData[] = [
			{
				id: randomUUID(),
				name: 'Plavání - Volná plavba',
				description: 'Běžné plavání pro všechny úrovně dovedností',
				durationMinutes: 60,
				price: 199,
				maxParticipants: 30,
				isActive: true,
				facilityTypes: ['Hlavní plavecký bazén']
			},
			{
				id: randomUUID(),
				name: 'Plavání - Trénink na dráhách',
				description: 'Zaměřeno na kondiční plavání v dráhách',
				durationMinutes: 60,
				price: 249,
				maxParticipants: 16,
				isActive: true,
				facilityTypes: ['Hlavní plavecký bazén']
			},
			{
				id: randomUUID(),
				name: 'Plavecké lekce - Začátečníci',
				description: 'Naučte se základní plavecké techniky',
				durationMinutes: 45,
				price: 349,
				maxParticipants: 8,
				isActive: true,
				facilityTypes: ['Hlavní plavecký bazén']
			},
			{
				id: randomUUID(),
				name: 'Tenis - Dvouhra',
				description: 'Rezervace kurtu pro tenisovou dvouhru',
				durationMinutes: 60,
				price: 299,
				maxParticipants: 2,
				isActive: true,
				facilityTypes: ['Tenisové kurty']
			},
			{
				id: randomUUID(),
				name: 'Tenis - Čtyřhra',
				description: 'Rezervace kurtu pro tenisovou čtyřhru',
				durationMinutes: 60,
				price: 399,
				maxParticipants: 4,
				isActive: true,
				facilityTypes: ['Tenisové kurty']
			},
			{
				id: randomUUID(),
				name: 'Tenisové lekce',
				description: 'Profesionální tenisový trénink pro všechny úrovně',
				durationMinutes: 60,
				price: 599,
				maxParticipants: 6,
				isActive: true,
				facilityTypes: ['Tenisové kurty']
			},
			{
				id: randomUUID(),
				name: 'Posilovna - Plný přístup',
				description: 'Plný přístup ke všem posilovacím strojům a vybavení',
				durationMinutes: 120,
				price: 229,
				maxParticipants: 45,
				isActive: true,
				facilityTypes: ['Hlavní fitness centrum']
			},
			{
				id: randomUUID(),
				name: 'Osobní trénink',
				description: 'Individuální trénink s osobním trenérem',
				durationMinutes: 60,
				price: 899,
				maxParticipants: 1,
				isActive: true,
				facilityTypes: ['Hlavní fitness centrum']
			},
			{
				id: randomUUID(),
				name: 'Skupinový fitness trénink',
				description: 'Vysoce intenzivní intervalový trénink ve skupině',
				durationMinutes: 45,
				price: 299,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Hlavní fitness centrum', 'Víceúčelová sportovní hala']
			},
			{
				id: randomUUID(),
				name: 'Basketbal - Celé hřiště',
				description: 'Rezervace celého hřiště pro basketbalové zápasy',
				durationMinutes: 60,
				price: 499,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Basketbalové hřiště']
			},
			{
				id: randomUUID(),
				name: 'Basketbal - Poloviční hřiště',
				description: 'Rezervace poloviny hřiště pro menší hry nebo tréninky',
				durationMinutes: 60,
				price: 299,
				maxParticipants: 10,
				isActive: true,
				facilityTypes: ['Basketbalové hřiště']
			},
			{
				id: randomUUID(),
				name: 'Jóga - Začátečníci',
				description: 'Úvod do základních jógových pozic a dechových technik',
				durationMinutes: 60,
				price: 299,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Jóga studio']
			},
			{
				id: randomUUID(),
				name: 'Jóga - Pokročilí',
				description: 'Složitější pozice a sekvence pro zkušené praktikanty',
				durationMinutes: 75,
				price: 349,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Jóga studio']
			},
			{
				id: randomUUID(),
				name: 'Pilates',
				description:
					'Cvičení zaměřené na posílení středu těla, držení a kontrolu',
				durationMinutes: 60,
				price: 329,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Jóga studio']
			},
			{
				id: randomUUID(),
				name: 'Squash - Rezervace kurtu',
				description: 'Rezervace kurtu pro squash',
				durationMinutes: 45,
				price: 229,
				maxParticipants: 2,
				isActive: false,
				facilityTypes: ['Squashové kurty']
			},
			{
				id: randomUUID(),
				name: 'Indoor cycling',
				description: 'Energický indoor cycling s hudbou',
				durationMinutes: 45,
				price: 249,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Studio pro indoor cycling']
			},
			{
				id: randomUUID(),
				name: 'Badminton',
				description: 'Rezervace kurtu pro badminton',
				durationMinutes: 60,
				price: 199,
				maxParticipants: 4,
				isActive: true,
				facilityTypes: ['Víceúčelová sportovní hala']
			},
			{
				id: randomUUID(),
				name: 'Volejbal',
				description: 'Rezervace kurtu pro volejbal',
				durationMinutes: 60,
				price: 249,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Víceúčelová sportovní hala']
			},
			{
				id: randomUUID(),
				name: 'Halový fotbal',
				description: 'Rezervace haly pro malou kopanou',
				durationMinutes: 60,
				price: 499,
				maxParticipants: 14,
				isActive: true,
				facilityTypes: ['Víceúčelová sportovní hala']
			},
			{
				id: randomUUID(),
				name: 'Karate',
				description: 'Trénink karate pro děti a dospělé',
				durationMinutes: 60,
				price: 299,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Dojo bojových umění']
			},
			{
				id: randomUUID(),
				name: 'Judo',
				description: 'Lekce juda zaměřené na techniku a kondici',
				durationMinutes: 90,
				price: 349,
				maxParticipants: 10,
				isActive: true,
				facilityTypes: ['Dojo bojových umění']
			},
			{
				id: randomUUID(),
				name: 'Fyzioterapie',
				description: 'Individuální fyzioterapeutické sezení',
				durationMinutes: 50,
				price: 799,
				maxParticipants: 1,
				isActive: true,
				facilityTypes: ['Rehabilitační centrum']
			},
			{
				id: randomUUID(),
				name: 'Masáže',
				description: 'Sportovní a relaxační masáže',
				durationMinutes: 60,
				price: 699,
				maxParticipants: 1,
				isActive: true,
				facilityTypes: ['Rehabilitační centrum']
			}
		];

		// Insert activities
		const createdActivities = await Promise.all(
			activitiesData.map(async (activityData) => {
				// Extract facilityTypes for mapping, create Activity object without it
				const { facilityTypes, ...activityCreateData } = activityData;
				return prisma.activity.create({
					data: activityCreateData
				});
			})
		);

		console.log(`Created ${createdActivities.length} activities`);

		// Create FacilityActivity relations
		let relationCount = 0;
		for (const activityData of activitiesData) {
			const activity = createdActivities.find(
				(a) => a.name === activityData.name
			);
			if (!activity) continue;

			for (const facilityTypeName of activityData.facilityTypes) {
				// Find the facility by its Czech name now
				const facility = facilities.find((f) => f.name === facilityTypeName);
				if (facility) {
					await prisma.facilityActivity.create({
						data: {
							facilityId: facility.id,
							activityId: activity.id
						}
					});
					relationCount++;
				} else {
					console.warn(
						`Could not find facility named \'${facilityTypeName}\' to link with activity \'${activity.name}\'`
					);
				}
			}
		}

		console.log(
			`✅ Successfully seeded ${createdActivities.length} activities and ${relationCount} facility-activity relations`
		);
		return createdActivities;
	} catch (error) {
		console.error('Error seeding activities:', error);
		throw error;
	}
}

/**
 * Main function to execute the seed script
 */
async function main() {
	console.log('Starting activities seed script...');

	try {
		const activities = await seedActivities();
		console.log(`Seeded ${activities.length} activities successfully!`);
	} catch (error) {
		console.error('Error seeding activities:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Execute the seed function if this file is run directly
if (require.main === module) {
	main()
		.catch((e) => {
			console.error(e);
			process.exit(1);
		})
		.finally(async () => {
			await prisma.$disconnect();
		});
}

export { seedActivities };
