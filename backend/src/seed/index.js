require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { User, Service, Booking, Message, AdminAction } = require('../models');
const { ROLES, SERVICE_CATEGORIES, BOOKING_STATES } = require('../config/constants');

const seedData = {
    services: [
        {
            name: 'House Cleaning',
            description: 'Professional cleaning services for your home, including dusting, vacuuming, mopping, and sanitization.',
            category: 'home',
            icon: 'home'
        },
        {
            name: 'Grocery Shopping',
            description: 'We shop for groceries and deliver them to your doorstep.',
            category: 'errands',
            icon: 'cart'
        },
        {
            name: 'Tech Support',
            description: 'Help with computer setup, troubleshooting, and software installation.',
            category: 'tech',
            icon: 'laptop'
        },
        {
            name: 'Elder Care',
            description: 'Companionship and assistance for elderly family members.',
            category: 'care',
            icon: 'heart'
        },
        {
            name: 'Pet Walking',
            description: 'Daily walks and outdoor time for your furry friends.',
            category: 'other',
            icon: 'paw'
        },
        {
            name: 'Furniture Assembly',
            description: 'Assembly of flat-pack furniture from any brand.',
            category: 'home',
            icon: 'construct'
        },
        {
            name: 'Package Pickup',
            description: 'Pick up packages from post office or delivery lockers.',
            category: 'errands',
            icon: 'cube'
        }
    ],

    users: [
        {
            phone: '+1234567890',
            name: 'Admin User',
            role: ROLES.ADMIN
        },
        {
            phone: '+1234567891',
            name: 'Sarah Johnson',
            role: ROLES.CUSTOMER
        },
        {
            phone: '+1234567894',
            name: 'Michael Chen',
            role: ROLES.CUSTOMER
        },
        {
            phone: '+1234567895',
            name: 'Emily Davis',
            role: ROLES.CUSTOMER
        },
        {
            phone: '+1234567892',
            name: 'James Wilson',
            role: ROLES.HELPER,
            helperProfile: {
                isVerified: true,
                verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                bio: 'Professional handyman with 5+ years experience. Specialized in home repairs and furniture assembly.',
                rating: 4.7,
                totalBookings: 47
            }
        },
        {
            phone: '+1234567896',
            name: 'Maria Garcia',
            role: ROLES.HELPER,
            helperProfile: {
                isVerified: true,
                verifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                bio: 'Experienced caregiver and personal assistant. Patient and reliable.',
                rating: 4.9,
                totalBookings: 32
            }
        },
        {
            phone: '+1234567893',
            name: 'David Brown',
            role: ROLES.HELPER,
            helperProfile: {
                isVerified: false,
                bio: 'Recent graduate looking to help with tech support and errands. Fast learner!'
            }
        },
        {
            phone: '+1234567897',
            name: 'Lisa Anderson',
            role: ROLES.HELPER,
            helperProfile: {
                isVerified: false,
                bio: 'Former retail worker, great with grocery shopping and package pickups.'
            }
        }
    ]
};

