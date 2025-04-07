import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface ActivityData {
	id?: string;
	name: string;
	description: string;
	durationMinutes: number;
	price: number;
	maxParticipants: number;
	isActive: boolean;
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

		// Prepare activities data
		const activitiesData: ActivityData[] = [
			{
				name: 'Plavání - Volná plavba',
				description: 'Běžné plavání pro všechny úrovně dovedností',
				durationMinutes: 60,
				price: 199,
				maxParticipants: 30,
				isActive: true,
				facilityTypes: ['Main Swimming Pool']
			},
			{
				name: 'Plavání - Trénink na dráhách',
				description: 'Zaměřeno na kondiční plavání v dráhách',
				durationMinutes: 60,
				price: 249,
				maxParticipants: 16,
				isActive: true,
				facilityTypes: ['Main Swimming Pool']
			},
			{
				name: 'Plavecké lekce - Začátečníci',
				description: 'Naučte se základní plavecké techniky',
				durationMinutes: 45,
				price: 349,
				maxParticipants: 8,
				isActive: true,
				facilityTypes: ['Main Swimming Pool']
			},
			{
				name: 'Tenis - Dvouhra',
				description: 'Rezervace kurtu pro tenisovou dvouhru',
				durationMinutes: 60,
				price: 299,
				maxParticipants: 2,
				isActive: true,
				facilityTypes: ['Tennis Courts']
			},
			{
				name: 'Tenis - Čtyřhra',
				description: 'Rezervace kurtu pro tenisovou čtyřhru',
				durationMinutes: 60,
				price: 399,
				maxParticipants: 4,
				isActive: true,
				facilityTypes: ['Tennis Courts']
			},
			{
				name: 'Tenisové lekce',
				description: 'Profesionální tenisový trénink pro všechny úrovně',
				durationMinutes: 60,
				price: 599,
				maxParticipants: 6,
				isActive: true,
				facilityTypes: ['Tennis Courts']
			},
			{
				name: 'Posilovna - Plný přístup',
				description: 'Plný přístup ke všem posilovacím strojům a vybavení',
				durationMinutes: 120,
				price: 229,
				maxParticipants: 45,
				isActive: true,
				facilityTypes: ['Main Fitness Center']
			},
			{
				name: 'Osobní trénink',
				description: 'Individuální trénink s osobním trenérem',
				durationMinutes: 60,
				price: 899,
				maxParticipants: 1,
				isActive: true,
				facilityTypes: ['Main Fitness Center']
			},
			{
				name: 'Skupinový fitness trénink',
				description: 'Vysoce intenzivní intervalový trénink ve skupině',
				durationMinutes: 45,
				price: 299,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Main Fitness Center', 'Multi-purpose Sports Hall']
			},
			{
				name: 'Basketbal - Celé hřiště',
				description: 'Rezervace celého hřiště pro basketbalové zápasy',
				durationMinutes: 60,
				price: 499,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Basketball Court']
			},
			{
				name: 'Basketbal - Poloviční hřiště',
				description: 'Rezervace poloviny hřiště pro menší hry nebo tréninky',
				durationMinutes: 60,
				price: 299,
				maxParticipants: 10,
				isActive: true,
				facilityTypes: ['Basketball Court']
			},
			{
				name: 'Jóga - Začátečníci',
				description: 'Úvod do základních jógových pozic a dechových technik',
				durationMinutes: 60,
				price: 299,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Yoga Studio']
			},
			{
				name: 'Jóga - Pokročilí',
				description: 'Složitější pozice a sekvence pro zkušené praktikanty',
				durationMinutes: 75,
				price: 349,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Yoga Studio']
			},
			{
				name: 'Pilates',
				description:
					'Cvičení zaměřené na posílení středu těla, držení a kontrolu',
				durationMinutes: 60,
				price: 329,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Yoga Studio']
			},
			{
				name: 'Squash - Rezervace kurtu',
				description: 'Rezervace kurtu pro squash',
				durationMinutes: 45,
				price: 229,
				maxParticipants: 2,
				isActive: false, // Currently inactive due to maintenance
				facilityTypes: ['Squash Courts']
			},
			{
				name: 'Indoor cycling',
				description: 'Energický indoor cycling s hudbou',
				durationMinutes: 45,
				price: 249,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Indoor Cycling Studio']
			},
			{
				name: 'Badminton',
				description: 'Rezervace kurtu pro badminton',
				durationMinutes: 60,
				price: 199,
				maxParticipants: 4,
				isActive: true,
				facilityTypes: ['Multi-purpose Sports Hall']
			},
			{
				name: 'Volejbal',
				description: 'Rezervace kurtu pro volejbal',
				durationMinutes: 60,
				price: 399,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Multi-purpose Sports Hall']
			},
			{
				name: 'Bojové umění - Karate',
				description: 'Trénink karate pro všechny úrovně',
				durationMinutes: 60,
				price: 279,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Martial Arts Dojo']
			},
			{
				name: 'Bojové umění - Judo',
				description: 'Trénink juda pro všechny úrovně',
				durationMinutes: 60,
				price: 279,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Martial Arts Dojo']
			},
			{
				name: 'Dráha - Běhání',
				description: 'Přístup na běžeckou dráhu pro trénink',
				durationMinutes: 60,
				price: 149,
				maxParticipants: 40,
				isActive: false, // Currently inactive due to weather
				facilityTypes: ['Outdoor Running Track']
			},
			{
				name: 'Dětský koutek',
				description: 'Hlídaná herna pro děti',
				durationMinutes: 60,
				price: 199,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Kids Play Area']
			},
			{
				name: 'Rehabilitační cvičení',
				description: 'Individuální rehabilitační cvičení s odborníkem',
				durationMinutes: 45,
				price: 699,
				maxParticipants: 1,
				isActive: true,
				facilityTypes: ['Rehabilitation Center']
			}
		];

		// Insert activities
		const activities = [];
		for (const activityData of activitiesData) {
			const { facilityTypes, ...activityDetails } = activityData;

			// Create the activity
			const activity = await prisma.activity.create({
				data: {
					id: activityDetails.id || randomUUID(),
					name: activityDetails.name,
					description: activityDetails.description,
					durationMinutes: activityDetails.durationMinutes,
					price: activityDetails.price,
					maxParticipants: activityDetails.maxParticipants,
					isActive: activityDetails.isActive
				}
			});

			activities.push(activity);

			// Create facility-activity relations
			for (const facilityName of facilityTypes) {
				const facility = facilities.find((f) => f.name === facilityName);
				if (facility) {
					await prisma.facilityActivity.create({
						data: {
							facilityId: facility.id,
							activityId: activity.id
						}
					});
				}
			}
		}

		console.log(`✅ Successfully seeded ${activities.length} activities`);
		return activities;
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
