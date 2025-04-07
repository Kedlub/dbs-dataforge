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
				name: 'Swimming - Open Session',
				description: 'Regular swimming session for all skill levels',
				durationMinutes: 60,
				price: 8.99,
				maxParticipants: 30,
				isActive: true,
				facilityTypes: ['Main Swimming Pool']
			},
			{
				name: 'Swimming - Lap Training',
				description: 'Focused session for lap swimmers',
				durationMinutes: 60,
				price: 10.99,
				maxParticipants: 16,
				isActive: true,
				facilityTypes: ['Main Swimming Pool']
			},
			{
				name: 'Swimming Lessons - Beginner',
				description: 'Learn basic swimming techniques',
				durationMinutes: 45,
				price: 15.99,
				maxParticipants: 8,
				isActive: true,
				facilityTypes: ['Main Swimming Pool']
			},
			{
				name: 'Tennis - Singles',
				description: 'Court booking for singles tennis',
				durationMinutes: 60,
				price: 12.99,
				maxParticipants: 2,
				isActive: true,
				facilityTypes: ['Tennis Courts']
			},
			{
				name: 'Tennis - Doubles',
				description: 'Court booking for doubles tennis',
				durationMinutes: 60,
				price: 16.99,
				maxParticipants: 4,
				isActive: true,
				facilityTypes: ['Tennis Courts']
			},
			{
				name: 'Tennis Lessons',
				description: 'Professional tennis coaching for all levels',
				durationMinutes: 60,
				price: 24.99,
				maxParticipants: 6,
				isActive: true,
				facilityTypes: ['Tennis Courts']
			},
			{
				name: 'Gym - Full Access',
				description: 'Full access to all gym equipment',
				durationMinutes: 120,
				price: 9.99,
				maxParticipants: 45,
				isActive: true,
				facilityTypes: ['Main Fitness Center']
			},
			{
				name: 'Personal Training',
				description: 'One-on-one personal training session',
				durationMinutes: 60,
				price: 39.99,
				maxParticipants: 1,
				isActive: true,
				facilityTypes: ['Main Fitness Center']
			},
			{
				name: 'Group Fitness Class',
				description: 'High-intensity interval training in a group setting',
				durationMinutes: 45,
				price: 12.99,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Main Fitness Center', 'Multi-purpose Sports Hall']
			},
			{
				name: 'Basketball - Full Court',
				description: 'Full court booking for basketball games',
				durationMinutes: 60,
				price: 19.99,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Basketball Court']
			},
			{
				name: 'Basketball - Half Court',
				description: 'Half court booking for smaller games or practice',
				durationMinutes: 60,
				price: 12.99,
				maxParticipants: 10,
				isActive: true,
				facilityTypes: ['Basketball Court']
			},
			{
				name: 'Yoga - Beginner',
				description:
					'Introduction to basic yoga poses and breathing techniques',
				durationMinutes: 60,
				price: 12.99,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Yoga Studio']
			},
			{
				name: 'Yoga - Advanced',
				description:
					'Complex poses and sequences for experienced practitioners',
				durationMinutes: 75,
				price: 14.99,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Yoga Studio']
			},
			{
				name: 'Pilates',
				description:
					'Core-strengthening exercises focusing on alignment and control',
				durationMinutes: 60,
				price: 13.99,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Yoga Studio']
			},
			{
				name: 'Squash - Court Booking',
				description: 'Court booking for squash games',
				durationMinutes: 45,
				price: 9.99,
				maxParticipants: 2,
				isActive: false, // Currently inactive due to maintenance
				facilityTypes: ['Squash Courts']
			},
			{
				name: 'Indoor Cycling',
				description: 'High-energy indoor cycling class with music',
				durationMinutes: 45,
				price: 10.99,
				maxParticipants: 20,
				isActive: true,
				facilityTypes: ['Indoor Cycling Studio']
			},
			{
				name: 'Badminton',
				description: 'Court booking for badminton games',
				durationMinutes: 60,
				price: 8.99,
				maxParticipants: 4,
				isActive: true,
				facilityTypes: ['Multi-purpose Sports Hall']
			},
			{
				name: 'Volleyball',
				description: 'Court booking for volleyball games',
				durationMinutes: 60,
				price: 15.99,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Multi-purpose Sports Hall']
			},
			{
				name: 'Martial Arts - Karate',
				description: 'Karate training for all levels',
				durationMinutes: 60,
				price: 11.99,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Martial Arts Dojo']
			},
			{
				name: 'Martial Arts - Judo',
				description: 'Judo training for all levels',
				durationMinutes: 60,
				price: 11.99,
				maxParticipants: 12,
				isActive: true,
				facilityTypes: ['Martial Arts Dojo']
			},
			{
				name: 'Track - Running',
				description: 'Access to the running track for training',
				durationMinutes: 60,
				price: 5.99,
				maxParticipants: 40,
				isActive: false, // Currently inactive due to weather
				facilityTypes: ['Outdoor Running Track']
			},
			{
				name: 'Kids Play Session',
				description: 'Supervised play session for children',
				durationMinutes: 60,
				price: 7.99,
				maxParticipants: 15,
				isActive: true,
				facilityTypes: ['Kids Play Area']
			},
			{
				name: 'Rehabilitation Session',
				description: 'Guided rehabilitation exercises',
				durationMinutes: 45,
				price: 29.99,
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
