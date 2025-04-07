import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface FacilityData {
	id?: string;
	name: string;
	description: string;
	capacity: number;
	status: 'active' | 'maintenance' | 'closed';
	openingHour: number;
	closingHour: number;
}

/**
 * Seed the Facility table with various sports facilities
 */
async function seedFacilities() {
	console.log('🏢 Seeding sports facilities...');

	try {
		// Delete existing facilities - wrap in try/catch in case table doesn't exist yet
		const count = await prisma.facility.count();
		if (count > 0) {
			await prisma.facility.deleteMany({});
			console.log('Deleted existing facilities');
		} else {
			console.log('No existing facilities to delete');
		}
	} catch (error) {
		console.log('Could not delete facilities, table might not exist yet');
	}

	// Prepare facilities data
	const facilitiesData: FacilityData[] = [
		{
			name: 'Main Swimming Pool',
			description: 'Olympijský bazén s 8 dráhami a skokanskými můstky',
			capacity: 60,
			status: 'active',
			openingHour: 6, // 6 AM
			closingHour: 22 // 10 PM
		},
		{
			name: 'Tennis Courts',
			description:
				'4 profesionální tenisové kurty s večerním osvětlením a místy pro diváky',
			capacity: 16,
			status: 'active',
			openingHour: 8, // 8 AM
			closingHour: 20 // 8 PM
		},
		{
			name: 'Main Fitness Center',
			description:
				'Moderní posilovna s kardio a silovými stroji, prostorem pro volné váhy',
			capacity: 45,
			status: 'active',
			openingHour: 6, // 6 AM
			closingHour: 23 // 11 PM
		},
		{
			name: 'Basketball Court',
			description:
				'Plnohodnotné basketbalové hřiště s profesionálním povrchem a tribunami',
			capacity: 30,
			status: 'active',
			openingHour: 9, // 9 AM
			closingHour: 21 // 9 PM
		},
		{
			name: 'Yoga Studio',
			description:
				'Klidné studio pro jógu a pilates s bambusovou podlahou a pomůckami',
			capacity: 25,
			status: 'active',
			openingHour: 7, // 7 AM
			closingHour: 21 // 9 PM
		},
		{
			name: 'Squash Courts',
			description: '3 standardní squashové kurty s pozorovací galerií',
			capacity: 6,
			status: 'maintenance',
			openingHour: 8, // 8 AM
			closingHour: 22 // 10 PM
		},
		{
			name: 'Indoor Cycling Studio',
			description:
				'Specializované studio s 20 profesionálními koly a atmosférickým osvětlením',
			capacity: 20,
			status: 'active',
			openingHour: 7, // 7 AM
			closingHour: 21 // 9 PM
		},
		{
			name: 'Multi-purpose Sports Hall',
			description:
				'Velká sportovní hala vhodná pro volejbal, badminton a halový fotbal',
			capacity: 50,
			status: 'active',
			openingHour: 8, // 8 AM
			closingHour: 22 // 10 PM
		},
		{
			name: 'Martial Arts Dojo',
			description:
				'Specializovaný prostor pro bojová umění s tatami podlahou a tréninkovým vybavením',
			capacity: 20,
			status: 'active',
			openingHour: 9, // 9 AM
			closingHour: 21 // 9 PM
		},
		{
			name: 'Outdoor Running Track',
			description: '400m běžecká dráha s 8 dráhami podle regulací',
			capacity: 40,
			status: 'closed',
			openingHour: 6, // 6 AM
			closingHour: 20 // 8 PM
		},
		{
			name: 'Kids Play Area',
			description:
				'Hlídané hřiště pro děti s lezeckými konstrukcemi a měkkými herními prvky',
			capacity: 15,
			status: 'active',
			openingHour: 9, // 9 AM
			closingHour: 19 // 7 PM
		},
		{
			name: 'Rehabilitation Center',
			description: 'Specializované prostory pro fyzioterapii a rehabilitaci',
			capacity: 10,
			status: 'active',
			openingHour: 8, // 8 AM
			closingHour: 18 // 6 PM
		}
	];

	// Insert facilities
	const facilities = await Promise.all(
		facilitiesData.map(async (facility) => {
			return prisma.facility.create({
				data: {
					id: facility.id || randomUUID(),
					name: facility.name,
					description: facility.description,
					capacity: facility.capacity,
					status: facility.status,
					openingHour: facility.openingHour,
					closingHour: facility.closingHour
				}
			});
		})
	);

	console.log(`✅ Successfully seeded ${facilities.length} facilities`);
	return facilities;
}

/**
 * Main function to execute the seed script
 */
async function main() {
	console.log('Starting sports facilities seed script...');

	try {
		const facilities = await seedFacilities();
		console.log(`Seeded ${facilities.length} sports facilities successfully!`);
	} catch (error) {
		console.error('Error seeding sports facilities:', error);
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

export { seedFacilities };
