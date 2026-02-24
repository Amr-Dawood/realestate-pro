import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Developers
    const developer1 = await prisma.developer.create({
        data: {
            name: 'Palm Hills Developments',
            description: 'Leading real estate developer in Egypt with over 25 years of experience',
            website: 'https://palmhillsdevelopments.com',
            phone: '+20 2 3854 0000',
            email: 'info@palmhills.com',
            address: 'Smart Village, Cairo'
        }
    });

    const developer2 = await prisma.developer.create({
        data: {
            name: 'SODIC',
            description: 'Premium lifestyle communities developer',
            website: 'https://sodic.com',
            phone: '+20 2 3854 1111',
            email: 'info@sodic.com',
            address: 'Sheikh Zayed, Giza'
        }
    });

    const developer3 = await prisma.developer.create({
        data: {
            name: 'Emaar Misr',
            description: 'Part of Emaar Properties, developing iconic destinations',
            website: 'https://emaarmisr.com',
            phone: '+20 2 3854 2222',
            email: 'info@emaarmisr.com',
            address: 'New Cairo'
        }
    });

    // Create Compounds
    const compound1 = await prisma.compound.create({
        data: {
            name: 'Palm Hills October',
            location: '6th of October City',
            city: 'Giza',
            type: 'residential',
            status: 'ready',
            description: 'A premium gated community featuring world-class amenities',
            amenities: JSON.stringify(['Swimming Pool', 'Golf Course', 'Club House', 'Gym', 'Kids Area']),
            minPrice: 5000000,
            maxPrice: 25000000,
            totalUnits: 500,
            availableUnits: 120,
            developerId: developer1.id
        }
    });

    const compound2 = await prisma.compound.create({
        data: {
            name: 'Palm Hills New Cairo',
            location: 'New Cairo',
            city: 'Cairo',
            type: 'residential',
            status: 'under_construction',
            deliveryDate: '2026',
            description: 'Modern living in the heart of New Cairo',
            amenities: JSON.stringify(['Swimming Pool', 'Commercial Area', 'Club House', 'Schools']),
            minPrice: 8000000,
            maxPrice: 35000000,
            totalUnits: 800,
            availableUnits: 400,
            developerId: developer1.id
        }
    });

    const compound3 = await prisma.compound.create({
        data: {
            name: 'Villette',
            location: 'New Cairo',
            city: 'Cairo',
            type: 'residential',
            status: 'ready',
            description: 'SODIC flagship compound with French-inspired architecture',
            amenities: JSON.stringify(['Central Park', 'Swimming Pools', 'Sports Facilities', 'Shopping District']),
            minPrice: 6000000,
            maxPrice: 40000000,
            totalUnits: 1200,
            availableUnits: 250,
            developerId: developer2.id
        }
    });

    const compound4 = await prisma.compound.create({
        data: {
            name: 'Mivida',
            location: 'New Cairo',
            city: 'Cairo',
            type: 'mixed',
            status: 'ready',
            description: 'Integrated community by Emaar with premium lifestyle',
            amenities: JSON.stringify(['Golf Course', 'Lake', 'Shopping Mall', 'International Schools', 'Medical Center']),
            minPrice: 10000000,
            maxPrice: 60000000,
            totalUnits: 1500,
            availableUnits: 300,
            developerId: developer3.id
        }
    });

    // Create Units
    const unitsData = [
        // Palm Hills October units
        { type: 'apartment', bedrooms: 2, bathrooms: 2, area: 120, price: 5500000, floor: 3, view: 'garden', finishingType: 'fully_finished', compoundId: compound1.id },
        { type: 'apartment', bedrooms: 3, bathrooms: 2, area: 180, price: 8500000, floor: 5, view: 'pool', finishingType: 'fully_finished', compoundId: compound1.id },
        { type: 'villa', bedrooms: 4, bathrooms: 4, area: 350, price: 15000000, view: 'garden', finishingType: 'semi_finished', compoundId: compound1.id },
        { type: 'duplex', bedrooms: 4, bathrooms: 3, area: 280, price: 12000000, floor: 6, view: 'city', finishingType: 'fully_finished', compoundId: compound1.id },
        { type: 'penthouse', bedrooms: 5, bathrooms: 4, area: 400, price: 22000000, floor: 10, view: 'city', finishingType: 'fully_finished', compoundId: compound1.id },

        // Palm Hills New Cairo units
        { type: 'apartment', bedrooms: 2, bathrooms: 2, area: 130, price: 8000000, floor: 2, view: 'garden', finishingType: 'fully_finished', compoundId: compound2.id },
        { type: 'apartment', bedrooms: 3, bathrooms: 3, area: 200, price: 12000000, floor: 4, view: 'pool', finishingType: 'fully_finished', compoundId: compound2.id },
        { type: 'townhouse', bedrooms: 4, bathrooms: 4, area: 280, price: 18000000, view: 'garden', finishingType: 'core_shell', compoundId: compound2.id },
        { type: 'villa', bedrooms: 5, bathrooms: 5, area: 450, price: 32000000, view: 'garden', finishingType: 'semi_finished', compoundId: compound2.id },

        // Villette units
        { type: 'apartment', bedrooms: 2, bathrooms: 2, area: 115, price: 6500000, floor: 1, view: 'garden', finishingType: 'fully_finished', compoundId: compound3.id },
        { type: 'apartment', bedrooms: 3, bathrooms: 2, area: 170, price: 9800000, floor: 3, view: 'pool', finishingType: 'fully_finished', compoundId: compound3.id },
        { type: 'duplex', bedrooms: 3, bathrooms: 3, area: 220, price: 14000000, floor: 5, view: 'park', finishingType: 'fully_finished', compoundId: compound3.id },
        { type: 'townhouse', bedrooms: 4, bathrooms: 3, area: 260, price: 20000000, view: 'garden', finishingType: 'semi_finished', compoundId: compound3.id },
        { type: 'villa', bedrooms: 5, bathrooms: 5, area: 400, price: 35000000, view: 'garden', finishingType: 'semi_finished', compoundId: compound3.id },

        // Mivida units
        { type: 'studio', bedrooms: 1, bathrooms: 1, area: 60, price: 4500000, floor: 2, view: 'garden', finishingType: 'fully_finished', compoundId: compound4.id },
        { type: 'apartment', bedrooms: 2, bathrooms: 2, area: 140, price: 11000000, floor: 4, view: 'lake', finishingType: 'fully_finished', compoundId: compound4.id },
        { type: 'apartment', bedrooms: 3, bathrooms: 3, area: 210, price: 16000000, floor: 6, view: 'lake', finishingType: 'fully_finished', compoundId: compound4.id },
        { type: 'duplex', bedrooms: 4, bathrooms: 4, area: 320, price: 25000000, floor: 8, view: 'golf', finishingType: 'fully_finished', compoundId: compound4.id },
        { type: 'villa', bedrooms: 5, bathrooms: 5, area: 500, price: 45000000, view: 'golf', finishingType: 'semi_finished', compoundId: compound4.id },
        { type: 'villa', bedrooms: 6, bathrooms: 6, area: 650, price: 58000000, view: 'lake', finishingType: 'core_shell', compoundId: compound4.id },
    ];

    for (const unitData of unitsData) {
        await prisma.unit.create({
            data: {
                ...unitData,
                pricePerSqm: unitData.price / unitData.area,
                available: true
            }
        });
    }

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${3} Developers`);
    console.log(`   - ${4} Compounds`);
    console.log(`   - ${unitsData.length} Units`);
}

// Export for programmatic use (auto-seed in server.js)
export default main;

// Run directly only when invoked as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
