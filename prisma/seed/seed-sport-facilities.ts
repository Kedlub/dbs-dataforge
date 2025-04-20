import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';
import { Facility } from '../../src/lib/types';

const prisma = new PrismaClient();

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
	const facilitiesData: Facility[] = [
		{
			id: randomUUID(),
			name: 'Hlavní plavecký bazén',
			description: 'Olympijský bazén s 8 dráhami a skokanskými můstky',
			capacity: 60,
			status: 'ACTIVE',
			openingHour: 6, // 6 AM
			closingHour: 22, // 10 PM
			imageUrl:
				'https://placehold.co/600x400/a2d2ff/31343C?text=Hlavní+plavecký+bazén'
		},
		{
			id: randomUUID(),
			name: 'Tenisové kurty',
			description:
				'4 profesionální tenisové kurty s večerním osvětlením a místy pro diváky',
			capacity: 16,
			status: 'ACTIVE',
			openingHour: 8, // 8 AM
			closingHour: 20, // 8 PM
			imageUrl: 'https://placehold.co/600x400/bde0fe/31343C?text=Tenisové+kurty'
		},
		{
			id: randomUUID(),
			name: 'Hlavní fitness centrum',
			description:
				'Moderní posilovna s kardio a silovými stroji, prostorem pro volné váhy',
			capacity: 45,
			status: 'ACTIVE',
			openingHour: 6, // 6 AM
			closingHour: 23, // 11 PM
			imageUrl:
				'https://placehold.co/600x400/ffafcc/31343C?text=Hlavní+fitness+centrum'
		},
		{
			id: randomUUID(),
			name: 'Basketbalové hřiště',
			description:
				'Plnohodnotné basketbalové hřiště s profesionálním povrchem a tribunami',
			capacity: 30,
			status: 'ACTIVE',
			openingHour: 9, // 9 AM
			closingHour: 21, // 9 PM
			imageUrl:
				'https://placehold.co/600x400/ffc8dd/31343C?text=Basketbalové+hřiště'
		},
		{
			id: randomUUID(),
			name: 'Jóga studio',
			description:
				'Klidné studio pro jógu a pilates s bambusovou podlahou a pomůckami',
			capacity: 25,
			status: 'ACTIVE',
			openingHour: 7, // 7 AM
			closingHour: 21, // 9 PM
			imageUrl: 'https://placehold.co/600x400/cdb4db/31343C?text=Jóga+studio'
		},
		{
			id: randomUUID(),
			name: 'Squashové kurty',
			description: '3 standardní squashové kurty s pozorovací galerií',
			capacity: 6,
			status: 'MAINTENANCE',
			openingHour: 8, // 8 AM
			closingHour: 22, // 10 PM
			imageUrl:
				'https://placehold.co/600x400/b7e4c7/31343C?text=Squashové+kurty'
		},
		{
			id: randomUUID(),
			name: 'Studio pro indoor cycling',
			description:
				'Specializované studio s 20 profesionálními koly a atmosférickým osvětlením',
			capacity: 20,
			status: 'ACTIVE',
			openingHour: 7, // 7 AM
			closingHour: 21, // 9 PM
			imageUrl:
				'https://placehold.co/600x400/90e0ef/31343C?text=Studio+pro+indoor+cycling'
		},
		{
			id: randomUUID(),
			name: 'Víceúčelová sportovní hala',
			description:
				'Velká sportovní hala vhodná pro volejbal, badminton a halový fotbal',
			capacity: 50,
			status: 'ACTIVE',
			openingHour: 8, // 8 AM
			closingHour: 22, // 10 PM
			imageUrl:
				'https://placehold.co/600x400/f7cad0/31343C?text=Víceúčelová+sportovní+hala'
		},
		{
			id: randomUUID(),
			name: 'Dojo bojových umění',
			description:
				'Specializovaný prostor pro bojová umění s tatami podlahou a tréninkovým vybavením',
			capacity: 20,
			status: 'ACTIVE',
			openingHour: 9, // 9 AM
			closingHour: 21, // 9 PM
			imageUrl:
				'https://placehold.co/600x400/f9bec7/31343C?text=Dojo+bojových+umění'
		},
		{
			id: randomUUID(),
			name: 'Venkovní běžecká dráha',
			description: '400m běžecká dráha s 8 dráhami podle regulací',
			capacity: 40,
			status: 'CLOSED',
			openingHour: 6, // 6 AM
			closingHour: 20, // 8 PM
			imageUrl:
				'https://placehold.co/600x400/d4e09b/31343C?text=Venkovní+běžecká+dráha'
		},
		{
			id: randomUUID(),
			name: 'Dětský koutek',
			description:
				'Hlídané hřiště pro děti s lezeckými konstrukcemi a měkkými herními prvky',
			capacity: 15,
			status: 'ACTIVE',
			openingHour: 9, // 9 AM
			closingHour: 19, // 7 PM
			imageUrl: 'https://placehold.co/600x400/fff3b0/31343C?text=Dětský+koutek'
		},
		{
			id: randomUUID(),
			name: 'Rehabilitační centrum',
			description: 'Specializované prostory pro fyzioterapii a rehabilitaci',
			capacity: 10,
			status: 'ACTIVE',
			openingHour: 8, // 8 AM
			closingHour: 18, // 6 PM
			imageUrl:
				'https://placehold.co/600x400/cbf3f0/31343C?text=Rehabilitační+centrum'
		}
	];

	// Insert facilities
	const facilities = await Promise.all(
		facilitiesData.map(async (facility) => {
			return prisma.facility.create({
				data: {
					id: facility.id,
					name: facility.name,
					description: facility.description,
					capacity: facility.capacity,
					status: facility.status,
					openingHour: facility.openingHour,
					closingHour: facility.closingHour,
					imageUrl: facility.imageUrl
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