const seed = async () => {
    try {
        await connectDB();

        console.log('🗑️  Clearing existing data...');
        await AdminAction.deleteMany({});
        await Message.deleteMany({});
        await Booking.deleteMany({});
        await Service.deleteMany({});
        await User.deleteMany({});

        console.log('📦 Seeding services...');
        const services = await Service.insertMany(seedData.services);
        console.log(`   ✓ Created ${services.length} services`);

        // Link services to verified helpers
        const jamesData = seedData.users.find(u => u.name === 'James Wilson');
        const mariaData = seedData.users.find(u => u.name === 'Maria Garcia');
        if (jamesData) {
            jamesData.helperProfile.services = [services[0]._id, services[5]._id]; // Cleaning, Furniture
        }
        if (mariaData) {
            mariaData.helperProfile.services = [services[3]._id, services[1]._id]; // Elder Care, Grocery
        }

        console.log('👤 Seeding users...');
        const users = await User.insertMany(seedData.users);
        console.log(`   ✓ Created ${users.length} users`);

        // Get user references
        const admin = users.find(u => u.role === ROLES.ADMIN);
        const customers = users.filter(u => u.role === ROLES.CUSTOMER);
        const verifiedHelpers = users.filter(u => u.role === ROLES.HELPER && u.helperProfile?.isVerified);
        const pendingHelpers = users.filter(u => u.role === ROLES.HELPER && !u.helperProfile?.isVerified);

        // Set verifiedBy for verified helpers
        for (const helper of verifiedHelpers) {
            await User.findByIdAndUpdate(helper._id, {
                'helperProfile.verifiedBy': admin._id
            });
        }

        console.log('📅 Seeding bookings...');
        const bookings = [];
        const now = new Date();

        // Completed booking (3 days ago)
        bookings.push({
            service: services[0]._id, // House Cleaning
            customer: customers[0]._id,
            helper: verifiedHelpers[0]._id,
            status: BOOKING_STATES.CLOSED,
            description: 'Deep cleaning for 3-bedroom apartment. Please focus on kitchen and bathrooms.',
            location: { address: '123 Main Street, Apt 4B, New York, NY 10001' },
            scheduledAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
            rating: { score: 5, comment: 'Excellent work! James was thorough and professional.' },
            statusHistory: [
                { status: BOOKING_STATES.REQUESTED, changedBy: customers[0]._id, changedAt: new Date(now - 4 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.ACCEPTED, changedBy: verifiedHelpers[0]._id, changedAt: new Date(now - 3.9 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.IN_PROGRESS, changedBy: verifiedHelpers[0]._id, changedAt: new Date(now - 3 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.COMPLETED, changedBy: verifiedHelpers[0]._id, changedAt: new Date(now - 2.8 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.CLOSED, changedBy: customers[0]._id, changedAt: new Date(now - 2.5 * 24 * 60 * 60 * 1000) }
            ]
        });

        // In-progress booking (today)
        bookings.push({
            service: services[3]._id, // Elder Care
            customer: customers[1]._id,
            helper: verifiedHelpers[1]._id,
            status: BOOKING_STATES.IN_PROGRESS,
            description: 'Afternoon companionship for my mother. She enjoys card games and light walks.',
            location: { address: '456 Oak Avenue, Brooklyn, NY 11201' },
            scheduledAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
            statusHistory: [
                { status: BOOKING_STATES.REQUESTED, changedBy: customers[1]._id, changedAt: new Date(now - 1 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.ACCEPTED, changedBy: verifiedHelpers[1]._id, changedAt: new Date(now - 20 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.IN_PROGRESS, changedBy: verifiedHelpers[1]._id, changedAt: new Date(now - 2 * 60 * 60 * 1000) }
            ]
        });

        // Accepted booking (scheduled for tomorrow)
        bookings.push({
            service: services[1]._id, // Grocery Shopping
            customer: customers[0]._id,
            helper: verifiedHelpers[1]._id,
            status: BOOKING_STATES.ACCEPTED,
            description: 'Weekly grocery run - will share shopping list via chat. Include organic produce.',
            location: { address: '789 Pine Street, Manhattan, NY 10003' },
            scheduledAt: new Date(now + 1 * 24 * 60 * 60 * 1000),
            statusHistory: [
                { status: BOOKING_STATES.REQUESTED, changedBy: customers[0]._id, changedAt: new Date(now - 12 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.ACCEPTED, changedBy: verifiedHelpers[1]._id, changedAt: new Date(now - 6 * 60 * 60 * 1000) }
            ]
        });

        // Requested booking (waiting for helper)
        bookings.push({
            service: services[5]._id, // Furniture Assembly
            customer: customers[2]._id,
            status: BOOKING_STATES.REQUESTED,
            description: 'Need help assembling IKEA wardrobe and desk. Tools not required.',
            location: { address: '321 Elm Street, Queens, NY 11375' },
            scheduledAt: new Date(now + 2 * 24 * 60 * 60 * 1000),
            statusHistory: [
                { status: BOOKING_STATES.REQUESTED, changedBy: customers[2]._id, changedAt: new Date(now - 2 * 60 * 60 * 1000) }
            ]
        });

        // Cancelled booking
        bookings.push({
            service: services[2]._id, // Tech Support
            customer: customers[1]._id,
            status: BOOKING_STATES.CANCELLED,
            description: 'Help setting up new laptop and transferring data.',
            location: { address: '555 Tech Lane, Bronx, NY 10451' },
            scheduledAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
            statusHistory: [
                { status: BOOKING_STATES.REQUESTED, changedBy: customers[1]._id, changedAt: new Date(now - 7 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.CANCELLED, changedBy: admin._id, reason: 'Customer requested cancellation due to schedule conflict', changedAt: new Date(now - 6 * 24 * 60 * 60 * 1000) }
            ]
        });

        // Completed booking from 2 weeks ago
        bookings.push({
            service: services[4]._id, // Pet Walking
            customer: customers[2]._id,
            helper: verifiedHelpers[0]._id,
            status: BOOKING_STATES.CLOSED,
            description: 'Daily dog walk for golden retriever named Max. 30-minute walk.',
            location: { address: '888 Park Ave, Manhattan, NY 10021' },
            scheduledAt: new Date(now - 14 * 24 * 60 * 60 * 1000),
            rating: { score: 4, comment: 'Good service, Max seemed happy!' },
            statusHistory: [
                { status: BOOKING_STATES.REQUESTED, changedBy: customers[2]._id, changedAt: new Date(now - 15 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.ACCEPTED, changedBy: verifiedHelpers[0]._id, changedAt: new Date(now - 14.5 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.IN_PROGRESS, changedBy: verifiedHelpers[0]._id, changedAt: new Date(now - 14 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.COMPLETED, changedBy: verifiedHelpers[0]._id, changedAt: new Date(now - 13.9 * 24 * 60 * 60 * 1000) },
                { status: BOOKING_STATES.CLOSED, changedBy: customers[2]._id, changedAt: new Date(now - 13 * 24 * 60 * 60 * 1000) }
            ]
        });

        const createdBookings = await Booking.insertMany(bookings);
        console.log(`   ✓ Created ${createdBookings.length} bookings`);

        console.log('💬 Seeding messages...');
        const messages = [];

        // Messages for the in-progress elder care booking
        const elderCareBooking = createdBookings[1];
        messages.push(
            { booking: elderCareBooking._id, sender: customers[1]._id, content: 'Hi Maria! Mom is looking forward to meeting you today.', createdAt: new Date(now - 18 * 60 * 60 * 1000) },
            { booking: elderCareBooking._id, sender: verifiedHelpers[1]._id, content: 'Hello! I\'m excited to meet her. Does she have any favorite activities?', createdAt: new Date(now - 17 * 60 * 60 * 1000) },
            { booking: elderCareBooking._id, sender: customers[1]._id, content: 'She loves playing rummy and watching old movies. She also enjoys short walks in the garden.', createdAt: new Date(now - 16 * 60 * 60 * 1000) },
            { booking: elderCareBooking._id, sender: verifiedHelpers[1]._id, content: 'Perfect! I\'ll bring a deck of cards. See you soon!', createdAt: new Date(now - 15 * 60 * 60 * 1000) },
            { booking: elderCareBooking._id, sender: verifiedHelpers[1]._id, content: 'Just arrived at the address. Starting now!', createdAt: new Date(now - 2 * 60 * 60 * 1000) }
        );

        // Messages for the grocery shopping booking
        const groceryBooking = createdBookings[2];
        messages.push(
            { booking: groceryBooking._id, sender: customers[0]._id, content: 'Here\'s the list: milk, eggs, bread, apples, spinach, chicken breast, and olive oil.', createdAt: new Date(now - 5 * 60 * 60 * 1000) },
            { booking: groceryBooking._id, sender: verifiedHelpers[1]._id, content: 'Got it! Any brand preferences for the olive oil?', createdAt: new Date(now - 4.5 * 60 * 60 * 1000) },
            { booking: groceryBooking._id, sender: customers[0]._id, content: 'Extra virgin, any Italian brand would be great. Thanks!', createdAt: new Date(now - 4 * 60 * 60 * 1000) }
        );

        // Messages for completed house cleaning
        const cleaningBooking = createdBookings[0];
        messages.push(
            { booking: cleaningBooking._id, sender: customers[0]._id, content: 'The apartment is on the 4th floor. I\'ll leave the key with the doorman.', createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000) },
            { booking: cleaningBooking._id, sender: verifiedHelpers[0]._id, content: 'Perfect, thanks! I have all my supplies. What time works best?', createdAt: new Date(now - 3.9 * 24 * 60 * 60 * 1000) },
            { booking: cleaningBooking._id, sender: customers[0]._id, content: 'Anytime after 10am would be great.', createdAt: new Date(now - 3.8 * 24 * 60 * 60 * 1000) },
            { booking: cleaningBooking._id, sender: verifiedHelpers[0]._id, content: 'All done! I\'ve locked up and left the key with the doorman as requested.', createdAt: new Date(now - 2.9 * 24 * 60 * 60 * 1000) },
            { booking: cleaningBooking._id, sender: customers[0]._id, content: 'The place looks amazing! Thank you so much!', createdAt: new Date(now - 2.8 * 24 * 60 * 60 * 1000) }
        );

        await Message.insertMany(messages);
        console.log(`   ✓ Created ${messages.length} messages`);

        console.log('📋 Seeding admin actions (audit log)...');
        const adminActions = [
            {
                admin: admin._id,
                actionType: 'HELPER_VERIFY',
                targetType: 'User',
                targetId: verifiedHelpers[0]._id,
                reason: 'Background check passed. Professional references verified.',
                createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000)
            },
            {
                admin: admin._id,
                actionType: 'HELPER_VERIFY',
                targetType: 'User',
                targetId: verifiedHelpers[1]._id,
                reason: 'Completed training program. Excellent interview feedback.',
                createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000)
            },
            {
                admin: admin._id,
                actionType: 'BOOKING_CANCEL',
                targetType: 'Booking',
                targetId: createdBookings[4]._id,
                reason: 'Customer requested cancellation due to schedule conflict',
                createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000)
            },
            {
                admin: admin._id,
                actionType: 'USER_DEACTIVATE',
                targetType: 'User',
                targetId: new mongoose.Types.ObjectId(),
                reason: 'Violation of terms of service - inappropriate behavior reported',
                createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000)
            },
            {
                admin: admin._id,
                actionType: 'USER_ACTIVATE',
                targetType: 'User',
                targetId: customers[1]._id,
                reason: 'Account reactivated after review',
                createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000)
            }
        ];

        await AdminAction.insertMany(adminActions);
        console.log(`   ✓ Created ${adminActions.length} admin actions`);

        console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   ✅ Database seeded successfully!                     ║
║                                                        ║
║   Test Accounts (OTP: 123456):                         ║
║   • Admin:     +1234567890                             ║
║   • Customer:  +1234567891 (Sarah Johnson)             ║
║   • Customer:  +1234567894 (Michael Chen)              ║
║   • Customer:  +1234567895 (Emily Davis)               ║
║   • Helper:    +1234567892 (James - verified)          ║
║   • Helper:    +1234567896 (Maria - verified)          ║
║   • Helper:    +1234567893 (David - pending)           ║
║   • Helper:    +1234567897 (Lisa - pending)            ║
║                                                        ║
║   Seeded Data:                                         ║
║   • ${services.length} services                                  ║
║   • ${users.length} users                                        ║
║   • ${createdBookings.length} bookings (various states)                  ║
║   • ${messages.length} messages                                    ║
║   • ${adminActions.length} audit log entries                           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seed();
